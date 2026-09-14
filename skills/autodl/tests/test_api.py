from __future__ import annotations

import pytest

from autodl_skill.api import AutoDLApiError, AutoDLClient
from autodl_skill.safety import redact


def test_balance_posts_to_wallet_endpoint_with_authorization_header(httpx_mock) -> None:  # type: ignore[no-untyped-def]
    httpx_mock.add_response(json={"code": "Success", "data": {"balance": "10"}})
    client = AutoDLClient(token="token-secret", api_host="https://api.autodl.com")

    response = client.balance()

    request = httpx_mock.get_request()
    assert request is not None
    assert request.method == "POST"
    assert str(request.url) == "https://api.autodl.com/api/v1/dev/wallet/balance"
    assert request.headers["Authorization"] == "token-secret"
    assert response["data"]["balance"] == "10"


def test_status_gets_instance_status_with_query_params(httpx_mock) -> None:  # type: ignore[no-untyped-def]
    httpx_mock.add_response(json={"code": "Success", "data": "running"})
    client = AutoDLClient(token="token-secret")

    response = client.status("uuid-gpu0")

    request = httpx_mock.get_request()
    assert request is not None
    assert request.method == "GET"
    assert str(request.url) == "https://api.autodl.com/api/v1/dev/instance/pro/status?instance_uuid=uuid-gpu0"
    assert response["data"] == "running"


@pytest.mark.parametrize(
    ("method_name", "expected_method", "expected_path"),
    [
        ("list_instances", "POST", "/api/v1/dev/instance/pro/list"),
        ("snapshot", "GET", "/api/v1/dev/instance/pro/snapshot"),
        ("gpu_stock", "POST", "/api/v1/dev/machine/region/gpu_stock"),
        ("create_pro", "POST", "/api/v1/dev/instance/pro/create"),
        ("power_on_pro", "POST", "/api/v1/dev/instance/pro/power_on"),
        ("power_off_pro", "POST", "/api/v1/dev/instance/pro/power_off"),
        ("release_pro", "POST", "/api/v1/dev/instance/pro/release"),
        ("list_deployments", "POST", "/api/v1/dev/deployment/list"),
        ("list_deployment_containers", "POST", "/api/v1/dev/deployment/container/list"),
    ],
)
def test_api_methods_use_expected_endpoints(
    httpx_mock, method_name: str, expected_method: str, expected_path: str
) -> None:  # type: ignore[no-untyped-def]
    httpx_mock.add_response(json={"code": "Success", "data": {}})
    client = AutoDLClient(token="token-secret")

    if method_name == "snapshot":
        getattr(client, method_name)("uuid-gpu0")
    elif method_name == "gpu_stock":
        getattr(client, method_name)(region_sign="westDC2", cuda_v_from=117, cuda_v_to=128)
    elif method_name == "create_pro":
        getattr(client, method_name)({"gpu_spec_uuid": "5090-p"})
    elif method_name in {"power_on_pro", "power_off_pro", "release_pro"}:
        getattr(client, method_name)("uuid-gpu0")
    elif method_name == "list_deployment_containers":
        getattr(client, method_name)(deployment_uuid="deployment-uuid")
    else:
        getattr(client, method_name)()

    request = httpx_mock.get_request()
    assert request is not None
    assert request.method == expected_method
    assert request.url.path == expected_path


def test_http_error_raises_structured_error_without_token(httpx_mock) -> None:  # type: ignore[no-untyped-def]
    httpx_mock.add_response(status_code=403, json={"msg": "denied", "request_id": "rid-1"})
    client = AutoDLClient(token="token-secret")

    with pytest.raises(AutoDLApiError) as exc_info:
        client.balance()

    message = str(exc_info.value)
    assert "403" in message
    assert "denied" in message
    assert "rid-1" in message
    assert "token-secret" not in message
    assert exc_info.value.request_id == "rid-1"


def test_api_error_payload_raises_with_request_id(httpx_mock) -> None:  # type: ignore[no-untyped-def]
    httpx_mock.add_response(json={"code": "Error", "msg": "bad", "request_id": "rid-2"})
    client = AutoDLClient(token="token-secret")

    with pytest.raises(AutoDLApiError) as exc_info:
        client.balance()

    assert "bad" in str(exc_info.value)
    assert "rid-2" in str(exc_info.value)
    assert exc_info.value.request_id == "rid-2"


def test_snapshot_payload_can_be_redacted_before_display(httpx_mock) -> None:  # type: ignore[no-untyped-def]
    httpx_mock.add_response(
        json={
            "code": "Success",
            "data": {"root_password": "pw", "ssh_command": "ssh -p 10000 root@example"},
        }
    )
    client = AutoDLClient(token="token-secret")

    redacted = redact(client.snapshot("uuid-gpu0"))

    assert redacted["data"]["root_password"] == "<redacted>"
    assert redacted["data"]["ssh_command"] == "<redacted>"
