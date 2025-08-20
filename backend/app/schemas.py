from typing import List, Optional, Dict, Literal, Union
from pydantic import BaseModel, Field, validator, field_validator, model_validator, root_validator, EmailStr
from datetime import datetime, date
from decimal import Decimal

# -------------------- User Schemas --------------------

class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None  # ✅ Make email optional
    password: str
    role: str = "student"
    full_name: str
    student_class: Optional[str] = None
    state_of_origin: Optional[str] = None
    level: Optional[str] = None
    department: Optional[str] = None

    @model_validator(mode="after")
    def generate_email_if_missing(self):
        if not self.email:
            # Auto-generate email
            self.email = f"{self.username}@qaacademy.com"
        return self


class UserUpdate(BaseModel):
    username: Optional[str]
    email: Optional[EmailStr]
    full_name: Optional[str]
    student_class: Optional[str]
    state_of_origin: Optional[str]
    level: Optional[str]
    department: Optional[str]


class UserOutWithProfile(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    level: Optional[str]
    department: Optional[str]
    role: str

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Token Schema --------------------

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str



# -------------------- Basic User (for nested fields) --------------------

class BasicUserOut(BaseModel):
    id: int
    username: str
    email: EmailStr # ✅ this is the student's email from the User table
    full_name: Optional[str]
    student_class: Optional[str]
    level: Optional[str]
    level: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Teacher Profile Schemas --------------------

class TeacherProfileBase(BaseModel):
    subject: Optional[str] = None  # ✅ Now optional to prevent 500 error
    level: str
    department: Optional[str] = None


class TeacherProfileCreate(TeacherProfileBase):
    user_id: int


class TeacherProfileOut(TeacherProfileBase):
    id: int
    user_id: int
    # ✅ Use BasicUserOut to prevent recursion loop
    user: BasicUserOut

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Student Profile Schemas --------------------

class StudentProfileBase(BaseModel):
    guardian_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    admission_date: Optional[date] = None
    date_of_birth: Optional[date] = None
    state_of_origin: Optional[str] = None
    gender: Optional[str] = None
    guardian_email: Optional[str] = None  # ✅ ADD THIS



class StudentProfileCreate(StudentProfileBase):
    user_id: int


class StudentProfileUpdate(StudentProfileBase):
    pass


class StudentProfileOut(StudentProfileBase):
    id: int
    user_id: int
    user: Optional[BasicUserOut]
    profile_image: Optional[str]

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Full User Out --------------------

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    full_name: Optional[str]
    student_class: Optional[str]
    state_of_origin: Optional[str]
    level: Optional[str]
    department: Optional[str]

    # ✅ Use simplified TeacherProfileOut (no UserOut inside)
    teacher_profile: Optional[TeacherProfileOut] = None

    class Config:
        orm_mode = True
        from_attributes = True


class FlatUserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True



# -------------------- MeResponse Type Union --------------------

# Add other roles' profiles as needed (e.g., StudentProfileOut)
MeResponse = Union[UserOut, UserOutWithProfile]  # Replace/add StudentProfileOut as needed


# -------------------- Subject Schemas --------------------

class SubjectOut(BaseModel):
    id: int
    name: str
    level: str
    department: Optional[str]

    class Config:
        orm_mode = True
        from_attributes = True


class SubjectUpdate(BaseModel):
    name: str
    level: Optional[str] = None
    department: Optional[str] = None


# -------------------- Topic Schemas --------------------

class TopicOut(BaseModel):
    id: int
    week_number: int
    title: str
    subject: SubjectOut
    level: str
    pdf_url: Optional[str] = None
    is_pdf_approved: Optional[bool] = None

    class Config:
        orm_mode = True
        from_attributes = True


class TopicCreate(BaseModel):
    week_number: int
    title: str
    subject: str
    level: str
    pdf_url: Optional[str] = None


class TopicUpdate(BaseModel):
    week_number: Optional[int] = None
    title: Optional[str] = None
    subject: Optional[str] = None
    level: Optional[str] = None
    pdf_url: Optional[str] = None



# -------------------- Parent Profile Schemas --------------------

class ParentProfileBase(BaseModel):
    child_id: int


class ParentProfileCreate(ParentProfileBase):
    user_id: int


class ParentProfileOut(ParentProfileBase):
    id: int
    user_id: int
    user: Optional[UserOut]
    child: Optional[UserOut]

    class Config:
        orm_mode = True
        from_attributes = True




# -------------------- PDF & Question Schemas --------------------

class QuestionBase(BaseModel):
    question: str
    answer: str


class QuestionCreate(QuestionBase):
    document_id: int


class QuestionOut(BaseModel):
    id: int
    question: str
    answer: str
    document_id: int

    class Config:
        orm_mode = True
        from_attributes = True


class PDFDocumentBase(BaseModel):
    filename: str


class PDFDocumentCreate(PDFDocumentBase):
    text: Optional[str] = None


class PDFDocumentOut(PDFDocumentBase):
    id: int
    text: Optional[str]
    questions: List[QuestionOut] = []

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- User Answer Schemas --------------------

class UserAnswerBase(BaseModel):
    question_id: int
    answer: str


class UserAnswerCreate(UserAnswerBase):
    pass


class UserAnswerOut(UserAnswerBase):
    id: int
    user_id: int
    is_correct: bool
    correct_answer: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


class AnswerSubmission(BaseModel):
    question_id: int
    answer: str


class SubmitAnswersRequest(BaseModel):
    topic_id: int
    answers: List[AnswerSubmission]


class SubmitExamAnswersRequest(BaseModel):
    subject: str
    level: str
    test_type: str
    answers: List[AnswerSubmission]



# -------------------- Progress Tracking Schemas --------------------

class ClassInfo(BaseModel):
    level: str
    department: Optional[str] = ""

    class Config:
        orm_mode = True
        from_attributes = True




class ProgressOut(BaseModel):
    id: int
    user_id: int
    topic_id: int
    score: float
    total_questions: int
    subject_name: str
    topic_title: str 
    completed_at: Optional[datetime]

    class Config:
        orm_mode = True
        from_attributes = True
        allow_population_by_field_name = True


class TopicProgressOut(BaseModel):
    topic_title: str
    subject_name: str
    total_score: int
    total_questions: int

    class Config:
        orm_mode = True
        from_attributes = True


class DailyProgressOut(BaseModel):
    date: date
    total_score: int
    total_questions: int

    class Config:
        orm_mode = True
        from_attributes = True


class WeeklyProgressOut(BaseModel):
    week: str
    total_score: int
    total_questions: int

    class Config:
        orm_mode = True
        from_attributes = True


class TopicProgress(BaseModel):
    topic_title: str
    total_score: float
    total_questions: int

    class Config:
        orm_mode = True
        from_attributes = True


class AdminStudentSummaryOut(BaseModel):
    correct_answers: int
    wrong_answers: int
    total_questions: int
    average_score: float



# -------------------- Topic-Based Question Schemas --------------------

class TopicQuestionBase(BaseModel):
    question: str
    answer: str
    correct_answer: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None


class TopicQuestionCreate(TopicQuestionBase):
    topic_id: int
    question_type: Literal["theory", "objective"]


class TopicQuestionOut(TopicQuestionBase):
    id: int
    topic_id: int
    options: Optional[Dict[str, str]] = None

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Admin Analytics Schemas --------------------

class SubjectAverage(BaseModel):
    subject: str
    avg_score: float


class StudentTopicScore(BaseModel):
    user_id: int
    username: str
    topic: str
    subject: str
    total_score: int
    total_questions: int


class DailyProgress(BaseModel):
    day: date
    total_score: int
    total_questions: int


class AdminAnalyticsResponse(BaseModel):
    subject_average: List[SubjectAverage]
    student_topic_scores: List[StudentTopicScore]
    daily_progress: List[DailyProgress]


# -------------------- Timetable Schemas --------------------



class TimetableBase(BaseModel):
    day: str
    subject: str
    start_time: str
    end_time: str
    level: str
    department: Optional[str] = None

    @validator("day", "subject", "level", pre=True)
    def strip_and_lower(cls, v):
        return v.strip().lower() if isinstance(v, str) else v

class TimetableCreate(TimetableBase):
    period: Optional[int] = None  # Still allow creating without a period, if needed

class TimetableOut(BaseModel):
    id: int
    day: str
    subject: str   # ✅ This is subject **name** in output
    start_time: str
    end_time: str
    level: str
    department: Optional[str]
    period: Optional[int] = None

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Attendance Schemas --------------------

class AttendanceBase(BaseModel):
    student_id: int
    date: Optional[date] = None
    status: str = "present"

    @validator("status")
    def validate_status(cls, v):
        allowed = {"present", "absent", "late", "excused"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: str

    @validator("status")
    def validate_status(cls, v):
        allowed = {"present", "absent", "late", "excused"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    date: date
    status: str
    student: Optional[UserOut] = None

    class Config:
        orm_mode = True
        from_attributes = True


class BulkAttendanceRecord(BaseModel):
    student_id: int
    status: str


class BulkAttendanceRequest(BaseModel):
    records: List[BulkAttendanceRecord]
    date_override: Optional[date] = None


# -------------------- Report Card Schemas --------------------

class ReportCardBase(BaseModel):
    student_id: int
    term: str
    year: int
    subject: str
    first_test_score: Optional[float] = 0.0
    second_test_score: Optional[float] = 0.0
    exam_score: Optional[float] = 0.0
    comment: Optional[str] = None

    @property
    def score(self) -> float:
        return (self.first_test_score or 0.0) + (self.second_test_score or 0.0) + (self.exam_score or 0.0)


class ReportCardCreate(ReportCardBase):
    pass


class ReportCardUpdate(BaseModel):
    comment: Optional[str] = None


class ReportCardOut(ReportCardBase):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True



class AttendanceSummary(BaseModel):
    total_days: int = 0
    present: int = 0
    absent: int = 0
    late: int = 0
    excused: int = 0
    teachers_present: int = 0

    class Config:
        orm_mode = True
        from_attributes = True


class SubjectScore(BaseModel):
    subject: str

    first_test_score: Optional[float] = 0.0
    first_test_total_questions: Optional[int] = 0
    first_test_percentage: Optional[float] = 0.0

    second_test_score: Optional[float] = 0.0
    second_test_total_questions: Optional[int] = 0
    second_test_percentage: Optional[float] = 0.0

    exam_score: Optional[float] = 0.0
    exam_total_questions: Optional[int] = 0
    exam_percentage: Optional[float] = 0.0

    total: float = 0.0
    comment: Optional[str] = None



class ReportStudentInfo(BaseModel):
    full_name: str
    guardian_name: Optional[str]
    contact_number: Optional[str]
    address: Optional[str]
    profile_image: Optional[str]
    date_of_birth: Optional[str] = None
    state_of_origin: Optional[str] = None
    gender: Optional[str] = None


class ReportPreviewOut(BaseModel):
    student: ReportStudentInfo
    term: str
    year: int
    level: Optional[str] = None
    attendance: AttendanceSummary
    subjects: List[SubjectScore]

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Test / Exam Results --------------------

class TestResultCreate(BaseModel):
    subject: str
    level: str
    test_type: str
    total_score: int
    total_questions: int


class TestResultOut(TestResultCreate):
    user_id: int
    percentage: Decimal
    submitted_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class ExamResultCreate(BaseModel):
    subject: str
    level: str
    test_type: str
    total_score: int
    total_questions: int


class ExamResultOut(ExamResultCreate):
    user_id: int
    percentage: Decimal
    submitted_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Test/Exam Submission --------------------

class SingleTestAnswer(BaseModel):
    question_id: int
    selected_option: Optional[str] = None
    user_answer: Optional[str] = None

    @model_validator(mode="after")
    def validate_either_selected_or_user_answer(self):
        if not self.selected_option and not self.user_answer:
            raise ValueError("Either selected_option or user_answer must be provided.")
        return self

class SubmitTestAnswers(BaseModel):
    test_type: str
    subject: str
    answers: List[SingleTestAnswer]

# -------------------- Report Card Generation --------------------

class GenerateStudentReportIn(BaseModel):
    student_id: int
    term: str
    year: int


# -------------------- Personalized Recommendation --------------------

class TopicBase(BaseModel):
    id: int
    title: str
    week_number: int
    subject_id: int

    class Config:
        orm_mode = True


class PersonalizedRecommendations(BaseModel):
    recommended_topics: List[TopicOut]
    risk_level: str
    missed_days: int



class ResourceCreate(BaseModel):
    title: str
    description: str
    subject: str
    level: str
    student_class: str

class ResourceOut(ResourceCreate):
    id: int
    file_path: str
    uploaded_by: int

    class Config:
        orm_mode = True


class TeacherSubjectAssign(BaseModel):
    teacher_id: int
    subject_id: int


class TeacherSubjectOut(BaseModel):
    subject: SubjectOut

    class Config:
        orm_mode = True
        from_attributes = True

class TeacherWithSubjects(UserOut):
    subjects_taught: List[TeacherSubjectOut] = []

    class Config:
        orm_mode = True
        from_attributes = True


class TeacherClassAssign(BaseModel):
    teacher_id: int
    level: str
    department: Optional[str] = "general"



class TeacherProfileWithUser(BaseModel):
    id: int
    user: UserOut
    level: str
    department: str

    class Config:
        orm_mode = True


class StudentProgress(BaseModel):
    user_id: int
    full_name: str
    username: str
    topics: List[TopicProgress]

    class Config:
        orm_mode = True
        from_attributes = True


class TeacherSubjectWithProgress(BaseModel):
    subject_name: str
    level: str
    department: Optional[str] = None
    students: List[StudentProgress]

    class Config:
        orm_mode = True
        from_attributes = True


class StudentProgressSummary(BaseModel):
    user_id: int
    full_name: str
    level: str
    topics_covered: int
    avg_score: float



class MyProgressSummaryOut(BaseModel):
    total_topics: int
    completed_topics: int
    total_questions: int
    average_score: float

class SubjectPerformanceOut(BaseModel):
    subject_name: str
    average_score: float



class AnswerCheckRequest(BaseModel):
    question_id: int
    answer: str

class AnswerCheckResponse(BaseModel):
    is_correct: bool
    correct_answer: Optional[str] = None


class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    correct_answer: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    class Config:
        from_attributes = True
        validate_by_name = True








class SimpleSubmissionOut(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    file_url: str
    submitted_at: datetime
    score: Optional[float] = None
    status: Optional[str] = None

    class Config:
        orm_mode = True

class SimpleAssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: datetime

    class Config:
        orm_mode = True



# -------------------- Question Schemas --------------------
class TheoryQuestionCreate(BaseModel):
    question_text: str
    model_answer: str

class ObjectiveQuestionCreate(BaseModel):
    question_text: str
    option1: str
    option2: str
    option3: str
    option4: str
    correct_option: Literal["option1", "option2", "option3", "option4"]

class TheoryQuestionOut(BaseModel):
    id: int
    question_text: str 
    model_answer: str

    class Config:
        orm_mode = True
        from_attributes = True

class ObjectiveQuestionOut(BaseModel):
    id: int
    question_text : str
    option1: str
    option2: str
    option3: str
    option4: str
    correct_option: str

    class Config:
        orm_mode = True
        from_attributes = True
        allow_population_by_field_name = True

# -------------------- Answer Input Schemas --------------------
class TheoryAnswerCreate(BaseModel):
    question_id: int
    student_answer: str = Field(..., alias="answer")

class ObjectiveAnswerCreate(BaseModel):
    question_id: int
    selected_option: Literal["option1", "option2", "option3", "option4"]

# -------------------- Output Answer Schemas (✅ with question) --------------------
class TheoryAnswerOut(BaseModel):
    id: int
    question_id: int
    student_answer: str
    score: Optional[float]
    question: Optional[TheoryQuestionOut]  # ✅ include question for correction

    class Config:
        orm_mode = True
        from_attributes = True

class ObjectiveAnswerOut(BaseModel):
    id: int
    question_id: int
    selected_option: str
    is_correct: bool
    question: Optional[ObjectiveQuestionOut]  # ✅ include question for correction

    class Config:
        orm_mode = True
        from_attributes = True

# -------------------- Assignment Light Info Schema --------------------
class AssignmentInfo(BaseModel):
    id: int
    title: str
    due_date: datetime
    subject: Optional[SubjectOut]

    class Config:
        orm_mode = True
        from_attributes = True

# -------------------- Submission Schemas --------------------
class AssignmentSubmissionBase(BaseModel):
    file_url: str

class AssignmentSubmissionCreate(AssignmentSubmissionBase):
    assignment_id: int
    student_id: int
    theory_answers: List[TheoryAnswerCreate] = []
    objective_answers: List[ObjectiveAnswerCreate] = []

class AssignmentSubmissionOut(AssignmentSubmissionBase):
    id: int
    assignment_id: int
    student_id: int
    submitted_at: datetime
    score: Optional[float] = None
    student: Optional[UserOut]
    assignment: Optional[AssignmentInfo]  # ✅ Avoid full recursion
    theory_answers: List[TheoryAnswerOut] = []
    objective_answers: List[ObjectiveAnswerOut] = []
    status: Optional[str] = None


    class Config:
        orm_mode = True
        from_attributes = True

# -------------------- Assignment Full Schema --------------------
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    subject_id: int
    class_level: str

class AssignmentCreate(AssignmentBase):
    theory_questions: List[TheoryQuestionCreate] = Field(default_factory=list)
    objective_questions: List[ObjectiveQuestionCreate] = Field(default_factory=list)

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    subject_id: Optional[int] = None
    class_level: Optional[str] = None

class AssignmentOut(AssignmentBase):
    id: int
    subject: Optional[SubjectOut]
    teacher: Optional[UserOut]
    theory_questions: List[TheoryQuestionOut] = []
    objective_questions: List[ObjectiveQuestionOut] = []
    submissions: Optional[List[AssignmentSubmissionOut]] = []  # ✅ No recursion now

    status: Optional[str] = None
    
    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Graded Assignment --------------------
class GradedAssignmentCreate(BaseModel):
    score: float
    feedback: Optional[str] = None
    graded_by: Optional[int] = None

class GradedAssignmentUpdate(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None
    graded_by: Optional[int] = None

class GradedAssignmentOut(BaseModel):
    id: int
    student_id: int
    assignment_id: int
    content: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    graded_by: Optional[int] = None
    graded_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True


class AssignmentAdminOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    subject: Optional[SubjectOut]
    teacher: Optional[UserOut]
    class_level: str

    theory_questions: List[TheoryQuestionOut] = []
    objective_questions: List[ObjectiveQuestionOut] = []

    # Admin-specific fields
    total_submissions: int
    total_students: int
    completed_submissions: int
    pending_submissions: int
    submissions: List[AssignmentSubmissionOut] = []  # Filtered list of submissions

    class Config:
        orm_mode = True
        from_attributes = True





# -------------------- Chat Schemas --------------------

class ChatMessageBase(BaseModel):
    content: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None  # "audio", "video", "document"

class ChatMessageCreate(ChatMessageBase):
    group_id: int

class ChatMessageOut(ChatMessageBase):
    id: int
    sender: BasicUserOut
    is_deleted: bool
    edit_history: Optional[List[str]] = []
    timestamp: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Chat Group Schemas --------------------

class ChatGroupBase(BaseModel):
    name: str
    level: Optional[str] = None
    department: Optional[str] = None
    is_class_group: bool = False
    is_custom_group: bool = False


class ChatGroupCreate(ChatGroupBase):
    student_ids: Optional[List[int]] = []
    teacher_ids: Optional[List[int]] = []


class ChatGroupOut(ChatGroupBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


# -------------------- Edit / Delete Message Schemas --------------------

class ChatMessageEdit(BaseModel):
    message_id: int
    new_content: str

class ChatMessageDelete(BaseModel):
    message_id: int


# -------------------- Poll Schemas --------------------

class PollOptionCreate(BaseModel):
    option_text: str

class PollCreate(BaseModel):
    question: str
    options: List[PollOptionCreate]
    group_id: int

class PollVote(BaseModel):
    poll_id: int
    option_id: int

class PollOptionOut(BaseModel):
    id: int
    option_text: str
    votes: int

    class Config:
        orm_mode = True
        from_attributes = True

class PollOut(BaseModel):
    id: int
    question: str
    group_id: int
    created_by: int
    created_at: datetime
    options: List[PollOptionOut]

    class Config:
        orm_mode = True
        from_attributes = True


class GroupMemberOut(BasicUserOut):
    is_blocked: bool = False


class RestrictGroupPayload(BaseModel):
    duration_minutes: int  # Required



class DashboardTopic(BaseModel):
    subject: str
    topic_title: str
    pdf_url: Optional[str] = None
    start_time: str
    end_time: str

class DashboardAssignment(BaseModel):
    id: int
    title: str
    due_date: datetime
    subject: Optional[SubjectOut]
    status: str  # "pending" or "completed"
    score: Optional[float] = None  # <-- Add this
    submitted_at: Optional[datetime] = None  # <-- Add this

    class Config:
        orm_mode = True


class DashboardEvent(BaseModel):
    title: str
    event_type: str  # "test", "exam", "school_event"
    date: date
    countdown_days: int

class DashboardProgress(BaseModel):
    total_topics_assigned: int
    topics_completed: int
    topics_remaining: int


class ScheduleItem(BaseModel):
    subject: str
    start_time: str
    end_time: str
    period: int


class StudentDashboardOut(BaseModel):
    student_name: Optional[str] = None  
    date: date
    current_week: int
    today_topics: List[DashboardTopic]
    assignments: List[DashboardAssignment]
    progress: DashboardProgress
    upcoming_events: List[DashboardEvent]
    today_schedule: Optional[List[TimetableOut]] = None

    class Config:
        orm_mode = True



class AttendanceSummary(BaseModel):
    present: int
    absent: int
    teachers_present: int

class RecentLogin(BaseModel):
    full_name: str
    level: Optional[str]
    department: Optional[str]  # ✅ added department
    last_login: Optional[str]

class TopStudent(BaseModel):
    full_name: str
    level: Optional[str]
    department: Optional[str]  # ✅ added department
    average_score: float
    quiz_score: Optional[float] = None
    assignment_score: Optional[float] = None
    test_score: Optional[float] = None
    exam_score: Optional[float] = None


class AdminDashboard(BaseModel):
    logins: List[RecentLogin]
    topStudents: List[TopStudent]
    onlineStudents: List[RecentLogin]


class ParentChildAssociationCreate(BaseModel):
    child_id: int
    # approved will be set by the backend, not directly by the parent

class ParentChildAssociationOut(BaseModel):
    id: int
    parent_id: int
    parent: Optional[BasicUserOut]
    child: BasicUserOut # Include child's basic info for display
    approved: bool

    class Config:
        orm_mode = True
        from_attributes = True

class ParentChildAssociationUpdate(BaseModel):
    approved: bool


# -------------------- MeResponse Type Union --------------------
# You might want to define a specific ParentUserOut if they have distinct fields on their profile
class ParentUserOut(UserOut): # Inherit from UserOut and add parent-specific relationships
    parent_of_children: List[ParentChildAssociationOut] = [] # List of children associated with this parent

    class Config:
        orm_mode = True
        from_attributes = True


class ChildBrief(BaseModel):
    id: int
    full_name: str
    student_class: str
    level: str

class ParentWithChildrenOut(BaseModel):
    id: int
    full_name: str
    email: str
    children: List[ChildBrief]


class ChildSummaryOut(BaseModel):
    id: int
    full_name: str
    level: Optional[str]

    class Config:
        orm_mode = True
        from_attributes = True

    

MeResponse = Union[UserOut, TeacherProfileWithUser, StudentProfileOut, ParentUserOut] # Add ParentUserOut to the union


# Rebuild models to resolve forward references
UserOut.model_rebuild()
UserOutWithProfile.model_rebuild()
StudentProfileOut.model_rebuild()
TeacherProfileOut.model_rebuild()
BasicUserOut.model_rebuild()
ParentWithChildrenOut.model_rebuild()
StudentDashboardOut.model_rebuild()
ChildSummaryOut.model_rebuild()
