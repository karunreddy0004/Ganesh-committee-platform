
from app.db.base import Base
from app.db.session import engine
from app.models import Committee, AuditLog, Donation


def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")


if __name__ == "__main__":
    init_db()
