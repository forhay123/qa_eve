from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, Date, Float, Numeric, func, Table
from sqlalchemy.orm import relationship
from datetime import datetime, date
from .database import Base
from sqlalchemy.ext.hybrid import hybrid_property




class ScheduledEvent(Base):
    __tablename__ = "scheduled_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    date = Column(Date, nullable=False)


# -------------------- User Model --------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)  # ✅ Add this line
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")

    full_name = Column(String, nullable=True)
    student_class = Column(String, nullable=True)
    state_of_origin = Column(String, nullable=True)
    level = Column(String, nullable=True)
    department = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True, default=None)
    last_active = Column(DateTime, nullable=True, default=datetime.utcnow)

    # Relationships
    user_answers = relationship("UserAnswer", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("ProgressTracking", back_populates="user", cascade="all, delete-orphan")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    subjects_taught = relationship("TeacherSubject", back_populates="teacher", cascade="all, delete-orphan")
    parent_profile = relationship("ParentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Modified relationship for parent to children
    parent_of_children = relationship(
        "ParentChildAssociation",
        back_populates="parent",
        cascade="all, delete-orphan",
        foreign_keys="[ParentChildAssociation.parent_id]"
    )
    
    # Relationship for a student to their parents (if any)
    is_child_of_parents = relationship(
        "ParentChildAssociation",
        back_populates="child",
        cascade="all, delete-orphan",
        foreign_keys="[ParentChildAssociation.child_id]"
    )

    report_cards = relationship("ReportCard", back_populates="student", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="user", cascade="all, delete-orphan")
    exam_results = relationship("ExamResult", back_populates="user", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="teacher", cascade="all, delete-orphan")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student", cascade="all, delete-orphan")
    login_activities = relationship("LoginActivity", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}', level='{self.level}', department='{self.department}')>"


    @hybrid_property
    def is_admin(self):
        return self.role == "admin"



class LoginActivity(Base):
    __tablename__ = "login_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="login_activities")


        
# -------------------- Teacher Profile Model --------------------
class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    level = Column(String, nullable=True)
    department = Column(String, nullable=True)

    user = relationship("User", back_populates="teacher_profile")

    def __repr__(self):
        return f"<TeacherProfile(user_id={self.user_id}, level='{self.level}', department='{self.department}')>"



# -------------------- NEW ParentChildAssociation Model --------------------
class ParentChildAssociation(Base):
    __tablename__ = "parent_child_associations"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    child_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved = Column(Boolean, default=False)  # New column for approval status

    parent = relationship("User", back_populates="parent_of_children", foreign_keys=[parent_id])
    child = relationship("User", back_populates="is_child_of_parents", foreign_keys=[child_id])

    def __repr__(self):
        return f"<ParentChildAssociation(parent_id={self.parent_id}, child_id={self.child_id}, approved={self.approved})>"



# -------------------- Parent Profile Model --------------------
class ParentProfile(Base):
    __tablename__ = "parent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    user = relationship("User", back_populates="parent_profile", foreign_keys=[user_id])

    def __repr__(self):
        return f"<ParentProfile(user_id={self.user_id})>"



student_subject_association = Table(
    "student_subject_association",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("student_profiles.id")),
    Column("subject_id", Integer, ForeignKey("subjects.id"))
)


# -------------------- Subject Model --------------------
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(String, nullable=False)
    department = Column(String, nullable=True)

    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    taught_by = relationship("TeacherSubject", back_populates="subject", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="subject_rel")

    def __repr__(self):
        return f"<Subject(id={self.id}, name='{self.name}', level='{self.level}', department='{self.department}')>"




# -------------------- Student Profile Model --------------------
class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    guardian_name = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    admission_date = Column(DateTime, nullable=True)
    profile_image = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    state_of_origin = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    guardian_email = Column(String, nullable=True)  # ✅ ADD THIS

    user = relationship("User", back_populates="student_profile")
    subjects = relationship("Subject", secondary=student_subject_association, backref="students")


    def __repr__(self):
        return f"<StudentProfile(user_id={self.user_id}, guardian='{self.guardian_name}')>"


# -------------------- Topic Model --------------------
class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)  # ✅ New field

    level = Column(String, nullable=False)
    pdf_url = Column(String, nullable=True)

    is_pdf_approved = Column(Boolean, default=False)

    subject = relationship("Subject", back_populates="topics")

    progress = relationship("ProgressTracking", back_populates="topic", cascade="all, delete-orphan")
    topic_questions = relationship("TopicQuestion", back_populates="topic", cascade="all, delete-orphan")


    def __repr__(self):
        return f"<Topic(id={self.id}, week={self.week_number}, title='{self.title}', subject='{self.subject}')>"

# -------------------- PDF Document Model --------------------
class PDFDocument(Base):
    __tablename__ = "pdf_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    text = Column(Text, nullable=False)

    questions = relationship("Question", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PDFDocument(id={self.id}, filename='{self.filename}')>"

# -------------------- Question Model --------------------
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    document_id = Column(Integer, ForeignKey("pdf_documents.id"), nullable=False)
    document = relationship("PDFDocument", back_populates="questions")

    def __repr__(self):
        return f"<Question(id={self.id}, document_id={self.document_id})>"

# -------------------- User Answer Model --------------------
class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("topic_questions.id"), nullable=False)
    answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=True)
    correction = Column(Text, nullable=True)
    similarity = Column(Float, nullable=True)

    user = relationship("User", back_populates="user_answers")
    question = relationship("TopicQuestion", backref="user_answers")

    def __repr__(self):
        return f"<UserAnswer(id={self.id}, user_id={self.user_id}, question_id={self.question_id})>"

# -------------------- Progress Tracking Model --------------------
class ProgressTracking(Base):
    __tablename__ = "progress_tracking"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress")
    topic = relationship("Topic", back_populates="progress")

    def __repr__(self):
        return f"<ProgressTracking(user_id={self.user_id}, topic_id={self.topic_id}, score={self.score})>"

# -------------------- Topic Question Model --------------------
class TopicQuestion(Base):
    __tablename__ = "topic_questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    correct_answer = Column(String, nullable=True)
    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    question_type = Column(String, nullable=False)

    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    topic = relationship("Topic", back_populates="topic_questions")

    def __repr__(self):
        return f"<TopicQuestion(id={self.id}, topic_id={self.topic_id})>"

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, index=True)
    period = Column(Integer)

    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)  # 🔗 Link to Subject

    level = Column(String)
    department = Column(String, nullable=True)
    start_time = Column(String)
    end_time = Column(String)

    subject_rel = relationship("Subject", back_populates="timetables")

    def __repr__(self):
        return f"<Timetable(day={self.day}, period={self.period}, subject_id={self.subject_id}, level='{self.level}')>"


# -------------------- Attendance Model --------------------
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today, index=True)
    status = Column(String, default="present")  # present, absent, late, excused

    student = relationship("User", back_populates="attendance_records")

    def __repr__(self):
        return f"<Attendance(student_id={self.student_id}, date={self.date}, status='{self.status}')>"

# -------------------- Report Card Model --------------------
class ReportCard(Base):
    __tablename__ = "report_cards"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    term = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    subject = Column(String, nullable=False)
    first_test_score = Column(Float, default=0.0)
    second_test_score = Column(Float, default=0.0)
    exam_score = Column(Float, default=0.0)
    comment = Column(Text)

    student = relationship("User", back_populates="report_cards")

    @hybrid_property
    def score(self):
        return (self.first_test_score or 0.0) + (self.second_test_score or 0.0) + (self.exam_score or 0.0)

    def __repr__(self):
        return (
            f"<ReportCard(student_id={self.student_id}, subject='{self.subject}', "
            f"term='{self.term}', total_score={self.score})>"
        )

# -------------------- Test Result Model --------------------
class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    level = Column(String, nullable=False)
    test_type = Column(String, nullable=False)
    total_score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)
    submitted_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="test_results")

    def __repr__(self):
        return f"<TestResult(user_id={self.user_id}, subject='{self.subject}', score={self.total_score}, type='{self.test_type}')>"

# -------------------- Exam Result Model --------------------
class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    level = Column(String, nullable=False)
    test_type = Column(String, nullable=False)
    total_score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Numeric(5, 2), nullable=True)
    submitted_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="exam_results")

    def __repr__(self):
        return f"<ExamResult(user_id={self.user_id}, subject='{self.subject}', score={self.total_score})>"

# -------------------- Resource Model --------------------
class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    subject = Column(String, nullable=False)
    level = Column(String, nullable=False)
    student_class = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))

    uploader = relationship("User")

# -------------------- TeacherSubject Model --------------------
class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    teacher = relationship("User", back_populates="subjects_taught")
    subject = relationship("Subject", back_populates="taught_by")

    def __repr__(self):
        return f"<TeacherSubject(teacher_id={self.teacher_id}, subject_id={self.subject_id})>"

# -------------------- Assignment Model --------------------
class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_level = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    teacher = relationship("User", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")
    theory_questions = relationship("AssignmentTheoryQuestion", back_populates="assignment", cascade="all, delete-orphan")
    objective_questions = relationship("AssignmentObjectiveQuestion", back_populates="assignment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Assignment(id={self.id}, title='{self.title}', teacher_id={self.teacher_id})>"


# -------------------- AssignmentSubmission --------------------
class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_url = Column(String, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Float, nullable=True)
    status = Column(String, default="pending")

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="assignment_submissions")
    theory_answers = relationship("AssignmentTheoryAnswer", back_populates="submission", cascade="all, delete-orphan")
    objective_answers = relationship(
        "AssignmentObjectiveAnswer",
        back_populates="submission",
        cascade="all, delete-orphan",
        foreign_keys="[AssignmentObjectiveAnswer.submission_id]"
    )


# -------------------- Theory Question & Answer --------------------
class AssignmentTheoryQuestion(Base):
    __tablename__ = "assignment_theory_questions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    model_answer = Column(Text, nullable=False)

    assignment = relationship("Assignment", back_populates="theory_questions")
    theory_answers = relationship("AssignmentTheoryAnswer", back_populates="question", cascade="all, delete-orphan")


class AssignmentTheoryAnswer(Base):
    __tablename__ = "assignment_theory_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("assignment_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("assignment_theory_questions.id"), nullable=False)
    student_answer = Column(Text, nullable=False)
    score = Column(Float, nullable=True)

    submission = relationship("AssignmentSubmission", back_populates="theory_answers")
    question = relationship("AssignmentTheoryQuestion", back_populates="theory_answers")


# -------------------- Objective Question & Answer --------------------
class AssignmentObjectiveQuestion(Base):
    __tablename__ = "assignment_objective_questions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    option1 = Column(String, nullable=False)
    option2 = Column(String, nullable=False)
    option3 = Column(String, nullable=False)
    option4 = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)

    assignment = relationship("Assignment", back_populates="objective_questions")
    objective_answers = relationship("AssignmentObjectiveAnswer", back_populates="question", cascade="all, delete-orphan")


class AssignmentObjectiveAnswer(Base):
    __tablename__ = "assignment_objective_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("assignment_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("assignment_objective_questions.id"), nullable=False)
    selected_option = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)

    submission = relationship("AssignmentSubmission", back_populates="objective_answers")
    question = relationship("AssignmentObjectiveQuestion", back_populates="objective_answers")


# -------------------- Association Tables --------------------

group_students = Table(
    "group_students", Base.metadata,
    Column("group_id", Integer, ForeignKey("chat_groups.id"), primary_key=True),
    Column("student_id", Integer, ForeignKey("users.id"), primary_key=True)
)

group_teachers = Table(
    "group_teachers", Base.metadata,
    Column("group_id", Integer, ForeignKey("chat_groups.id"), primary_key=True),
    Column("teacher_id", Integer, ForeignKey("users.id"), primary_key=True)
)

blocked_users = Table(
    "blocked_users",
    Base.metadata,
    Column("group_id", Integer, ForeignKey("chat_groups.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)



# -------------------- Chat Group Model --------------------

class ChatGroup(Base):
    __tablename__ = "chat_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(String, nullable=True)
    department = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_class_group = Column(Boolean, default=False)
    is_custom_group = Column(Boolean, default=False, nullable=False)

    # Existing relationships
    messages = relationship("ChatMessage", back_populates="group", cascade="all, delete-orphan")
    polls = relationship("Poll", back_populates="group", cascade="all, delete-orphan")

    # NEW: Many-to-many relationships for custom groups
    students = relationship(
        "User",
        secondary="group_students",
        backref="chat_groups_as_student"
    )
    teachers = relationship(
        "User",
        secondary="group_teachers",
        backref="chat_groups_as_teacher"
    )

    def __repr__(self):
        return f"<ChatGroup(id={self.id}, name='{self.name}')>"

# -------------------- Chat Message Model --------------------

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chat_groups.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))

    content = Column(Text, nullable=True)  # Text content
    file_url = Column(String, nullable=True)  # For audio, video, documents
    file_type = Column(String, nullable=True)  # 'audio', 'video', 'document', etc.

    is_deleted = Column(Boolean, default=False)
    edit_history = Column(Text, nullable=True)  # JSON-encoded list of previous versions

    timestamp = Column(DateTime, default=datetime.utcnow)

    group = relationship("ChatGroup", back_populates="messages")
    sender = relationship("User")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, sender={self.sender_id}, content='{self.content}')>"


# -------------------- Polls --------------------

class Poll(Base):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chat_groups.id"))
    question = Column(String, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("ChatGroup", back_populates="polls")
    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Poll(id={self.id}, question='{self.question}')>"


class PollOption(Base):
    __tablename__ = "poll_options"

    id = Column(Integer, primary_key=True)
    poll_id = Column(Integer, ForeignKey("polls.id"))
    option_text = Column(String, nullable=False)
    votes = Column(Integer, default=0)

    poll = relationship("Poll", back_populates="options")

    def __repr__(self):
        return f"<PollOption(id={self.id}, option='{self.option_text}', votes={self.votes})>"



