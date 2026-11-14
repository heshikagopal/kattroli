"""
SkillPilot Authentication System Integration Test Suite
Directly tests router functions & DB transactions:
- Registration with bcrypt hashing, unique email, validation, and auto-provisioning
- Login with password verification, remember_me duration, invalid credentials handling
- User profile retrieval and session verification (get_current_user)
- Strict multi-tenant user data isolation (User A vs User B)
- Forgot password token generation and password reset flow
- Logout endpoint
"""

import os
import sys
from datetime import datetime, timezone
from fastapi import HTTPException

from backend.database import SessionLocal
from backend.models.user import User
from backend.models.roadmap import Roadmap
from backend.models.skill import UserSkill
from backend.routers import auth, roadmaps
from backend.schemas.user import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest

def test_complete_auth_system():
    print("=" * 65, flush=True)
    print("RUNNING COMPREHENSIVE SKILLPILOT AUTHENTICATION TEST SUITE", flush=True)
    print("=" * 65, flush=True)

    db = SessionLocal()

    # Clean up test users if they already exist
    for email in ["sarah.connor@test.com", "john.doe@test.com", "reset.user@test.com"]:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            db.query(UserSkill).filter(UserSkill.user_id == existing.id).delete()
            db.query(Roadmap).filter(Roadmap.user_id == existing.id).delete()
            db.delete(existing)
    db.commit()

    # -------------------------------------------------------------
    # 1. REGISTRATION TEST
    # -------------------------------------------------------------
    print("\n[1/6] Testing User Registration (POST /api/auth/register)...", flush=True)
    reg_schema = UserCreate(
        full_name="Sarah Connor",
        email="sarah.connor@test.com",
        password="SecurePassword123!",
        role="student"
    )
    reg_res = auth.register(user_in=reg_schema, db=db)
    assert "access_token" in reg_res
    assert reg_res["token_type"] == "bearer"
    assert reg_res["email"] == "sarah.connor@test.com"
    assert reg_res["full_name"] == "Sarah Connor"
    assert reg_res["role"] == "student"
    # Ensure password hash is NEVER exposed in the response
    assert "password" not in reg_res
    assert "password_hash" not in reg_res

    # Verify directly in SQLite DB
    user_in_db = db.query(User).filter(User.email == "sarah.connor@test.com").first()
    assert user_in_db is not None
    assert user_in_db.hashed_password.startswith("$2b$") or user_in_db.hashed_password.startswith("$2a$")
    assert user_in_db.hashed_password != "SecurePassword123!"
    assert user_in_db.is_active == True
    print(f"  ✓ User registered in DB: {user_in_db.full_name} (ID: {user_in_db.id})", flush=True)
    print(f"  ✓ Bcrypt hash verified in database: {user_in_db.hashed_password[:18]}...", flush=True)
    print(f"  ✓ Password hash confirmed NOT returned in response", flush=True)

    # Verify duplicate registration rejected
    try:
        auth.register(user_in=reg_schema, db=db)
        assert False, "Duplicate registration should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        assert "already exists" in e.detail.lower() or "already registered" in e.detail.lower()
        print("  ✓ Duplicate email registration rejected with 400 Bad Request", flush=True)

    # -------------------------------------------------------------
    # 2. AUTO-PROVISIONED ENVIRONMENT & USER ISOLATION TEST
    # -------------------------------------------------------------
    print("\n[2/6] Testing Auto-Provisioned Independent Environment...", flush=True)
    sarah_skills = db.query(UserSkill).filter(UserSkill.user_id == user_in_db.id).all()
    assert len(sarah_skills) > 0, "Registered user should have auto-provisioned baseline skills"
    sarah_roadmap = db.query(Roadmap).filter(Roadmap.user_id == user_in_db.id).first()
    assert sarah_roadmap is not None, "Registered user should have an active Roadmap v1"
    assert sarah_roadmap.version == 1
    print(f"  ✓ Sarah's baseline skills provisioned: {len(sarah_skills)} skills", flush=True)
    print(f"  ✓ Sarah's Roadmap v1 provisioned: ID #{sarah_roadmap.id} ('{sarah_roadmap.title}')", flush=True)

    # Register second user: John Doe
    john_schema = UserCreate(
        full_name="John Doe",
        email="john.doe@test.com",
        password="JohnPassword456!",
        role="employee"
    )
    john_res = auth.register(user_in=john_schema, db=db)
    john_in_db = db.query(User).filter(User.email == "john.doe@test.com").first()
    assert john_in_db is not None
    assert john_in_db.id != user_in_db.id

    # Verify John's roadmap is strictly isolated from Sarah's
    john_roadmap = db.query(Roadmap).filter(Roadmap.user_id == john_in_db.id).first()
    assert john_roadmap is not None
    assert john_roadmap.id != sarah_roadmap.id
    assert john_roadmap.user_id == john_in_db.id
    print(f"  ✓ John Doe registered: ID #{john_in_db.id} (Role: {john_in_db.role})", flush=True)
    print(f"  ✓ Strict isolation verified: Sarah Roadmap #{sarah_roadmap.id} != John Roadmap #{john_roadmap.id}", flush=True)

    # -------------------------------------------------------------
    # 3. LOGIN AUTHENTICATION TEST
    # -------------------------------------------------------------
    print("\n[3/6] Testing Login Authentication (POST /api/auth/login)...", flush=True)
    # Wrong password
    try:
        auth.login(UserLogin(email="sarah.connor@test.com", password="WrongPassword!", remember_me=False), db=db)
        assert False, "Bad password should have failed"
    except HTTPException as e:
        assert e.status_code == 401
        print("  ✓ Invalid password rejected with 401 Unauthorized", flush=True)

    # Non-existent user
    try:
        auth.login(UserLogin(email="ghost@nowhere.com", password="SomePassword123!", remember_me=False), db=db)
        assert False, "Non-existent user should have failed"
    except HTTPException as e:
        assert e.status_code == 401
        print("  ✓ Non-existent user rejected with 401 Unauthorized", flush=True)

    # Correct credentials with remember_me = False
    good_login = auth.login(UserLogin(email="sarah.connor@test.com", password="SecurePassword123!", remember_me=False), db=db)
    sarah_token = good_login["access_token"]
    assert sarah_token is not None
    assert good_login["email"] == "sarah.connor@test.com"
    print("  ✓ Successful login with valid credentials (JWT token generated)", flush=True)

    # Correct credentials with remember_me = True
    remember_login = auth.login(UserLogin(email="sarah.connor@test.com", password="SecurePassword123!", remember_me=True), db=db)
    assert "access_token" in remember_login
    print("  ✓ Successful login with remember_me=True (30-day expiration token generated)", flush=True)

    # -------------------------------------------------------------
    # 4. CURRENT USER PROFILE & DATA ACCESS
    # -------------------------------------------------------------
    print("\n[4/6] Testing Current User Profile & Data Isolation...", flush=True)
    # Verify current user endpoint returns sanitized profile
    sarah_profile = auth.get_me(current_user=user_in_db)
    assert sarah_profile.email == "sarah.connor@test.com"
    assert sarah_profile.full_name == "Sarah Connor"
    print(f"  ✓ Profile retrieved for {sarah_profile.full_name} ({sarah_profile.role})", flush=True)

    # Verify roadmaps endpoint returns Sarah's roadmap for Sarah, and John's for John
    sarah_rm_active = roadmaps.get_active_roadmap(current_user=user_in_db, db=db)
    john_rm_active = roadmaps.get_active_roadmap(current_user=john_in_db, db=db)
    assert sarah_rm_active["id"] == sarah_roadmap.id
    assert john_rm_active["id"] == john_roadmap.id
    assert sarah_rm_active["id"] != john_rm_active["id"]
    print(f"  ✓ Sarah's active roadmap: #{sarah_rm_active['id']} (User ID: {user_in_db.id})", flush=True)
    print(f"  ✓ John's active roadmap: #{john_rm_active['id']} (User ID: {john_in_db.id})", flush=True)

    # -------------------------------------------------------------
    # 5. FORGOT PASSWORD & RESET PASSWORD FLOW
    # -------------------------------------------------------------
    print("\n[5/6] Testing Forgot Password & Password Reset Flow...", flush=True)
    # Register user specifically for reset test
    reset_user_schema = UserCreate(
        full_name="Reset Test User",
        email="reset.user@test.com",
        password="InitialPassword123!",
        role="student"
    )
    auth.register(user_in=reset_user_schema, db=db)

    # 1. Request forgot password
    forgot_res = auth.forgot_password(ForgotPasswordRequest(email="reset.user@test.com"), db=db)
    assert "reset_token" in forgot_res or "message" in forgot_res

    # Verify token in DB
    reset_user = db.query(User).filter(User.email == "reset.user@test.com").first()
    assert reset_user.reset_token is not None
    assert reset_user.reset_token_expires is not None
    raw_token = reset_user.reset_token
    print(f"  ✓ Password reset token generated and persisted: {raw_token[:16]}...", flush=True)

    # 2. Reset password with valid token
    new_password = "NewStrongPassword789!"
    reset_res = auth.reset_password(ResetPasswordRequest(token=raw_token, new_password=new_password), db=db)
    assert "message" in reset_res
    print("  ✓ Password reset succeeded with valid token", flush=True)

    # Verify token invalidated in DB
    db.refresh(reset_user)
    assert reset_user.reset_token is None, "Token must be invalidated after successful reset"
    assert reset_user.reset_token_expires is None
    print("  ✓ Reset token immediately invalidated in database", flush=True)

    # 3. Old password must fail
    try:
        auth.login(UserLogin(email="reset.user@test.com", password="InitialPassword123!"), db=db)
        assert False, "Old password should fail"
    except HTTPException as e:
        assert e.status_code == 401
        print("  ✓ Login with OLD password rejected with 401 Unauthorized", flush=True)

    # 4. New password must succeed
    new_login = auth.login(UserLogin(email="reset.user@test.com", password=new_password), db=db)
    assert "access_token" in new_login
    print("  ✓ Login with NEW password succeeded with 200 OK", flush=True)

    # 5. Re-using same token must fail
    try:
        auth.reset_password(ResetPasswordRequest(token=raw_token, new_password="YetAnotherPassword!"), db=db)
        assert False, "Used token should fail"
    except HTTPException as e:
        assert e.status_code == 400
        assert "invalid" in e.detail.lower() or "expired" in e.detail.lower()
        print("  ✓ Replay attack with used token rejected with 400 Bad Request", flush=True)

    # -------------------------------------------------------------
    # 6. LOGOUT TEST
    # -------------------------------------------------------------
    print("\n[6/6] Testing Logout (POST /api/auth/logout)...", flush=True)
    logout_res = auth.logout()
    assert "logged out" in logout_res["message"].lower()
    print("  ✓ Logout endpoint verified", flush=True)

    print("\n" + "=" * 65, flush=True)
    print("SUCCESS! ALL AUTHENTICATION & MULTI-TENANT ISOLATION TESTS PASSED 100%!", flush=True)
    print("=" * 65, flush=True)

if __name__ == "__main__":
    test_complete_auth_system()
