import os
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy import inspect as sqlalchemy_inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./photowalk.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def upgrade_submission_image_columns(database_engine: Engine = engine) -> None:
    from app.models.submission import Submission

    with database_engine.begin() as connection:
        existing_columns = {
            column["name"]
            for column in sqlalchemy_inspect(connection).get_columns(Submission.__tablename__)
        }
        for column_name in ("image_path", "image_url", "mime_type", "file_size", "uploaded_at"):
            if column_name not in existing_columns:
                column = Submission.__table__.c[column_name]
                column_type = column.type.compile(dialect=connection.dialect)
                connection.exec_driver_sql(
                    f"ALTER TABLE {Submission.__tablename__} "
                    f"ADD COLUMN {column.name} {column_type}"
                )


if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(connection, _):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db() -> Generator[Session, None, None]:
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()
