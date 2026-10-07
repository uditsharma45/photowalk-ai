from fastapi.testclient import TestClient

from conftest import create_hunt


def test_create_multiple_teams_without_duplicate_colors(client: TestClient) -> None:
    for team_count in (2, 4, 10):
        hunt = create_hunt(client, f"Hunt with {team_count} teams")
        teams = []
        for index in range(team_count):
            response = client.post(
                f"/api/hunts/{hunt['id']}/teams",
                json={"name": f"Team {index + 1}"},
            )
            assert response.status_code == 201, response.text
            teams.append(response.json())

        listed = client.get(f"/api/hunts/{hunt['id']}/teams")
        colors = [team["target_color"] for team in teams]
        assert listed.status_code == 200
        assert len(listed.json()) == team_count
        assert len(set(colors)) == team_count
        expected_colors = ["Blue", "Red", "Green", "Yellow"][:team_count]
        assert colors[: len(expected_colors)] == expected_colors


def test_team_names_are_unique_within_hunt(client: TestClient) -> None:
    hunt = create_hunt(client)
    first = client.post(f"/api/hunts/{hunt['id']}/teams", json={"name": "Team Red"})
    duplicate = client.post(f"/api/hunts/{hunt['id']}/teams", json={"name": "team red"})

    assert first.status_code == 201
    assert duplicate.status_code == 409


def test_teams_cannot_be_created_for_unknown_hunt(client: TestClient) -> None:
    response = client.post("/api/hunts/missing/teams", json={"name": "Team"})
    assert response.status_code == 404
