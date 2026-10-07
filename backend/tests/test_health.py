import asyncio

import httpx

from app.main import app


async def request(
    method: str,
    path: str,
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, headers=headers)


def test_health_returns_ok() -> None:
    response = asyncio.run(request("GET", "/api/health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_allows_local_frontend_origin() -> None:
    response = asyncio.run(
        request(
            "OPTIONS",
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
