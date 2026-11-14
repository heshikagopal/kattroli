from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    role: Optional[str] = "student" # student, employee, university_admin, organization_admin
    department_name: Optional[str] = "Computer Science"
    organization_id: Optional[int] = 1

class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class MessageResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None
    reset_url: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str = "student"
    is_active: bool = True

class OnboardingRequest(BaseModel):
    full_name: str
    education: Optional[str] = "Computer Science Student"
    academic_year_or_experience: Optional[str] = "Junior (3rd Year)"
    preferred_career_role_id: int
    weekly_hours: float = 10.0
    target_date: Optional[str] = "12 weeks"
    skills: List[dict] # [{"skill_id": 1, "proficiency": 3.0, "name": "Python"}]
    certifications: Optional[str] = ""
    projects: Optional[str] = ""
    resume_text: Optional[str] = ""

class RoleSwitchRequest(BaseModel):
    role: str # student, employee, university_admin, organization_admin

class UserResponse(UserBase):
    id: int
    role: str = "student"
    is_active: bool = True
    organization_id: Optional[int] = 1
    department_name: Optional[str] = "Computer Science"
    education: Optional[str] = None
    academic_year_or_experience: Optional[str] = None
    weekly_hours: float = 10.0
    target_date: Optional[str] = None
    current_role_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
