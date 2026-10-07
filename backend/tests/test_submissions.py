from fastapi.testclient import TestClient

from conftest import create_hunt, create_team


def test_create_and_retrieve_submission_and_leaderboard(client: TestClient) -> None:
    hunt = create_hunt(client)
    team = create_team(client, hunt["id"], "Team Blue")
    participant_response = client.post(
        f"/api/hunts/{hunt['id']}/participants",
        json={
            "user": {"name": "Jordan", "email": "jordan@example.com"},
            "role": "member",
            "team_id": team["id"],
        },
    )
    assert participant_response.status_code == 201
    participant = participant_response.json()
    client.post(f"/api/hunts/{hunt['id']}/start")

    created = client.post(
        f"/api/hunts/{hunt['id']}/submissions",
        json={
            "participant_id": participant["id"],
            "image_reference": "local://uploads/photo-1.jpg",
        },
    )
    submissions = client.get(f"/api/hunts/{hunt['id']}/submissions")
    leaderboard = client.get(f"/api/hunts/{hunt['id']}/leaderboard")

    assert created.status_code == 201, created.text
    assert created.json()["team_id"] == team["id"]
    assert submissions.status_code == 200
    assert len(submissions.json()) == 1
    assert submissions.json()[0]["image_reference"] == "local://uploads/photo-1.jpg"
    assert leaderboard.status_code == 200
    assert leaderboard.json() == [
        {
            "rank": 1,
            "team_id": team["id"],
            "team_name": team["name"],
            "target_color": team["target_color"],
            "average_score": 0.0,
            "submission_count": 1,
        }
    ]


def test_submission_rejects_mismatched_team_and_participant(client: TestClient) -> None:
    hunt = create_hunt(client)
    team = create_team(client, hunt["id"], "Team A")
    other_team = create_team(client, hunt["id"], "Team B")
    participant = client.post(
        f"/api/hunts/{hunt['id']}/participants",
        json={
            "user": {"name": "Morgan", "email": "morgan@example.com"},
            "role": "member",
            "team_id": team["id"],
        },
    ).json()
    client.post(f"/api/hunts/{hunt['id']}/start")

    response = client.post(
        f"/api/hunts/{hunt['id']}/submissions",
        json={
            "participant_id": participant["id"],
            "team_id": other_team["id"],
            "image_reference": "local://wrong-team.jpg",
        },
    )
    assert response.status_code == 422


def test_submission_is_rejected_before_hunt_starts(client: TestClient) -> None:
    hunt = create_hunt(client)
    response = client.post(
        f"/api/hunts/{hunt['id']}/submissions",
        json={"participant_id": "missing", "image_reference": "local://photo.jpg"},
    )
    assert response.status_code == 409
