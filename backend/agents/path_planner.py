import time
from typing import Dict, Any, List
from backend.agents.state import SkillPilotState
from backend.agents.event_bus import agent_event_bus

PATH_PLANNER_SYSTEM_PROMPT = """
You are the Path Planner Agent for KATTR0LI (கற்றொளி), the adaptive learning platform.
Responsibilities:
- Generate personalized learning roadmaps.
- Consider existing skills and prerequisites.
- Consider available weekly learning hours.
- Consider the learner's target completion date.
- Organize modules into weeks.
- Create milestones and practical projects.
- Avoid repeating skills that have already been mastered.
- Adapt roadmap when notified of diagnostic difficulty.
"""

def run_path_planner_agent(state: SkillPilotState) -> Dict[str, Any]:
    start_time = time.time()
    user_id = state.get("user_id", 1)
    target_role_title = state.get("preferred_career_role_title", "Full Stack Developer")
    weekly_hours = state.get("weekly_hours", 10.0)
    ranked_gaps = state.get("ranked_skill_gaps", [])
    skill_vector = state.get("skill_vector", {})
    adaptation_triggered = state.get("adaptation_triggered", False)
    adaptation_reason = state.get("adaptation_reason", "")
    current_version = state.get("roadmap_version", 1)

    modules: List[Dict[str, Any]] = []
    week_counter = 1

    if adaptation_triggered:
        new_version = current_version + 1
        # Insert Remedial Module for JavaScript
        modules.append({
            "week_number": 1,
            "sequence_order": 1,
            "title": "JavaScript Fundamentals Refresher & Async Deep Dive",
            "skill_id": 2,
            "skill_name": "JavaScript",
            "duration_hours": weekly_hours,
            "learning_objectives": [
                "Master asynchronous JavaScript: Event Loop, Callbacks, Promises, and async/await",
                "Understand closures, scope chain, and variable hoisting",
                "Practice DOM manipulation and asynchronous API fetching with error handling"
            ],
            "practical_exercise": "Build an Async Weather & Currency Dashboard with robust promise retry logic",
            "completion_criteria": "Pass diagnostic quiz with >= 80% and submit working asynchronous API fetch script",
            "status": "in_progress",
            "is_remedial": True
        })
        week_counter = 2

        modules.append({
            "week_number": 2,
            "sequence_order": 1,
            "title": "Modern JavaScript ES6+ & Data Manipulation Practice",
            "skill_id": 2,
            "skill_name": "JavaScript",
            "duration_hours": weekly_hours,
            "learning_objectives": [
                "Deconstruct modern array methods: map, filter, reduce, find, some, every",
                "Modular JavaScript: ES Modules, imports, exports, and bundling fundamentals"
            ],
            "practical_exercise": "Create an interactive in-memory shopping cart with item filters and coupon calculations",
            "completion_criteria": "Implement 10 complex array transformations with 100% test coverage",
            "status": "pending",
            "is_remedial": True
        })
        week_counter = 3

        modules.append({
            "week_number": week_counter,
            "sequence_order": 1,
            "title": "React Component Architecture & Hooks Foundation (Delayed by 1 week)",
            "skill_id": 4,
            "skill_name": "React",
            "duration_hours": weekly_hours,
            "learning_objectives": [
                "Component breakdown and props vs state",
                "Master useState and useEffect lifecycles",
                "Controlled form inputs and event handling"
            ],
            "practical_exercise": "Build a modular task management kanban board in React",
            "completion_criteria": "Deploy interactive board with persistent local state",
            "status": "pending",
            "is_remedial": False
        })
        week_counter += 1

        modules.append({
            "week_number": week_counter,
            "sequence_order": 1,
            "title": "Advanced React State Management & Custom Hooks",
            "skill_id": 4,
            "skill_name": "React",
            "duration_hours": weekly_hours,
            "learning_objectives": [
                "Context API and useReducer for complex shared state",
                "Author custom hooks for window resizing and data caching",
                "Performance optimization with useMemo and useCallback"
            ],
            "practical_exercise": "Develop an authenticated dashboard with dark mode and global state",
            "completion_criteria": "Zero unnecessary re-renders measured via React Profiler",
            "status": "pending",
            "is_remedial": False
        })
        week_counter += 1

        modules.append({
            "week_number": week_counter,
            "sequence_order": 1,
            "title": "Node.js & Express RESTful API Development",
            "skill_id": 5,
            "skill_name": "Node.js",
            "duration_hours": weekly_hours,
            "learning_objectives": [
                "Node.js event-driven architecture and Express routing",
                "Middleware patterns, request validation, and error logging",
                "RESTful endpoint design conventions"
            ],
            "practical_exercise": "Create a full REST API for product catalog with JSON validation",
            "completion_criteria": "All CRUD endpoints documented and tested with HTTP test suites",
            "status": "pending",
            "is_remedial": False
        })
        week_counter += 1

        modules.append({
            "week_number": week_counter,
            "sequence_order": 1,
            "title": "Full-Stack Integration, SQL Persistence & Capstone Deployment",
            "skill_id": 8,
            "skill_name": "REST APIs",
            "duration_hours": weekly_hours,
            "learning_objectives": [
                "Connect React frontend to Express backend and SQL database",
                "Implement JWT token authentication and route protection",
                "Deploy full-stack system with CI/CD pipeline and environment configuration"
            ],
            "practical_exercise": "Complete full-stack production SaaS portfolio application",
            "completion_criteria": "Fully functional live deployment with database seeding and user auth",
            "status": "pending",
            "is_remedial": False
        })

    else:
        new_version = current_version
        
        for gap in ranked_gaps:
            s_name = gap["skill_name"]
            s_id = gap["skill_id"]
            curr = gap["current_level"]
            req = gap["required_level"]

            if curr >= req:
                continue

            if s_name == "JavaScript":
                modules.append({
                    "week_number": week_counter,
                    "sequence_order": 1,
                    "title": "Modern JavaScript Core: ES6+, DOM & Asynchronous APIs",
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "duration_hours": weekly_hours,
                    "learning_objectives": [
                        "Master ES6+ arrow functions, destructuring, and spread operators",
                        "DOM event listeners, event delegation, and dynamic rendering",
                        "Promises, fetch API, and async/await error boundaries"
                    ],
                    "practical_exercise": "Build an asynchronous Github user explorer that searches and graphs repository metrics",
                    "completion_criteria": "Score >= 80% on JavaScript Diagnostic Quiz and submit working repository search app",
                    "status": "in_progress",
                    "is_remedial": False
                })
                week_counter += 1
            elif s_name == "React":
                modules.append({
                    "week_number": week_counter,
                    "sequence_order": 1,
                    "title": "React Component Architecture, Hooks & State Management",
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "duration_hours": weekly_hours,
                    "learning_objectives": [
                        "Functional components, JSX compilation, and props contracts",
                        "Core hooks: useState, useEffect, and useRef",
                        "Component styling with Tailwind CSS and modular layouts"
                    ],
                    "practical_exercise": "Build an interactive eCommerce shopping cart with reactive filtering",
                    "completion_criteria": "Pass component state assessment and deliver responsive web app",
                    "status": "pending",
                    "is_remedial": False
                })
                week_counter += 1
                modules.append({
                    "week_number": week_counter,
                    "sequence_order": 1,
                    "title": "Advanced React Patterns, Context & Performance",
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "duration_hours": weekly_hours,
                    "learning_objectives": [
                        "Global state using Context and custom reducer hooks",
                        "Custom hooks for network fetching and debounce",
                        "Code splitting with React.lazy and Suspense"
                    ],
                    "practical_exercise": "Develop a multi-view dashboard with real-time UI updates",
                    "completion_criteria": "Pass React advanced quiz with zero performance bottlenecks",
                    "status": "pending",
                    "is_remedial": False
                })
                week_counter += 1
            elif s_name == "Node.js":
                modules.append({
                    "week_number": week_counter,
                    "sequence_order": 1,
                    "title": "Node.js Runtime & Express Server Architecture",
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "duration_hours": weekly_hours,
                    "learning_objectives": [
                        "Event loop, streams, and file system primitives in Node",
                        "Express server initialization, routing, and middleware chain",
                        "Environment configuration and security headers"
                    ],
                    "practical_exercise": "Build a modular REST API backend with logging and rate limiting",
                    "completion_criteria": "Demonstrate robust middleware error handling and automated endpoint tests",
                    "status": "pending",
                    "is_remedial": False
                })
                week_counter += 1
            elif s_name == "REST APIs":
                modules.append({
                    "week_number": week_counter,
                    "sequence_order": 1,
                    "title": "REST API Architecture, Authentication & OpenAPI Standards",
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "duration_hours": weekly_hours,
                    "learning_objectives": [
                        "HTTP methods, status code semantics, and idempotent mutations",
                        "JWT token generation, payload verification, and password hashing",
                        "OpenAPI / Swagger documentation generation"
                    ],
                    "practical_exercise": "Create an authenticated User & Role Management API service",
                    "completion_criteria": "All protected routes return 401 on missing or expired tokens",
                    "status": "pending",
                    "is_remedial": False
                })
                week_counter += 1
            elif s_name == "Machine Learning":
                modules.append({
                    "week_number": week_counter,
                    "sequence_order": 1,
                    "title": "Machine Learning Fundamentals, Scikit-Learn & Feature Engineering",
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "duration_hours": weekly_hours,
                    "learning_objectives": [
                        "Supervised vs unsupervised learning paradigms",
                        "Feature scaling, one-hot encoding, and cross-validation pipelines",
                        "Model evaluation: Precision, Recall, F1 score, and ROC curves"
                    ],
                    "practical_exercise": "Train and evaluate an end-to-end customer churn prediction classifier on Kaggle",
                    "completion_criteria": "Achieve > 85% ROC-AUC score and submit reproducible Jupyter notebook",
                    "status": "pending",
                    "is_remedial": False
                })
                week_counter += 1
            elif s_name == "Cloud Computing":
                modules.append({
                    "week_number": week_counter,
                    "sequence_order": 1,
                    "title": "Cloud Infrastructure, Containers & Microservice Deployment",
                    "skill_id": s_id,
                    "skill_name": s_name,
                    "duration_hours": weekly_hours,
                    "learning_objectives": [
                        "Docker containerization for frontend and backend microservices",
                        "Cloud primitives: Compute, Blob Storage, IAM permissions, VPC networks",
                        "CI/CD deployment pipelines"
                    ],
                    "practical_exercise": "Containerize full application and deploy to cloud provider with automated build actions",
                    "completion_criteria": "Live public HTTPS endpoint with automated deployment on push",
                    "status": "pending",
                    "is_remedial": False
                })
                week_counter += 1

        modules.append({
            "week_number": week_counter,
            "sequence_order": 1,
            "title": f"Capstone Milestone: End-to-End {target_role_title} Production System",
            "skill_id": 8,
            "skill_name": "Full Stack Capstone",
            "duration_hours": weekly_hours,
            "learning_objectives": [
                f"Synthesize all {target_role_title} competencies into a portfolio-grade capstone",
                "Write comprehensive integration tests and user acceptance scenarios",
                "Deploy with production monitoring and documentation"
            ],
            "practical_exercise": "Deploy full application with database, authentication, and responsive frontend",
            "completion_criteria": "Complete code review and functional verification of capstone project",
            "status": "pending",
            "is_remedial": False
        })

    milestones = [
        {"week": 2, "name": "Foundational Mastery & Frontend Fluency"},
        {"week": 5, "name": "Backend Services & Architectural Competence"},
        {"week": max(week_counter, len(modules)), "name": f"Production-Ready {target_role_title} Capstone"}
    ]

    execution_time = (time.time() - start_time) * 1000.0

    task_desc = f"Generate adapted roadmap v{new_version} for {target_role_title}" if adaptation_triggered else f"Generate initial personalized roadmap for {target_role_title}"
    input_summary = f"Target: {target_role_title}, {weekly_hours}h/wk, {len(ranked_gaps)} ranked gaps" + (f", Adaptation: {adaptation_reason}" if adaptation_triggered else "")
    output_summary = f"Generated {len(modules)} weekly modules across {max(week_counter, len(modules))} weeks (Roadmap v{new_version})." + (" Remedial module inserted, React delayed 1 week." if adaptation_triggered else "")

    agent_event_bus.emit_sync(
        user_id=user_id,
        agent_name="Path Planner Agent",
        status="adapted" if adaptation_triggered else "completed",
        task=task_desc,
        input_summary=input_summary,
        output_summary=output_summary,
        execution_time_ms=execution_time,
        next_agent="Resource Curator Agent",
        metadata={"version": new_version, "modules_count": len(modules), "is_adapted": adaptation_triggered}
    )

    trace = {
        "agent_name": "Path Planner Agent",
        "status": "adapted" if adaptation_triggered else "completed",
        "task": f"Roadmap Synthesis & Adaptive Sequence Optimization (v{new_version})",
        "input_summary": input_summary,
        "output_summary": output_summary,
        "execution_time_ms": execution_time,
        "next_agent": "Resource Curator Agent",
        "metadata": {
            "roadmap_version": new_version,
            "total_modules": len(modules),
            "adaptation_triggered": adaptation_triggered
        }
    }

    logs = list(state.get("agent_logs", []))
    logs.append(trace)

    return {
        "roadmap_modules": modules,
        "total_weeks": max(week_counter, len(modules)),
        "milestones": milestones,
        "roadmap_version": new_version,
        "agent_logs": logs,
        "current_agent": "Resource Curator Agent"
    }
