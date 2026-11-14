# KATTR0LI (கற்றொளி) — Multi-Agent Adaptive Learning Platform

> **Learn. Discover. Evolve.**  
> *The Light of Learning — AI-Powered Personalized Education with Visible Multi-Agent Collaboration & Closed-Loop Adaptive Roadmaps*

---

## 🌟 Brand Identity: KATTR0LI (கற்றொளி)

**KATTR0LI** (pronounced *Kat-trö-li*, written in Tamil as **கற்றொளி**) translates to **"The Light of Learning"**.

Unlike traditional static educational platforms that hand identical courses to every student, **KATTR0LI** acts as an intelligent beacon. Powered by **eight collaborative AI agents orchestrated via LangGraph**, the platform illuminates each learner's unique skill gaps, recommends optimal career trajectories, synthesizes personalized weekly learning roadmaps with 100% verified authentic resources, and automatically adapts curricula in real time when learners face conceptual obstacles.

---

## 🏆 Core Pillars & Judging Highlights

KATTR0LI is engineered around three foundational pillars:

| Judging Pillar | How KATTR0LI Solves It |
| :--- | :--- |
| **1. Evidence-Based Personalization** | Rather than blindly trusting self-reports, KATTR0LI normalizes multi-source evidence (self-reported ratings, resume parsing, academic certifications, diagnostic assessments, and practical exercise coding submissions) using weighted mathematical normalization (0–5.0 scale). |
| **2. Visible Multi-Agent Collaboration** | Live **Agent Activity Center** streaming via **Server-Sent Events (SSE)**. Evaluators observe real-time agent handoffs (Profiler → Skill Analyst → Career Matcher → Path Planner → Resource Curator → Assessment Agent → Progress Evaluator → AI Mentor), execution timings in milliseconds, telemetry, and structured JSON payloads. |
| **3. Closed-Loop Adaptive Learning** | Dynamic replanning triggered by assessment diagnostic scores. Scoring **<60%** automatically branches into **Roadmap v2**, injecting targeted remedial foundations, delaying dependent advanced frameworks, and generating explainable adaptation rationale. Career transitions preserve overlapping competencies with exact carry-over calculations. |

---

## 🧠 The 8 Specialized AI Agents (LangGraph Architecture)

```
[Profiler Agent]
       ↓ (normalized multi-source competency vector)
[Skill Analyst Agent]
       ↓ (radar data, strengths, prerequisite dependency audit)
[Career Matcher Agent]
       ↓ (career compatibility %, ranked priority gaps)
[Path Planner Agent]
       ↓ (prerequisite-aware weekly module sequence & milestones)
[Resource Curator Agent]  ← [RAG Engine / Verified Authentic Catalog]
       ↓ (3 authentic verified learning resources per module)
[AI Mentor Agent (கற்றொளி வழிகாட்டி)]
       ↓ (pedagogical coaching & roadmap change explanations)
[Learner UI / Assessment Agent]
       ↓ (diagnostic quiz evaluation & subtopic diagnosis)
[Progress Evaluator Agent]
       ↳ (if score < 60%: triggers Path Planner → Curator → Mentor → Roadmap v2!)
```

### Agent Specifications:

1. **Profiler Agent**
   - **Role**: Learner profile normalization, multi-tenant intake, and resume parsing.
   - **Responsibilities**: Extracts skills from projects, education, certifications, and experience; maps competencies to KATTR0LI's skill taxonomy; assigns 0–5 proficiency ratings and confidence scores.
   - **Outputs**: Structured learner profile vector, skills flagged for diagnostic validation.

2. **Skill Analyst Agent**
   - **Role**: Multi-dimensional skill vector analysis and prerequisite dependency auditing.
   - **Responsibilities**: Audits prerequisite chains using strict directed acyclic graph (DAG) validation; identifies strengths (≥3.0) and weaknesses (<2.5); prepares 8-axis radar visualization benchmarks.
   - **Outputs**: Strengths, weaknesses, radar benchmarks, missing prerequisites.

3. **Career Matcher Agent**
   - **Role**: Algorithmic career compatibility matrix and gap ranking across benchmark roles.
   - **Responsibilities**: Calculates weighted role compatibility; ranks skill gaps by priority; recommends adjacent career opportunities.
   - **Outputs**: Career match %, ranked gaps, adjacent career recommendations.

4. **Path Planner Agent**
   - **Role**: Personalized learning roadmap synthesis and adaptive sequence optimization.
   - **Responsibilities**: Generates weekly modules based on learner commitment; skips mastered skills; organizes learning objectives, practical projects, and completion criteria.
   - **Outputs**: Time-bound roadmap with weekly modules and milestone checkpoints.

5. **Resource Curator Agent**
   - **Role**: RAG-based learning resource retrieval and pedagogical curation.
   - **Responsibilities**: Queries verified catalog using semantic vector search; curates 3 verified resources per module (documentation, tutorials, projects); explains suitability.
   - **Quality Guarantee**: **100% verified authentic URLs** from freeCodeCamp, MDN Web Docs, The Odin Project, Python Docs, Kaggle, AWS, and GitHub. **Zero synthetic or dead links**.

6. **Assessment Agent**
   - **Role**: Diagnostic testing, code snippet evaluation, and conceptual grading.
   - **Responsibilities**: Generates level-tuned quizzes with multiple-choice, code snippet tracing, and conceptual questions; grades submissions; pinpoints weak subtopics.
   - **Outputs**: Score %, passed flag, weak subtopics, detailed explanations.

7. **Progress Evaluator Agent**
   - **Role**: Proficiency progression tracking and adaptive replanning trigger.
   - **Responsibilities**: Applies mathematical skill update formula; detects learning difficulties; triggers adaptive roadmap replanning when score < 60%.
   - **Outputs**: Updated proficiency, adaptation decision (True/False), adaptation rationale.

8. **AI Mentor Agent (கற்றொளி வழிகாட்டி)**
   - **Role**: Contextual mentorship, pedagogical coaching, and roadmap change explanations.
   - **Responsibilities**: Delivers supportive guidance; explains difficult concepts (e.g. JavaScript Event Loop, Closures, React State); explains why roadmaps adapt; suggests next actions.

---

## 🔒 Enterprise Security & Password-Based Authentication

KATTR0LI features a robust, production-grade security architecture:

- **Bcrypt Password Hashing**: Passwords salted and hashed with `bcrypt` (`$2b$`). Plaintext passwords are never stored.
- **Session Management**: JWT Bearer token sessions supporting dynamic duration via **"Remember Me"** (30-day persistence in `localStorage` vs session-only in `sessionStorage`).
- **User Data Isolation**: Strict multi-tenant row-level data scoping (`user_id`). Users can never view or modify another learner's learning path.
- **Self-Service Password Recovery**: Secure, cryptographically generated single-use 1-hour reset tokens (`secrets.token_urlsafe(32)`).
- **Role-Based Access Control (RBAC)**: Support for `student`, `employee`, `university_admin`, and `organization_admin`.

---

## 📐 Core Mathematical Algorithms

KATTR0LI implements real, verifiable mathematical formulas:

### 1. Career Match Score
$$\text{match\_percentage} = \frac{\sum_{i} \left( \text{weight}_i \cdot \min\left(\frac{\text{user\_level}_i}{\text{required\_level}_i}, 1\right) \right)}{\sum_i \text{weight}_i} \times 100$$

### 2. Skill Gap Priority
$$\text{priority} = \text{weight} \cdot (\text{required\_level} - \text{current\_level}) \cdot \text{dependency\_depth\_bonus}$$

### 3. Skill Update After Assessment
$$\text{new\_level} = 0.6 \cdot \text{old\_level} + 0.4 \cdot \text{quiz\_level}$$

### 4. Career Switch Carry-Over Percentage
$$\text{carry\_over\_percentage} = \frac{\sum \min(\text{user\_level}_i, \text{required\_level}_i) \cdot \text{weight}_i}{\sum \text{required\_level}_i \cdot \text{weight}_i} \times 100$$

---

## 💻 Technology Stack

- **Frontend**: Next.js / React 19, TypeScript, Tailwind CSS, Recharts (Radar charts, Bar distributions), React Flow (`@xyflow/react` interactive node roadmap graph), Lucide Icons, Canvas-Confetti.
- **Design System**: Light-first editorial palette (`#F6F7F9` paper, `#FFFFFF` card surface, `#17202A` ink, `#0F766E` deep teal accent, `#DDE1E7` hairline borders).
- **Backend**: Python 3.12, FastAPI, RESTful APIs, Server-Sent Events (SSE), SQLAlchemy ORM, SQLite (`skillpilot.db`, PostgreSQL-compatible schema), Pydantic v2 validation.
- **Multi-Agent Orchestration**: LangGraph (`StateGraph`, structured TypedDict state).
- **RAG Engine**: Pure-Python TF-IDF & Cosine Similarity vector search over curated verified catalog of authentic learning resources.

---

## 🚀 Quick Start Guide

### 1. Backend Setup:
```powershell
# Navigate to project root
cd C:\Users\heshi\Downloads\PROMPTWRS

# Install Python requirements
python -m pip install -r requirements.txt

# Run the automated system test suite
python -m backend.tests.test_all_workflows

# Run the authentication and multi-tenancy test suite
python -m backend.tests.test_auth_system

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup:
```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start the Vite development server
npm run dev -- --host 127.0.0.1 --port 3000
```

Access the application in your browser at: **`http://127.0.0.1:3000`**  
Access the backend API documentation at: **`http://127.0.0.1:8000/docs`**

---

## 📄 License & Attribution

KATTR0LI (கற்றொளி) is developed under the MIT License.  
*Brand Tagline: Learn. Discover. Evolve.*
