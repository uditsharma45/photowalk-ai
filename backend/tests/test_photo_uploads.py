from io import BytesIO

from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect

from app.api.routes import upload_utils
from app.database import upgrade_submission_image_columns
from conftest import create_hunt, create_team


def image_bytes(image_format: str) -> bytes:
    output = BytesIO()
    Image.new("RGB", (3, 2), (35, 180, 120)).save(output, format=image_format)
    return output.getvalue()


def test_photo_walk_upload_is_persisted_and_retrievable(client: TestClient) -> None:
    content = image_bytes("JPEG")
    uploaded = client.post(
        "/api/photos",
        files={"file": ("original-name.jpg", content, "image/jpeg")},
    )

    assert uploaded.status_code == 201, uploaded.text
    asset = uploaded.json()
    assert asset["mime_type"] == "image/jpeg"
    assert asset["file_size"] == len(content)
    assert asset["image_path"].startswith("photowalk/")
    assert "original-name" not in asset["image_path"]
    assert client.get(asset["image_url"]).content == content
    assert client.get(f"/api/photos/{asset['id']}").json()["image_url"] == asset["image_url"]


def test_valid_png_and_webp_are_accepted(client: TestClient) -> None:
    for extension, image_format, mime_type in (
        ("png", "PNG", "image/png"),
        ("webp", "WEBP", "image/webp"),
    ):
        response = client.post(
            "/api/photos",
            files={"file": (f"capture.{extension}", image_bytes(image_format), mime_type)},
        )
        assert response.status_code == 201, response.text
        assert response.json()["mime_type"] == mime_type


def test_unsupported_type_and_invalid_image_are_rejected(client: TestClient) -> None:
    unsupported = client.post(
        "/api/photos",
        files={"file": ("photo.gif", b"GIF89a", "image/gif")},
    )
    invalid = client.post(
        "/api/photos",
        files={"file": ("photo.png", b"not a png", "image/png")},
    )

    assert unsupported.status_code == 400
    assert "Unsupported image format" in unsupported.json()["detail"]
    assert invalid.status_code == 400
    assert "not a valid image" in invalid.json()["detail"]


def test_declared_mime_and_extension_must_match_image_content(client: TestClient) -> None:
    response = client.post(
        "/api/photos",
        files={"file": ("photo.jpg", image_bytes("PNG"), "image/jpeg")},
    )
    assert response.status_code == 400
    assert "does not match its file type" in response.json()["detail"]


def test_oversized_upload_is_rejected(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(upload_utils, "MAX_IMAGE_SIZE_BYTES", 32)
    response = client.post(
        "/api/photos",
        files={"file": ("large.png", image_bytes("PNG"), "image/png")},
    )
    assert response.status_code == 413
    assert "smaller than" in response.json()["detail"]


def test_color_hunt_submission_stores_real_image_and_keeps_relationships(client: TestClient) -> None:
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
    participant = participant_response.json()
    client.post(f"/api/hunts/{hunt['id']}/start")
    content = image_bytes("PNG")

    created = client.post(
        f"/api/hunts/{hunt['id']}/submissions/upload",
        data={"participant_id": participant["id"], "team_id": team["id"]},
        files={"file": ("frame.png", content, "image/png")},
    )

    assert created.status_code == 201, created.text
    submission = created.json()
    assert submission["hunt_id"] == hunt["id"]
    assert submission["team_id"] == team["id"]
    assert submission["participant_id"] == participant["id"]
    assert submission["image_reference"] == submission["image_url"]
    assert submission["mime_type"] == "image/png"
    assert submission["file_size"] == len(content)
    assert client.get(submission["image_url"]).content == content
    listed = client.get(f"/api/hunts/{hunt['id']}/submissions").json()
    assert len(listed) == 1
    assert listed[0]["image_url"] == submission["image_url"]


def test_submission_photo_endpoint_attaches_file_to_existing_submission(client: TestClient) -> None:
    hunt = create_hunt(client)
    team = create_team(client, hunt["id"], "Team Red")
    participant = client.post(
        f"/api/hunts/{hunt['id']}/participants",
        json={
            "user": {"name": "Riley", "email": "riley@example.com"},
            "role": "member",
            "team_id": team["id"],
        },
    ).json()
    client.post(f"/api/hunts/{hunt['id']}/start")
    submission = client.post(
        f"/api/hunts/{hunt['id']}/submissions",
        json={"participant_id": participant["id"], "image_reference": "upload-pending"},
    ).json()
    content = image_bytes("JPEG")

    uploaded = client.post(
        f"/api/submissions/{submission['id']}/photo",
        files={"file": ("capture.jpg", content, "image/jpeg")},
    )

    assert uploaded.status_code == 200, uploaded.text
    assert uploaded.json()["id"] == submission["id"]
    assert uploaded.json()["image_reference"] == uploaded.json()["image_url"]
    assert client.get(uploaded.json()["image_url"]).content == content


def test_upload_endpoint_rejects_missing_submission(client: TestClient) -> None:
    response = client.post(
        "/api/submissions/missing/photo",
        files={"file": ("capture.jpg", image_bytes("JPEG"), "image/jpeg")},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Submission not found"


def test_multipart_submission_rejects_participant_from_another_team(client: TestClient) -> None:
    hunt = create_hunt(client)
    first_team = create_team(client, hunt["id"], "Team Blue")
    second_team = create_team(client, hunt["id"], "Team Red")
    participant = client.post(
        f"/api/hunts/{hunt['id']}/participants",
        json={
            "user": {"name": "Taylor", "email": "taylor@example.com"},
            "role": "member",
            "team_id": first_team["id"],
        },
    ).json()
    client.post(f"/api/hunts/{hunt['id']}/start")

    response = client.post(
        f"/api/hunts/{hunt['id']}/submissions/upload",
        data={"participant_id": participant["id"], "team_id": second_team["id"]},
        files={"file": ("frame.webp", image_bytes("WEBP"), "image/webp")},
    )

    assert response.status_code == 422
    assert client.get(f"/api/hunts/{hunt['id']}/submissions").json() == []


def test_existing_submission_table_gets_image_metadata_columns(tmp_path) -> None:
    database_engine = create_engine(
        f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}",
    )
    with database_engine.begin() as connection:
        connection.exec_driver_sql("CREATE TABLE submissions (id VARCHAR(36) PRIMARY KEY)")

    upgrade_submission_image_columns(database_engine)
    column_names = {
        column["name"]
        for column in inspect(database_engine).get_columns("submissions")
    }
    database_engine.dispose()

    assert {"image_path", "image_url", "mime_type", "file_size", "uploaded_at"} <= column_names
