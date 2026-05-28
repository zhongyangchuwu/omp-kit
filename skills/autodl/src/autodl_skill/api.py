from __future__ import annotations

from typing import Any

import httpx

DEFAULT_API_HOST = "https://api.autodl.com"


class AutoDLApiError(RuntimeError):
    """Raised when AutoDL returns transport or API-level errors."""

    def __init__(self, message: str, *, request_id: str | None = None) -> None:
        super().__init__(message)
        self.request_id = request_id


class AutoDLClient:
    """Small HTTP client for the AutoDL Developer API."""

    def __init__(
        self,
        token: str,
        api_host: str = DEFAULT_API_HOST,
        timeout_seconds: float = 20.0,
    ) -> None:
        self.token = token
        self.api_host = api_host.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def request_json(
        self, method: str, path: str, payload: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        url = f"{self.api_host}/{path.lstrip('/')}"
        headers = {
            "Authorization": self.token,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        try:
            with httpx.Client(timeout=self.timeout_seconds, trust_env=False) as client:
                if method.upper() == "GET":
                    response = client.request(method, url, params=payload or None, headers=headers)
                else:
                    response = client.request(method, url, json=payload or {}, headers=headers)
        except httpx.HTTPError as exc:
            raise AutoDLApiError(f"AutoDL request failed: {exc}") from exc

        request_id = response.headers.get("X-Request-Id") or response.headers.get("X-Request-ID")
        if response.status_code >= 400:
            raise self._http_error(response, request_id=request_id)

        try:
            decoded = response.json() if response.content else {}
        except ValueError as exc:
            raise AutoDLApiError("AutoDL returned invalid JSON", request_id=request_id) from exc
        if not isinstance(decoded, dict):
            raise AutoDLApiError("AutoDL returned non-object JSON", request_id=request_id)
        self._raise_for_api_error(decoded, request_id)
        return decoded

    def list_instances(self, *, page_index: int = 1, page_size: int = 10) -> dict[str, Any]:
        return self.request_json(
            "POST",
            "/api/v1/dev/instance/pro/list",
            {"page_index": page_index, "page_size": page_size},
        )

    def status(self, instance_uuid: str) -> dict[str, Any]:
        return self.request_json(
            "GET", "/api/v1/dev/instance/pro/status", {"instance_uuid": instance_uuid}
        )

    def snapshot(self, instance_uuid: str) -> dict[str, Any]:
        return self.request_json(
            "GET", "/api/v1/dev/instance/pro/snapshot", {"instance_uuid": instance_uuid}
        )

    def balance(self) -> dict[str, Any]:
        return self.request_json("POST", "/api/v1/dev/wallet/balance", {})

    def gpu_stock(self, *, region_sign: str, cuda_v_from: int, cuda_v_to: int) -> dict[str, Any]:
        return self.request_json(
            "POST",
            "/api/v1/dev/machine/region/gpu_stock",
            {"region_sign": region_sign, "cuda_v_from": cuda_v_from, "cuda_v_to": cuda_v_to},
        )

    def create_pro(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.request_json("POST", "/api/v1/dev/instance/pro/create", payload)

    def power_on_pro(self, instance_uuid: str) -> dict[str, Any]:
        return self.request_json(
            "POST", "/api/v1/dev/instance/pro/power_on", {"instance_uuid": instance_uuid}
        )

    def power_off_pro(self, instance_uuid: str) -> dict[str, Any]:
        return self.request_json(
            "POST", "/api/v1/dev/instance/pro/power_off", {"instance_uuid": instance_uuid}
        )

    def release_pro(self, instance_uuid: str) -> dict[str, Any]:
        return self.request_json(
            "POST", "/api/v1/dev/instance/pro/release", {"instance_uuid": instance_uuid}
        )

    def list_deployments(
        self,
        *,
        page_index: int = 1,
        page_size: int = 10,
        status: str | None = None,
        deployment_uuid: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"page_index": page_index, "page_size": page_size}
        if status:
            payload["status"] = status
        if deployment_uuid:
            payload["deployment_uuid"] = deployment_uuid
        return self.request_json("POST", "/api/v1/dev/deployment/list", payload)

    def list_deployment_containers(
        self,
        *,
        deployment_uuid: str,
        page_index: int = 1,
        page_size: int = 10,
        container_uuid: str | None = None,
        status: list[str] | None = None,
        released: bool | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "deployment_uuid": deployment_uuid,
            "page_index": page_index,
            "page_size": page_size,
        }
        if container_uuid:
            payload["container_uuid"] = container_uuid
        if status:
            payload["status"] = status
        if released is not None:
            payload["released"] = released
        return self.request_json("POST", "/api/v1/dev/deployment/container/list", payload)

    @staticmethod
    def _raise_for_api_error(decoded: dict[str, Any], request_id: str | None = None) -> None:
        code = decoded.get("code")
        if code in (None, "Success"):
            return
        api_request_id = decoded.get("request_id") or decoded.get("requestId") or request_id
        msg = decoded.get("msg") or decoded.get("message") or "AutoDL API returned an error"
        if api_request_id:
            msg = f"{msg} (request_id={api_request_id})"
        raise AutoDLApiError(str(msg), request_id=api_request_id)

    @staticmethod
    def _http_error(response: httpx.Response, *, request_id: str | None) -> AutoDLApiError:
        message = f"AutoDL HTTP {response.status_code}"
        decoded: dict[str, Any] = {}
        try:
            body = response.json() if response.content else {}
            if isinstance(body, dict):
                decoded = body
        except ValueError:
            decoded = {}
        api_request_id = decoded.get("request_id") or decoded.get("requestId") or request_id
        api_msg = decoded.get("msg") or decoded.get("message")
        if api_msg:
            message = f"{message}: {api_msg}"
        if api_request_id:
            message = f"{message} (request_id={api_request_id})"
        return AutoDLApiError(message, request_id=api_request_id)
