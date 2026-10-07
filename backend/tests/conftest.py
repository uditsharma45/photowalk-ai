import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client(tmp_path):
    database_path = (tmp_path / "photowalk-test.db").as_posix()
    test_engine = create_engine(f"sqlite:///{database_path}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        database = TestingSessionLocal()
        try:
            yield database
        finally:
            database.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        test_engine.dispose()


def create_hunt(client: TestClient, name: str = "Campus Color Hunt") -> dict:
    response = client.post(
        "/api/hunts",
        json={
            "name": name,
            "location": "Galgotias College",
            "date": "2026-10-08",
            "duration_minutes": 30,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def create_team(client: TestClient, hunt_id: str, name: str) -> dict:
    response = client.post(f"/api/hunts/{hunt_id}/teams", json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()
