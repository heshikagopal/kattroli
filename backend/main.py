import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import Base, engine, SessionLocal
from backend.models import User
from backend.data.seed import seed_database

# Ensure database schema exists
Base.metadata.create_all(bind=engine)

# Routers
from backend.routers import (
    auth, onboarding, skills, careers, roadmaps, assessments,
    mentor, agents, demo, admin, notifications
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="KATTR0LI (கற்றொளி) — Multi-Agent Adaptive Learning Platform API. The Light of Learning. Learn. Discover. Evolve."
)

# Enable CORS for Next.js / Vite / React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(skills.router)
app.include_router(careers.router)
app.include_router(roadmaps.router)
app.include_router(assessments.router)
app.include_router(mentor.router)
app.include_router(agents.router)
app.include_router(demo.router)
app.include_router(admin.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {
        "platform": "KATTR0LI",
        "brand_tamil": "கற்றொளி",
        "brand_meaning": "The light of learning",
        "tagline": "Learn. Discover. Evolve.",
        "description": "An AI-powered personalized learning platform that helps learners discover skill gaps, explore career opportunities, and follow adaptive learning roadmaps.",
        "version": settings.PROJECT_VERSION,
        "status": "operational",
        "agents": [
            "Profiler Agent",
            "Skill Analyst Agent",
            "Career Matcher Agent",
            "Path Planner Agent",
            "Resource Curator Agent",
            "Assessment Agent",
            "Progress Evaluator Agent",
            "Mentor Agent"
        ],
        "features": [
            "University & Organization Admin Dashboard",
            "Evidence-Based Skill Validation",
            "Explainable AI Recommendations",
            "Prerequisite-Aware Learning Engine",
            "Learning Outcome Verification",
            "Advanced Adaptive Learning Scenarios",
            "Advanced Career Intelligence & Transition Planning",
            "Personalized AI Mentor with Grounded Actions",
            "Advanced Analytics & Multi-Tenancy",
            "Roadmap Version History & Diff Comparison",
            "100% Curated Verified Resources",
            "In-App Notification Center"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "kattr0li-api", "platform": "KATTR0LI (கற்றொளி)"}
