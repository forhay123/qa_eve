from sqlalchemy.orm import Session
from app.database import get_db  # Ensure this provides a SessionLocal or similar
from app.models import Topic, Subject  # Adjust paths if necessary

def get_topic_name_by_metadata(level: str, subject: str, week: int, db: Session):
    """Return the topic title based on level, subject, and week."""
    topic = (
        db.query(Topic)
        .filter(
            Topic.level.ilike(level),
            Topic.subject.ilike(subject),
            Topic.week == week
        )
        .first()
    )
    return topic.title if topic else None


def get_all_subjects_from_db(db: Session) -> list[str]:
    """
    Returns a list of all subject names (capitalized) in the subjects table,
    useful for dynamic regex matching in queries.
    """
    subjects = db.query(Subject.name).distinct().all()
    return [sub.name.strip().capitalize() for sub in subjects if sub.name]
