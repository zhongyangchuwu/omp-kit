from __future__ import annotations

from pathlib import Path

from scripts.scan_risk import scan_path


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
