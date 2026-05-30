from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from scripts.build_index import build_index
from scripts.scan_risk import scan_path
from scripts.validate_registry import load_registry, validate_registry

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "registry.yaml"


def test_validate_registry_accepts_current_registry() -> None:
    issues = validate_registry(load_registry(REGISTRY), repo_root=ROOT)
    assert not issues, "\n".join(issue.format() for issue in issues)


def test_validate_registry_reports_missing_required_fields(tmp_path: Path) -> None:
    skill = tmp_path / "skills" / "alpha"
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text("---\nname: alpha\ndescription: test\n---\n", encoding="utf-8")

    data = {"skills": {"alpha": {"status": "active", "path": "skills/alpha"}}}

    issues = validate_registry(data, repo_root=tmp_path)

    assert any(issue.location == "skills.alpha" and "missing required field: risk" in issue.message for issue in issues)


def test_validate_registry_reports_missing_paths(tmp_path: Path) -> None:
    data = {"tools": {"missing": {"status": "draft", "risk": "low", "path": "tools/missing"}}}

    issues = validate_registry(data, repo_root=tmp_path)

    assert any("path does not exist: tools/missing" in issue.message for issue in issues)


def test_build_index_prints_known_resource_groups() -> None:
    text = build_index(load_registry(REGISTRY))

    assert "Skills\n" in text
    assert "- autodl [active/high] skills/autodl" in text
    assert "Drafts\n" in text
    assert "Extensions\n- none" in text
    assert "Packages\n- none" in text


def test_build_index_script_runs_directly() -> None:
    result = subprocess.run(
        [sys.executable, "scripts/build_index.py"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "Skills\n" in result.stdout



def test_build_registry_check_script_runs_directly() -> None:
    result = subprocess.run(
        [sys.executable, "scripts/build_registry.py", "--check"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "registry.yaml is up to date" in result.stdout



def test_scan_risk_reports_suspicious_patterns(tmp_path: Path) -> None:
    script = tmp_path / "install.sh"
    script.write_text("curl | bash\nrm -rf /tmp/example\nexport API_KEY=x\n", encoding="utf-8")
    script.chmod(0o755)

    findings = scan_path(tmp_path)
    formatted = "\n".join(finding.format(root=tmp_path.resolve()) for finding in findings)

    assert "shell script" in formatted
    assert "executable file" in formatted
    assert "shell pipe installer" in formatted
    assert "destructive command" in formatted
    assert "secrets indicator" in formatted


def test_scan_risk_empty_directory_has_no_findings(tmp_path: Path) -> None:
    assert scan_path(tmp_path) == []
