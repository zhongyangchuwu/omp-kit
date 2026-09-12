from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

import pytest
import yaml

from scripts import install_harness as ih
from scripts.harness_config import ConfigError, compose, merge

ROOT = Path(__file__).resolve().parents[1]


def make_repo(root: Path) -> Path:
    root.mkdir(parents=True)
    (root / 'config/profiles').mkdir(parents=True)
    (root / 'agents').mkdir()
    skill = root / 'skills/bounded-executor'
    skill.mkdir(parents=True)
    (skill / 'SKILL.md').write_text('---\nname: bounded-executor\ndescription: Test executor\n---\nText\n')
    (root / 'registry.yaml').write_text('skills:\n  bounded-executor:\n    status: active\n    path: skills/bounded-executor\ndrafts: {}\n')
    (root / 'config/config.yml').write_text('modelRoles:\n  default: cpa/luna:high\n  fast_worker: cpa/luna:high\ncompaction:\n  methodOrder: [remote, soft]\n')
    (root / 'config/models.yml').write_text('providers:\n  cpa:\n    baseUrl: http://localhost:8317/v1\n    api: openai-responses\n    apiKey: CPA_API_KEY\n    models:\n      - id: luna\n        contextWindow: 10000\n        maxTokens: 1000\n')
    (root / 'config/APPEND_SYSTEM.md').write_text('Use the workflow for coordinated tasks.\n')
    (root / 'config/profiles/headless.yml').write_text('symbolPreset: ascii\nbrowser:\n  enabled: false\n')
    (root / 'agents/worker.md').write_text('---\nname: worker\ndescription: Test worker\nmodel: "@fast_worker"\ntools: [read, edit]\nautoloadSkills: [bounded-executor]\n---\nWork\n')
    return root


@pytest.fixture
def dirs(tmp_path: Path) -> tuple[Path, Path]:
    return make_repo(tmp_path / 'repo'), tmp_path / 'agent'


def install(dirs, **kwargs):
    repo, root = dirs
    return ih.install_harness(repo_root=repo, agent_root=root, **kwargs)


def test_clean_copy_install_and_idempotent_reinstall(dirs):
    actions = install(dirs)
    _, root = dirs
    assert len(actions) == 5
    assert not (root / 'skills/bounded-executor').is_symlink()
    assert not (root / 'agents/worker.md').is_symlink()
    manifest = ih.read_manifest(root)
    again = install(dirs)
    assert all(a.kind == 'unchanged' for a in again)
    assert ih.read_manifest(root) == manifest


def test_preview_never_creates_runtime_root(dirs):
    actions = install(dirs, dry_run=True)
    assert any(a.kind == 'install' for a in actions)
    assert not dirs[1].exists()


def test_all_conflicts_checked_before_any_install(dirs):
    _, root = dirs
    root.mkdir()
    (root / 'models.yml').write_text('old: true\n')
    with pytest.raises(ih.InstallError, match='nothing installed'):
        install(dirs)
    assert not (root / 'config.yml').exists()
    assert not (root / 'skills').exists()
    assert not (root / '.omp-kit').exists()


def test_force_backup_and_rollback_preserve_unrelated_files(dirs):
    _, root = dirs
    root.mkdir()
    old = b'modelRoles: {}\nsetupVersion: 2\ndev:\n  autoqaConsent: granted\n'
    (root / 'config.yml').write_bytes(old)
    (root / '.env').write_text('CPA_API_KEY=private-test-value\n')
    (root / 'agent.db').write_bytes(b'not-a-real-database')
    (root / 'skills/unrelated').mkdir(parents=True)
    install(dirs, force=True)
    new = yaml.safe_load((root / 'config.yml').read_text())
    assert new['setupVersion'] == 2
    assert new['dev']['autoqaConsent'] == 'granted'
    txn = ih.read_manifest(root)['transaction']
    assert (root / '.omp-kit/backups' / txn / 'files/config.yml').read_bytes() == old
    ih.rollback(root)
    assert (root / 'config.yml').read_bytes() == old
    assert (root / '.env').read_text() == 'CPA_API_KEY=private-test-value\n'
    assert (root / 'agent.db').read_bytes() == b'not-a-real-database'
    assert (root / 'skills/unrelated').is_dir()
    assert not (root / 'models.yml').exists()


def test_new_machine_does_not_receive_setup_or_consent(dirs):
    install(dirs)
    data = yaml.safe_load((dirs[1] / 'config.yml').read_text())
    assert 'setupVersion' not in data
    assert 'dev' not in data


def test_update_managed_unchanged_target_without_force(dirs):
    repo, root = dirs
    install(dirs)
    (repo / 'config/APPEND_SYSTEM.md').write_text('New entry point\n')
    actions = install(dirs)
    assert (root / 'APPEND_SYSTEM.md').read_text() == 'New entry point\n'
    assert any(a.kind == 'replace' for a in actions)
    ih.rollback(root)
    assert 'Use the workflow' in (root / 'APPEND_SYSTEM.md').read_text()


def test_local_drift_refused_and_newer_work_blocks_rollback(dirs):
    install(dirs)
    (dirs[1] / 'agents/worker.md').write_text('Local work\n')
    with pytest.raises(ih.InstallError, match='local drift'):
        install(dirs)
    with pytest.raises(ih.InstallError, match='new local work'):
        ih.rollback(dirs[1])


def test_retire_only_manifest_owned_resources(dirs):
    repo, root = dirs
    install(dirs)
    (root / 'agents/unrelated.md').write_text('Leave alone\n')
    (repo / 'agents/worker.md').unlink()
    install(dirs)
    assert not (root / 'agents/worker.md').exists()
    assert (root / 'agents/unrelated.md').read_text() == 'Leave alone\n'
    ih.rollback(root)
    assert (root / 'agents/worker.md').exists()


def test_legacy_yaml_aliases_backed_up_and_restored(dirs):
    _, root = dirs
    root.mkdir()
    (root / 'config.yaml').write_text('setupVersion: 2\n')
    (root / 'models.yaml').write_text('providers: {}\n')
    with pytest.raises(ih.InstallError):
        install(dirs)
    install(dirs, force=True)
    assert not (root / 'config.yaml').exists()
    assert not (root / 'models.yaml').exists()
    ih.rollback(root)
    assert (root / 'config.yaml').read_text() == 'setupVersion: 2\n'
    assert (root / 'models.yaml').exists()


def test_profiles_cpa_url_and_external_local_directory_persist(dirs, tmp_path):
    repo, root = dirs
    local = tmp_path / 'local'
    local.mkdir()
    (local / 'config.yml').write_text('task:\n  maxConcurrency: 3\n')
    install(dirs, profiles=['headless'], local_dir=local, cpa_url='https://example.test/v1')
    assert all(a.kind == 'unchanged' for a in install(dirs))
    config = yaml.safe_load((root / 'config.yml').read_text())
    models = yaml.safe_load((root / 'models.yml').read_text())
    assert config['symbolPreset'] == 'ascii'
    assert config['task']['maxConcurrency'] == 3
    assert models['providers']['cpa']['baseUrl'] == 'https://example.test/v1'
    install(dirs, profiles=[])
    assert 'symbolPreset' not in yaml.safe_load((root / 'config.yml').read_text())


def test_deep_mapping_merge_and_array_replacement():
    base = {'x': {'a': 1, 'b': [1, 2]}}
    assert merge(base, {'x': {'b': [3]}}) == {'x': {'a': 1, 'b': [3]}}
    assert base['x']['b'] == [1, 2]


@pytest.mark.parametrize('bad', ['../bad', '/bad', 'a/b', '..\\bad'])
def test_invalid_profile_rejected_before_writes(dirs, bad):
    with pytest.raises(ConfigError):
        install(dirs, profiles=[bad])
    assert not dirs[1].exists()


@pytest.mark.parametrize('bad', ['https://user:secret@example.test/v1', 'https://example.test/v1?token=x', 'file:///etc', 'https://example.test/v1#key'])
def test_credential_bearing_or_invalid_url_rejected(dirs, bad):
    with pytest.raises(ConfigError):
        install(dirs, cpa_url=bad)
    assert not dirs[1].exists()


def test_duplicate_yaml_keys_rejected(dirs):
    (dirs[0] / 'config/config.yml').write_text('modelRoles: {}\nmodelRoles: {}\n')
    with pytest.raises(ConfigError, match='Duplicate'):
        install(dirs)
    assert not dirs[1].exists()


def test_literal_secret_rejected_without_echo(dirs):
    p = dirs[0] / 'config/models.yml'
    p.write_text(p.read_text().replace('CPA_API_KEY', 'private-credential-value'))
    with pytest.raises(ConfigError) as exc:
        install(dirs)
    assert 'private-credential-value' not in str(exc.value)


def test_unsupported_price_tiers_rejected(dirs):
    p = dirs[0] / 'config/models.yml'
    data = yaml.safe_load(p.read_text())
    data['providers']['cpa']['models'][0]['cost'] = {'tiers': []}
    p.write_text(yaml.safe_dump(data))
    with pytest.raises(ConfigError, match='cost fields'):
        install(dirs)


def test_missing_agent_skill_or_role_rejected(dirs):
    p = dirs[0] / 'agents/worker.md'
    p.write_text(p.read_text().replace('bounded-executor]', 'missing]'))
    with pytest.raises(ConfigError, match='autoload'):
        install(dirs)


def test_missing_model_rejected(dirs):
    p = dirs[0] / 'config/config.yml'
    p.write_text(p.read_text().replace('cpa/luna', 'cpa/missing'))
    with pytest.raises(ConfigError, match='undefined custom model'):
        install(dirs)


def symlink_or_skip(target: Path, source: Path, directory: bool = False):
    try:
        target.symlink_to(source, target_is_directory=directory)
    except OSError:
        pytest.skip('symlink privilege unavailable on this platform')


def test_parent_symlink_never_followed_even_with_force(dirs, tmp_path):
    _, root = dirs
    outside = tmp_path / 'outside'
    outside.mkdir()
    root.mkdir()
    symlink_or_skip(root / 'skills', outside, True)
    with pytest.raises(ih.InstallError, match='Parent'):
        install(dirs, force=True)
    assert list(outside.iterdir()) == []
    assert not (root / 'config.yml').exists()


def test_individual_legacy_skill_link_migrates_without_touching_source(dirs, tmp_path):
    _, root = dirs
    outside = tmp_path / 'old-skill'
    outside.mkdir()
    (outside / 'keep').write_text('original')
    (root / 'skills').mkdir(parents=True)
    link = root / 'skills/bounded-executor'
    symlink_or_skip(link, outside, True)
    install(dirs, force=True)
    assert not link.is_symlink()
    assert (outside / 'keep').read_text() == 'original'
    ih.rollback(root)
    assert link.is_symlink()
    assert link.resolve() == outside.resolve()


def test_source_symlink_refused(dirs, tmp_path):
    private = tmp_path / 'private'
    private.write_text('private')
    symlink_or_skip(dirs[0] / 'skills/bounded-executor/link', private)
    with pytest.raises(ih.InstallError, match='Source contains'):
        install(dirs)
    assert not dirs[1].exists()


def test_local_caches_and_env_not_copied(dirs):
    p = dirs[0] / 'skills/bounded-executor'
    (p / '.env').write_text('SECRET=do-not-copy')
    (p / '__pycache__').mkdir()
    (p / '__pycache__/x.pyc').write_bytes(b'x')
    (p / '.env.example').write_text('NAME=')
    install(dirs)
    out = dirs[1] / 'skills/bounded-executor'
    assert not (out / '.env').exists()
    assert not (out / '__pycache__').exists()
    assert (out / '.env.example').exists()


def test_install_error_restores_all_applied_targets(dirs, monkeypatch):
    repo, root = dirs
    root.mkdir()
    (root / 'APPEND_SYSTEM.md').write_text('original append')
    original = ih.os.replace
    failed = False

    def fail_once(src, dst):
        nonlocal failed
        if Path(dst) == root / 'models.yml' and not failed:
            failed = True
            raise OSError('simulated replace failure')
        return original(src, dst)

    monkeypatch.setattr(ih.os, 'replace', fail_once)
    with pytest.raises(OSError, match='simulated'):
        install(dirs, force=True)
    assert (root / 'APPEND_SYSTEM.md').read_text() == 'original append'
    assert not (root / 'config.yml').exists()
    assert not (root / 'agents/worker.md').exists()
    assert not ih.read_manifest(root)
    assert not (root / '.omp-kit/install.lock').exists()


def test_lock_refuses_concurrent_install(dirs):
    _, root = dirs
    (root / '.omp-kit/install.lock').mkdir(parents=True)
    with pytest.raises(ih.InstallError, match='already running'):
        install(dirs)
    assert not (root / 'config.yml').exists()


def test_pending_transaction_blocks_install_until_rollback(dirs):
    install(dirs)
    _, root = dirs
    manifest = ih.read_manifest(root)
    path = root / '.omp-kit/backups' / manifest['transaction'] / 'transaction.json'
    journal = json.loads(path.read_text())
    journal['status'] = 'prepared'
    path.write_text(json.dumps(journal))
    with pytest.raises(ih.InstallError, match='interrupted'):
        install(dirs)
    ih.rollback(root)
    assert not (root / 'config.yml').exists()


def test_unsafe_manifest_paths_rejected(dirs):
    install(dirs)
    path = dirs[1] / '.omp-kit/manifest.json'
    data = json.loads(path.read_text())
    data['units']['../../outside'] = 'bad'
    path.write_text(json.dumps(data))
    with pytest.raises(ih.InstallError, match='Invalid unit'):
        install(dirs, force=True)


def test_default_root_ignores_agent_override_but_respects_pi_config_dir(monkeypatch):
    monkeypatch.setenv('AGENT_ROOT', '/old-root')
    monkeypatch.setenv('PI_CODING_AGENT_DIR', '/native-root')
    monkeypatch.setenv('PI_CONFIG_DIR', '.omp-alt')
    assert ih.default_agent_root() == Path.home() / '.omp-alt/agent'


def test_native_profile_root_matches_omp_profile_grammar(monkeypatch):
    monkeypatch.setenv('PI_CONFIG_DIR', '.omp-test')
    config_root = Path.home() / '.omp-test'
    assert ih.native_profile_agent_root('harness-v2-test') == config_root / 'profiles/harness-v2-test/agent'
    assert ih.native_profile_agent_root('work.dev') == config_root / 'profiles/work.dev/agent'
    assert ih.native_profile_agent_root('work_2') == config_root / 'profiles/work_2/agent'
    assert ih.native_profile_agent_root('default') == config_root / 'agent'


@pytest.mark.parametrize('bad', ['../unsafe', 'Work', 'con', 'con.foo', 'name.', 'a/b'])
def test_native_profile_rejects_names_omp_rejects(monkeypatch, bad):
    monkeypatch.setenv('PI_CONFIG_DIR', '.omp-test')
    with pytest.raises(ih.ConfigError, match='Invalid OMP profile'):
        ih.native_profile_agent_root(bad)


def test_cli_accepts_config_profile_and_legacy_alias(dirs, tmp_path):
    for flag in ('--config-profile', '--profile'):
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/install_harness.py'),
                                 '--repo-root', str(dirs[0]), '--agent-root', str(dirs[1]),
                                 flag, 'headless', '--dry-run'],
                                cwd=tmp_path, capture_output=True, text=True)
        assert result.returncode == 0, result.stderr
        assert 'Dry run only' in result.stdout
        assert not dirs[1].exists()


def test_native_omp_profile_cli_selects_profile_root(dirs, tmp_path):
    home = tmp_path / 'home'
    env = {**os.environ, 'HOME': str(home), 'PI_CONFIG_DIR': '.omp-alt'}
    env.pop('OMP_PROFILE', None)
    env.pop('PI_PROFILE', None)
    result = subprocess.run([sys.executable, str(ROOT / 'scripts/install_harness.py'),
                             '--repo-root', str(dirs[0]), '--omp-profile', 'harness-v2-test',
                             '--dry-run'], cwd=tmp_path, capture_output=True, text=True, env=env)
    assert result.returncode == 0, result.stderr
    assert str(home / '.omp-alt/profiles/harness-v2-test/agent') in result.stdout
    assert not (home / '.omp-alt').exists()


def test_cli_refuses_implicit_nondefault_active_omp_profile(dirs, tmp_path):
    home = tmp_path / 'home'
    env = {**os.environ, 'HOME': str(home), 'OMP_PROFILE': 'work'}
    env.pop('PI_PROFILE', None)
    result = subprocess.run([sys.executable, str(ROOT / 'scripts/install_harness.py'),
                             '--repo-root', str(dirs[0]), '--dry-run'],
                            cwd=tmp_path, capture_output=True, text=True, env=env)
    assert result.returncode == 1
    assert "Active OMP profile 'work' detected" in result.stderr
    assert '--omp-profile work' in result.stderr
    assert not (home / '.omp').exists()


def test_cli_explicit_default_profile_overrides_active_profile_env(dirs, tmp_path):
    home = tmp_path / 'home'
    env = {**os.environ, 'HOME': str(home), 'OMP_PROFILE': 'work'}
    result = subprocess.run([sys.executable, str(ROOT / 'scripts/install_harness.py'),
                             '--repo-root', str(dirs[0]), '--omp-profile', 'default', '--dry-run'],
                            cwd=tmp_path, capture_output=True, text=True, env=env)
    assert result.returncode == 0, result.stderr
    assert str(home / '.omp/agent') in result.stdout
    assert str(home / '.omp/profiles/work/agent') not in result.stdout


def test_omp_profile_env_precedence_matches_omp(monkeypatch):
    monkeypatch.setenv('PI_PROFILE', 'legacy')
    monkeypatch.setenv('OMP_PROFILE', '')
    assert ih.active_omp_profile_from_env() is None
    monkeypatch.setenv('OMP_PROFILE', 'work.dev')
    assert ih.active_omp_profile_from_env() == 'work.dev'


def test_native_and_arbitrary_roots_have_different_doctor_readiness(dirs, tmp_path, monkeypatch):
    monkeypatch.setattr(ih.shutil, 'which', lambda _: '/fake/omp')
    monkeypatch.setenv('CPA_API_KEY', 'test-key')
    monkeypatch.delenv('PI_CONFIG_DIR', raising=False)
    install(dirs)
    messages, ready = ih.doctor(dirs[1])
    assert not ready and any('not a native OMP agent/profile root' in m for m in messages)
    home = tmp_path / 'home'
    monkeypatch.setenv('HOME', str(home))
    native = home / '.omp/agent'
    ih.install_harness(repo_root=dirs[0], agent_root=native)
    messages, ready = ih.doctor(native)
    assert ready and not any('not a native OMP agent/profile root' in m for m in messages)


def test_offline_doctor_hides_secret_and_reports_missing(dirs, monkeypatch):
    install(dirs)
    monkeypatch.delenv('CPA_API_KEY', raising=False)
    monkeypatch.setattr(ih.shutil, 'which', lambda _: '/fake/omp')
    messages, ready = ih.doctor(dirs[1])
    assert not ready and any('MISSING: CPA_API_KEY' in m for m in messages)
    assert any('not a native OMP agent/profile root' in m for m in messages)
    (dirs[1] / '.env').write_text('CPA_API_KEY="private-value"\n')
    messages, ready = ih.doctor(dirs[1])
    assert not ready
    assert 'private-value' not in '\n'.join(messages)
    assert any('UNVERIFIED:' in m for m in messages)


def test_cli_works_from_unrelated_directory_without_writes(dirs, tmp_path):
    result = subprocess.run([sys.executable, str(ROOT / 'scripts/install_harness.py'),
                             '--repo-root', str(dirs[0]), '--agent-root', str(dirs[1]), '--dry-run'],
                            cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert 'Dry run only' in result.stdout
    assert not dirs[1].exists()


def test_shipped_source_configuration_and_agent_contracts(tmp_path):
    # Exercise actual shipped config and agent files using an isolated resource fixture;
    # the full registry and every skill's source are checked by the existing root suite.
    repo = make_repo(tmp_path / 'source-check')
    shutil.copytree(ROOT / 'config', repo / 'config', dirs_exist_ok=True)
    shutil.rmtree(repo / 'agents')
    shutil.copytree(ROOT / 'agents', repo / 'agents')
    (repo / 'skills/omp-review').mkdir()
    (repo / 'skills/omp-review/SKILL.md').write_text('---\nname: omp-review\ndescription: Fixture review\n---\n')
    data = yaml.safe_load((repo / 'registry.yaml').read_text())
    data['skills']['omp-review'] = {'status': 'active', 'path': 'skills/omp-review'}
    (repo / 'registry.yaml').write_text(yaml.safe_dump(data))
    config, models = compose(repo, tmp_path / 'no-local', [])
    assert config['task']['maxConcurrency'] == 4
    assert config['compaction']['methodOrder'] == ['remote', 'soft']
    assert config['compaction']['experimentalContextManagement'] is True
    assert 'setupVersion' not in config and 'dev' not in config
    cpa = models['providers']['cpa']
    assert cpa['baseUrl'] == 'http://localhost:8317/v1'
    assert cpa['api'] == 'openai-responses' and cpa['apiKey'] == 'CPA_API_KEY'
    assert len(cpa['models']) == 4
    assert len(models['providers']['deepseek']['models']) == 2
    assert all('tiers' not in m.get('cost', {}) for m in cpa['models'])
    assert all(m.get('compactionModel') == 'cpa/gpt-5.6-luna' for m in cpa['models'] if m['id'] != 'gpt-5.6-luna')
    headless, _ = compose(repo, tmp_path / 'no-local', ['headless'])
    assert not headless['browser']['enabled'] and headless['symbolPreset'] == 'ascii'
    legacy, _ = compose(repo, tmp_path / 'no-local', ['legacy-context'])
    assert not legacy['compaction']['experimentalContextManagement']
    assert legacy['compaction']['methodOrder'] == ['shake', 'soft']


def test_dry_run_cannot_accidentally_execute_rollback(dirs, tmp_path):
    install(dirs)
    before = ih.read_manifest(dirs[1])
    result = subprocess.run([sys.executable, str(ROOT / 'scripts/install_harness.py'),
                             '--agent-root', str(dirs[1]), '--rollback', '--dry-run'],
                            cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 2
    assert ih.read_manifest(dirs[1]) == before
