# /// script
# requires-python = ">=3.12"
# dependencies = ["PyYAML==6.0.3"]
# ///
"""Copy the portable harness into an OMP root with preflight, backups and rollback.

Run via `uv run --script scripts/install_harness.py`. No just, symlink privileges,
provider requests, or credentials are needed to render/validate/preview an install.
Close OMP before applying: the installer lock does not lock OMP's own config writer.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tempfile
from typing import Iterator
import uuid

try:
    from scripts.harness_config import (ConfigError, ENV_NAME, SAFE_NAME, active_skills, compose,
                                        load_mapping, validate_url, yaml_bytes)
except ModuleNotFoundError as exc:
    if exc.name not in {'scripts', 'scripts.harness_config'}:
        raise
    from harness_config import (ConfigError, ENV_NAME, SAFE_NAME, active_skills, compose,
                                load_mapping, validate_url, yaml_bytes)

STATE_VERSION = 1
IGNORED = {'.git', '.venv', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', 'node_modules'}
def is_link(path: Path) -> bool:
    return path.is_symlink() or (hasattr(path, 'is_junction') and path.is_junction())


ROOT_FILES = {'config.yml', 'models.yml', 'APPEND_SYSTEM.md', 'config.yaml', 'models.yaml'}


class InstallError(RuntimeError):
    pass


@dataclass(frozen=True)
class Action:
    kind: str
    target: Path
    before: str | None
    after: str | None

    def format(self) -> str:
        return f'{self.kind}: {self.target}'


def default_agent_root() -> Path:
    """Return OMP's default native agent root, not an arbitrary override root."""
    return Path('~/.omp/agent').expanduser()


def default_omp_config_root() -> Path:
    return Path(os.environ.get('PI_CONFIG_DIR') or '~/.omp').expanduser()


def native_profile_agent_root(profile: str) -> Path:
    if not SAFE_NAME.fullmatch(profile):
        raise ConfigError('OMP profile names must be kebab-case')
    return default_omp_config_root() / 'profiles' / profile / 'agent'


def is_native_omp_agent_root(root: Path) -> bool:
    root = root.expanduser().resolve()
    config_root = default_omp_config_root().resolve()
    if root == config_root / 'agent':
        return True
    return (root.parent.parent == config_root / 'profiles'
            and root.name == 'agent'
            and bool(SAFE_NAME.fullmatch(root.parent.name)))


def _valid_relative(name: str) -> bool:
    p = PurePosixPath(name)
    if '\\' in name or p.is_absolute() or '..' in p.parts:
        return False
    return name in ROOT_FILES or (len(p.parts) == 2 and p.parts[0] in {'skills', 'agents'}
                                  and re.fullmatch(r'[a-zA-Z0-9_.-]+', p.parts[1]) is not None)


def _parents_are_real(root: Path, relative: str) -> None:
    if not _valid_relative(relative):
        raise InstallError('Unsafe path in install state')
    node = root
    for part in PurePosixPath(relative).parts[:-1]:
        node /= part
        if is_link(node) or (node.exists() and not node.is_dir()):
            raise InstallError(f'Parent must be a real directory, not a symlink/file: {node}')


def _state_dir(root: Path) -> Path:
    path = root / '.omp-kit'
    if is_link(path) or (path.exists() and not path.is_dir()):
        raise InstallError(f'Unsafe state directory: {path}')
    return path


def _read_json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        raise InstallError(f'Invalid state file: {path}') from exc
    if not isinstance(data, dict):
        raise InstallError(f'Invalid state file: {path}')
    return data


def read_manifest(root: Path) -> dict:
    path = _state_dir(root) / 'manifest.json'
    if is_link(path):
        raise InstallError('Manifest must not be a symlink')
    if not path.exists():
        return {}
    data = _read_json(path)
    if data.get('version') != STATE_VERSION or not isinstance(data.get('units'), dict):
        raise InstallError('Unrecognized install manifest; do not delete it to bypass drift checks')
    for rel, digest in data['units'].items():
        if not _valid_relative(rel) or not isinstance(digest, str):
            raise InstallError('Invalid unit in install manifest')
    transaction = data.get('transaction', '')
    if not re.fullmatch(r'[0-9]{8}T[0-9]{6}-[a-f0-9]{8}', transaction):
        raise InstallError('Invalid transaction identifier in manifest')
    return data


def fingerprint(path: Path) -> str | None:
    """Hash symlinks without following them; directory hashes include unknown files."""
    h = hashlib.sha256()
    def visit(p: Path, label: str) -> None:
        h.update(label.encode('utf-8') + b'\0')
        if is_link(p):
            h.update(b'L' + os.readlink(p).encode('utf-8'))
        elif p.is_dir():
            h.update(b'D')
            for child in sorted(p.iterdir(), key=lambda q: q.name):
                visit(child, label + '/' + child.name)
        elif p.is_file():
            h.update(b'F')
            with p.open('rb') as stream:
                for block in iter(lambda: stream.read(1024 * 1024), b''):
                    h.update(block)
        else:
            raise InstallError(f'Unsupported filesystem object: {p}')
    if not path.exists() and not is_link(path):
        return None
    visit(path, '')
    return h.hexdigest()


def _ignore(_directory: str, names: list[str]) -> list[str]:
    return [n for n in names if n in IGNORED or n.endswith(('.pyc', '.pyo'))
            or (n.startswith('.env') and n not in {'.env.example', '.env.sample'})]


def _copy_resource(source: Path, destination: Path) -> None:
    if is_link(source):
        raise InstallError(f'Source resources must not be symlinks: {source}')
    if source.is_dir():
        for directory, dirs, files in os.walk(source, followlinks=False):
            excluded = set(_ignore(directory, dirs + files))
            dirs[:] = [d for d in dirs if d not in excluded]
            for name in dirs + [f for f in files if f not in excluded]:
                if is_link(Path(directory) / name):
                    raise InstallError(f'Source contains a symlink; review before installation: {source}')
        shutil.copytree(source, destination, ignore=_ignore)
    else:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


def prepare(repo: Path, root: Path, stage: Path, profiles: list[str], local: Path,
            cpa_url: str | None) -> tuple[dict[str, str], dict]:
    config, models = compose(repo, local, profiles)
    if cpa_url:
        validate_url(cpa_url, '--cpa-url')
        if 'cpa' not in models['providers']:
            raise InstallError('--cpa-url requires the cpa provider')
        models['providers']['cpa']['baseUrl'] = cpa_url.rstrip('/')
    # Preserve existing device setup/consent only on that same machine. Never
    # export it to the repository or grant consent on a fresh machine.
    existing = root / ('config.yml' if (root / 'config.yml').exists() else 'config.yaml')
    if existing.is_file() and not existing.is_symlink():
        old = load_mapping(existing)
        if 'setupVersion' in old:
            config['setupVersion'] = old['setupVersion']
        consent = old.get('dev', {})
        if isinstance(consent, dict) and 'autoqaConsent' in consent:
            config.setdefault('dev', {})['autoqaConsent'] = consent['autoqaConsent']
    stage.mkdir(parents=True, exist_ok=True)
    (stage / 'config.yml').write_bytes(yaml_bytes(config))
    (stage / 'models.yml').write_bytes(yaml_bytes(models))
    _copy_resource(repo / 'config/APPEND_SYSTEM.md', stage / 'APPEND_SYSTEM.md')
    units = ['config.yml', 'models.yml', 'APPEND_SYSTEM.md']
    for name, source in active_skills(repo).items():
        rel = f'skills/{name}'
        (stage / 'skills').mkdir(exist_ok=True)
        _copy_resource(source, stage / rel)
        units.append(rel)
    for source in sorted((repo / 'agents').glob('*.md')):
        rel = f'agents/{source.name}'
        _copy_resource(source, stage / rel)
        units.append(rel)
    desired = {}
    for rel in units:
        digest = fingerprint(stage / rel)
        if digest is None:
            raise InstallError(f'Prepared install unit is missing: {rel}')
        desired[rel] = digest
    return desired, models


def plan(root: Path, desired: dict[str, str], previous: dict, *, force: bool) -> list[Action]:
    old_units = previous.get('units', {})
    names = set(desired) | set(old_units)
    # Legacy aliases are explicitly backed up and retired, never left ambiguous.
    names.update(name for name in ('config.yaml', 'models.yaml')
                 if (root / name).exists() or (root / name).is_symlink())
    actions, conflicts = [], []
    for rel in sorted(names):
        _parents_are_real(root, rel)
        target = root / rel
        before, after = fingerprint(target), desired.get(rel)
        if before == after:
            kind = 'unchanged'
        elif before is None:
            kind = 'install' if after else 'unchanged'
        else:
            trusted = rel in old_units and before == old_units[rel]
            if not trusted and not force:
                conflicts.append(rel)
            kind = 'replace' if after else 'retire'
        actions.append(Action(kind, target, before, after))
    if conflicts:
        raise InstallError('Unmanaged files or local drift; nothing installed. Review then use --force '
                           '(backs up replacements): ' + ', '.join(conflicts))
    return actions


def _atomic_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.omp-kit-', dir=path.parent)
    tmp = Path(name)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def _remove(path: Path) -> None:
    if hasattr(path, 'is_junction') and path.is_junction():
        path.rmdir()
    elif path.is_symlink() or path.is_file():
        path.unlink()
    elif path.is_dir():
        shutil.rmtree(path)


@contextmanager
def install_lock(root: Path) -> Iterator[Path]:
    state = _state_dir(root)
    state.mkdir(parents=True, exist_ok=True, mode=0o700)
    for child in ('backups', 'staging', 'local'):
        p = state / child
        if is_link(p) or (p.exists() and not p.is_dir()):
            raise InstallError(f'Unsafe state path: {p}')
    lock = state / 'install.lock'
    try:
        lock.mkdir()
    except FileExistsError as exc:
        raise InstallError(f'Install already running or stale lock: {lock}; inspect it before removing') from exc
    try:
        (lock / 'owner.json').write_text(json.dumps({'pid': os.getpid()}), encoding='utf-8')
        yield state
    finally:
        shutil.rmtree(lock)


def _restore_changes(root: Path, backup: Path, changes: list[dict]) -> None:
    for change in reversed(changes):
        rel = change['path']
        _parents_are_real(root, rel)
        target, saved = root / rel, backup / 'files' / rel
        # Backup objects may themselves be symlinks; never follow them.
        if saved.exists() or saved.is_symlink():
            _remove(target)
            target.parent.mkdir(parents=True, exist_ok=True)
            os.replace(saved, target)
        elif change['before'] is None:
            _remove(target)
        elif fingerprint(target) != change['before']:
            raise InstallError(f'Missing backup for {rel}; manual recovery required')


def _write_previous_manifest(root: Path, previous: dict) -> None:
    target = _state_dir(root) / 'manifest.json'
    if previous:
        _atomic_json(target, previous)
    else:
        target.unlink(missing_ok=True)


def apply(root: Path, stage: Path, desired: dict[str, str], previous: dict,
          actions: list[Action], options: dict) -> str | None:
    changed = [a for a in actions if a.kind != 'unchanged']
    if not changed and previous and previous.get('options') == options:
        return None
    state = _state_dir(root)
    for action in actions:
        if fingerprint(action.target) != action.before:
            raise InstallError('Runtime changed during preflight; close OMP and retry')
    transaction = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S') + '-' + uuid.uuid4().hex[:8]
    backup = state / 'backups' / transaction
    backup.mkdir(parents=True, mode=0o700)
    changes = [{'path': a.target.relative_to(root).as_posix(), 'before': a.before, 'after': a.after}
               for a in changed]
    journal = {'version': STATE_VERSION, 'status': 'prepared', 'previous': previous,
               'transaction': transaction, 'changes': changes}
    _atomic_json(backup / 'transaction.json', journal)
    moved = []
    try:
        for change in changes:
            rel = change['path']
            target, saved = root / rel, backup / 'files' / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            if change['before'] is not None:
                saved.parent.mkdir(parents=True, exist_ok=True)
                os.replace(target, saved)
            moved.append(change)
            if change['after'] is not None:
                # Stage is on the target volume, avoiding cross-device renames.
                os.replace(stage / rel, target)
        _atomic_json(state / 'manifest.json', {'version': STATE_VERSION, 'transaction': transaction,
                                               'units': desired, 'options': options})
        journal['status'] = 'installed'
        _atomic_json(backup / 'transaction.json', journal)
    except BaseException:
        # Includes Ctrl-C. A process kill/power failure leaves the journal for --rollback.
        _restore_changes(root, backup, moved)
        _write_previous_manifest(root, previous)
        journal['status'] = 'rolled-back'
        _atomic_json(backup / 'transaction.json', journal)
        raise
    return transaction


def _pending(state: Path) -> list[Path]:
    return [p for p in sorted((state / 'backups').glob('*/transaction.json'))
            if _read_json(p).get('status') == 'prepared']


def rollback(root: Path) -> str:
    root = root.expanduser().resolve()
    with install_lock(root) as state:
        pending = _pending(state)
        manifest = read_manifest(root)
        if pending:
            path = pending[-1]
        elif manifest.get('transaction'):
            path = state / 'backups' / manifest['transaction'] / 'transaction.json'
        else:
            raise InstallError('No install transaction to roll back')
        journal = _read_json(path)
        changes = journal.get('changes', [])
        for change in changes:
            rel = change['path']
            _parents_are_real(root, rel)
            current = fingerprint(root / rel)
            allowed = {change['before'], change['after'], None} if journal['status'] == 'prepared' else {change['after']}
            if current not in allowed:
                raise InstallError(f'Rollback would overwrite new local work: {rel}')
        _restore_changes(root, path.parent, changes)
        _write_previous_manifest(root, journal.get('previous', {}))
        journal['status'] = 'rolled-back'
        _atomic_json(path, journal)
        return journal['transaction']


def install_harness(*, repo_root: Path, agent_root: Path, force: bool = False,
                    dry_run: bool = False, profiles: list[str] | None = None,
                    local_dir: Path | None = None, cpa_url: str | None = None) -> list[Action]:
    repo, root = repo_root.expanduser().resolve(), agent_root.expanduser().resolve()
    if repo == root or root.is_relative_to(repo) or repo.is_relative_to(root):
        raise InstallError('Repository and runtime root must not contain one another')
    if root.exists() and not root.is_dir():
        raise InstallError('Agent root is not a directory')
    previous = read_manifest(root)
    saved = previous.get('options', {})
    selected = profiles if profiles is not None else saved.get('profiles', [])
    local = (local_dir or (Path(saved['local_dir']) if saved.get('local_dir') else root / '.omp-kit/local')).expanduser().resolve()
    url = cpa_url if cpa_url is not None else saved.get('cpa_url')
    options = {'profiles': selected, 'cpa_url': url, 'local_dir': str(local)}
    # Full source render/check BEFORE creating or modifying any runtime file.
    with tempfile.TemporaryDirectory(prefix='omp-kit-preview-') as temp:
        preview = Path(temp) / 'desired'
        desired, _ = prepare(repo, root, preview, selected, local, url)
        actions = plan(root, desired, previous, force=force)
        if dry_run:
            return actions
        with install_lock(root) as state:
            if _pending(state):
                raise InstallError('An interrupted install needs --rollback before another install')
            if read_manifest(root) != previous:
                raise InstallError('Install state changed; retry')
            with tempfile.TemporaryDirectory(prefix='install-', dir=state) as work:
                stage = Path(work) / 'desired'
                shutil.copytree(preview, stage)
                apply(root, stage, desired, previous, actions, options)
    return actions


def _dotenv_values(path: Path) -> dict[str, str]:
    """Read simple dotenv assignments for readiness checks; never execute/source files."""
    result = {}
    if not path.is_file():
        return result
    for line in path.read_text(encoding='utf-8-sig').splitlines():
        line = line.strip().removeprefix('export ')
        name, sep, value = line.partition('=')
        name, value = name.strip(), value.strip()
        if sep and ENV_NAME.fullmatch(name):
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
                value = value[1:-1]
            else:
                value = value.split(' #', 1)[0].strip()
            result[name] = value
    return result
def doctor(root: Path) -> tuple[list[str], bool]:
    """Offline readiness/drift check. No inference, HTTP, key printing or auth-db reads."""
    root = root.expanduser().resolve()
    lines, ready = [], True
    binary = shutil.which('omp')
    if binary:
        lines.append('OK: omp executable found')
    else:
        lines.append('MISSING: omp executable on PATH')
        ready = False
    manifest = read_manifest(root)
    if not manifest:
        return lines + ['MISSING: managed install manifest'], False
    drift = [rel for rel, expected in manifest['units'].items() if fingerprint(root / rel) != expected]
    if drift:
        lines.append('DRIFT: ' + ', '.join(drift))
        ready = False
    else:
        lines.append('OK: managed files match the last installation')
    if any(rel.startswith('agents/') for rel in manifest['units']) and not is_native_omp_agent_root(root):
        lines.append('INCOMPLETE: This root is not a native OMP agent/profile root.')
        lines.append('OMP 18.1.18 may load config/models/skills here but not custom task agents.')
        ready = False
    config, models = load_mapping(root / 'config.yml'), load_mapping(root / 'models.yml')
    variables = {**_dotenv_values(root / '.env'), **os.environ}
    required = {s.split('/', 1)[0] for s in config.get('modelRoles', {}).values() if isinstance(s, str)}
    for name, provider in models['providers'].items():
        key = provider.get('apiKey')
        if isinstance(key, str) and ENV_NAME.fullmatch(key):
            present = bool(variables.get(key)) and variables.get(key) != key
            if present:
                lines.append(f'OK: {key} is set (value hidden)')
            elif name in required:
                ready = False
                lines.append(f'MISSING: {key}; set it in the OMP environment or {root / ".env"}')
            else:
                lines.append(f'OPTIONAL: {key} is not set; {name} will not be usable')
    if config.get('compaction', {}).get('experimentalContextManagement'):
        lines.append('NOTE: notes-backed context enabled; verify support in your installed OMP and restart sessions')
    if config.get('symbolPreset') == 'nerd':
        lines.append('NOTE: Nerd Font required for the chosen symbols; --config-profile headless uses ASCII')
    lines.append('UNVERIFIED: provider reachability/authentication, quota, browser/relay, LSP and project dependencies')
    return lines, ready




def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--agent-root', type=Path, help='Explicit installer root; use --omp-profile for native OMP profiles')
    parser.add_argument('--omp-profile', metavar='NAME', help='Install into ~/.omp/profiles/NAME/agent and launch with omp --profile NAME')
    parser.add_argument('--force', action='store_true', help='Adopt/replace conflicts after backup; never deletes unrelated resources')
    parser.add_argument('--config-profile', '--profile', dest='profiles', action='append', default=None,
                        help='Repeatable omp-kit config overlay; --profile is a compatibility alias')
    parser.add_argument('--local-dir', type=Path, help='Optional machine config/models overlay directory')
    parser.add_argument('--cpa-url', help='Override and remember the CPA /v1 base URL (never a key)')
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument('--dry-run', action='store_true', help='Render, validate and preview; do not write runtime files')
    actions.add_argument('--validate', action='store_true', help='Validate source configuration, roles and agent/skill references only')
    actions.add_argument('--doctor', action='store_true', help='Offline runtime readiness/drift report; exit 2 when incomplete')
    actions.add_argument('--rollback', action='store_true', help='Roll back the latest install, refusing to overwrite newer local work')
    args = parser.parse_args(argv)
    if args.agent_root is not None and args.omp_profile is not None:
        parser.error('--agent-root and --omp-profile are mutually exclusive')
    profiles = args.profiles
    if profiles is not None and 'default' in profiles:
        if profiles != ['default']:
            parser.error('--config-profile default must be used alone')
        profiles = []
    try:
        agent_root = (args.agent_root or native_profile_agent_root(args.omp_profile)
                      if args.omp_profile else args.agent_root or default_agent_root())
        if args.rollback:
            print('Rolled back: ' + rollback(agent_root))
        elif args.doctor:
            messages, ready = doctor(agent_root)
            print('\n'.join(messages))
            return 0 if ready else 2
        elif args.validate:
            repo = args.repo_root.expanduser().resolve()
            compose(repo, (args.local_dir or agent_root.expanduser() / '.omp-kit/local'), profiles or [])
            if args.cpa_url:
                validate_url(args.cpa_url, '--cpa-url')
            print('Static configuration and agent/skill references: valid (not an upstream OMP schema/runtime test)')
        else:
            changes = install_harness(repo_root=args.repo_root, agent_root=agent_root,
                                      force=args.force, dry_run=args.dry_run, profiles=profiles,
                                      local_dir=args.local_dir, cpa_url=args.cpa_url)
            for change in changes:
                print(change.format())
            if args.dry_run:
                print('Dry run only; no runtime files were written.')
            else:
                print('Installed. Existing .env, auth databases, sessions, MCP config and unrelated resources were not imported or replaced.')
                if args.omp_profile:
                    print(f'Native OMP profile installed. Start with: omp --profile {args.omp_profile}')
                messages, ready = doctor(agent_root)
                print('\n'.join(messages))
                print('Offline checks passed; live runtime still unverified.' if ready else
                      'Files installed, but readiness is incomplete. Resolve the items above before using OMP.')
    except (InstallError, ConfigError, OSError) as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
