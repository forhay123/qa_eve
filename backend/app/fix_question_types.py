from sqlalchemy.orm import Session
from app.models import TopicQuestion
from app.database import SessionLocal

def fix_question_types():
    db: Session = SessionLocal()
    try:
        questions = db.query(TopicQuestion).all()
        fixed_count = 0

        for q in questions:
            has_options = all([q.option_a, q.option_b, q.option_c, q.option_d])
            is_objective = q.question_type == "objective"
            is_theory = q.question_type == "theory"

            if is_objective and not has_options:
                q.question_type = "theory"
                fixed_count += 1
            elif is_theory and has_options:
                q.question_type = "objective"
                fixed_count += 1

        db.commit()
        print(f"✅ Fixed {fixed_count} question_type mislabels")
    except Exception as e:
        print(f"❌ Error during fix: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_question_types()
