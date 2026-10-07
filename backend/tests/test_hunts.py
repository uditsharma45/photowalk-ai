from fastapi.testclient import TestClient

from conftest import create_hunt


def test_create_hunt_has_unique_short_code(client: TestClient) -> None:
    first = create_hunt(client, "First Hunt")
    second = create_hunt(client, "Second Hunt")

    assert 5 <= len(first["hunt_code"]) <= 6
    assert first["hunt_code"].upper() == first["hunt_code"]
    assert first["hunt_code"] != second["hunt_code"]
    assert first["status"] == "lobby"


def test_get_hunt_by_id_and_join_code(client: TestClient) -> None:
    created = create_hunt(client)

    by_id = client.get(f"/api/hunts/{created['id']}")
    by_code = client.get(f"/api/hunts/code/{created['hunt_code'].lower()}")

    assert by_id.status_code == 200
    assert by_id.json()["id"] == created["id"]
    assert by_code.status_code == 200
    assert by_code.json()["id"] == created["id"]


def test_unknown_hunt_returns_not_found(client: TestClient) -> None:
    assert client.get("/api/hunts/not-a-hunt").status_code == 404
    assert client.get("/api/hunts/code/XXXXX").status_code == 404


def test_hunt_lifecycle_records_backend_timestamps(client: TestClient) -> None:
    hunt = create_hunt(client)

    started = client.post(f"/api/hunts/{hunt['id']}/start")
    completed = client.post(f"/api/hunts/{hunt['id']}/complete")

    assert started.status_code == 200
    assert started.json()["status"] == "active"
    assert started.json()["started_at"] is not None
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert completed.json()["completed_at"] is not None


def test_invalid_hunt_transitions_are_rejected(client: TestClient) -> None:
    hunt = create_hunt(client)

    assert client.post(f"/api/hunts/{hunt['id']}/complete").status_code == 409
    client.post(f"/api/hunts/{hunt['id']}/start")
    assert client.post(f"/api/hunts/{hunt['id']}/start").status_code == 409
