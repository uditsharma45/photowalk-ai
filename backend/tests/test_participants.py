from fastapi.testclient import TestClient

from conftest import create_hunt, create_team


def test_register_participant_and_set_team_leader(client: TestClient) -> None:
    hunt = create_hunt(client)
    team = create_team(client, hunt["id"], "Team Blue")
    response = client.post(
        f"/api/hunts/{hunt['id']}/participants",
        json={
            "user": {"name": "  Alex Rivera ", "email": "ALEX@example.com"},
            "role": "leader",
            "team_id": team["id"],
        },
    )

    assert response.status_code == 201, response.text
    participant = response.json()
    assert participant["user"]["name"] == "Alex Rivera"
    assert participant["user"]["email"] == "alex@example.com"
    assert participant["role"] == "leader"
    assert participant["team_id"] == team["id"]

    listed = client.get(f"/api/hunts/{hunt['id']}/participants")
    updated_team = client.get(f"/api/hunts/{hunt['id']}/teams").json()[0]
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert updated_team["leader_id"] == participant["id"]


def test_reject_participant_from_another_hunts_team(client: TestClient) -> None:
    first_hunt = create_hunt(client, "First Hunt")
    second_hunt = create_hunt(client, "Second Hunt")
    other_team = create_team(client, second_hunt["id"], "Other Team")
    response = client.post(
        f"/api/hunts/{first_hunt['id']}/participants",
        json={
            "user": {"name": "Taylor", "email": "taylor@example.com"},
            "role": "member",
            "team_id": other_team["id"],
        },
    )

    assert response.status_code == 422


def test_team_members_require_a_team_and_unique_hunt_registration(client: TestClient) -> None:
    hunt = create_hunt(client)
    payload = {
        "user": {"name": "Sam Lee", "email": "sam@example.com"},
        "role": "member",
    }
    assert client.post(f"/api/hunts/{hunt['id']}/participants", json=payload).status_code == 422

    team = create_team(client, hunt["id"], "Team Green")
    payload["team_id"] = team["id"]
    assert client.post(f"/api/hunts/{hunt['id']}/participants", json=payload).status_code == 201
    assert client.post(f"/api/hunts/{hunt['id']}/participants", json=payload).status_code == 409
