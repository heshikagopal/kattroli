import time
from typing import Dict, Any, List
from backend.agents.state import SkillPilotState
from backend.agents.event_bus import agent_event_bus

ASSESSMENT_SYSTEM_PROMPT = """
You are the Assessment Agent for KATTR0LI (கற்றொளி), the adaptive learning platform.
Responsibilities:
- Generate skill-specific diagnostic quizzes.
- Support multiple-choice questions, coding, and conceptual questions.
- Evaluate submitted answers.
- Identify weak subtopics.
- Generate detailed feedback.
"""

SKILL_DIAGNOSTIC_QUESTIONS = {
    # JavaScript (skill_id: 2)
    2: [
        {
            "id": 201,
            "skill_id": 2,
            "difficulty_level": 2,
            "question_text": "What is the output of the following asynchronous JavaScript code snippet?",
            "question_type": "coding",
            "code_snippet": "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');",
            "options": [
                "A, B, C, D",
                "A, D, C, B",
                "A, D, B, C",
                "A, C, D, B"
            ],
            "correct_answer": "A, D, C, B",
            "explanation": "Synchronous code runs first ('A', 'D'). Then microtasks from Promise.then run ('C'). Finally macrotasks like setTimeout callback execute ('B').",
            "subtopic": "Asynchronous Event Loop"
        },
        {
            "id": 202,
            "skill_id": 2,
            "difficulty_level": 2,
            "question_text": "How does a JavaScript closure retain access to its outer scope variables?",
            "question_type": "conceptual",
            "code_snippet": "function createCounter() {\n  let count = 0;\n  return () => ++count;\n}",
            "options": [
                "By copying the outer variables into global window memory",
                "Via the lexical environment reference preserved on the function object",
                "By storing the variables in local storage automatically",
                "Through prototype chain inheritance"
            ],
            "correct_answer": "Via the lexical environment reference preserved on the function object",
            "explanation": "A closure combines a function with references to its surrounding lexical state, allowing it to remember outer variables even after the outer function has executed.",
            "subtopic": "Closures & Scope"
        },
        {
            "id": 203,
            "skill_id": 2,
            "difficulty_level": 2,
            "question_text": "Which method is the most appropriate for catching errors in an async/await function?",
            "question_type": "mcq",
            "code_snippet": "async function fetchData() {\n  // Code here\n}",
            "options": [
                "Using window.onerror handler only",
                "Wrapping the await expression inside a try...catch block",
                "Using the Array.prototype.catch method",
                "Promises in async functions cannot reject"
            ],
            "correct_answer": "Wrapping the await expression inside a try...catch block",
            "explanation": "Inside an async function, rejected promises throw exceptions that can be caught synchronously using standard try...catch blocks.",
            "subtopic": "Asynchronous Error Handling"
        },
        {
            "id": 204,
            "skill_id": 2,
            "difficulty_level": 2,
            "question_text": "What does the 'use strict' directive enforce in modern JavaScript?",
            "question_type": "conceptual",
            "code_snippet": "'use strict';",
            "options": [
                "It enables experimental WebAssembly syntax",
                "It prevents accidental global variable creation and eliminates silent errors",
                "It makes all variables immutable constants",
                "It automatically compiles TypeScript to bytecode"
            ],
            "correct_answer": "It prevents accidental global variable creation and eliminates silent errors",
            "explanation": "'use strict' eliminates silent JavaScript errors by turning them into throw errors and prohibits duplicate parameter names or undeclared variables.",
            "subtopic": "Strict Mode & Standards"
        },
        {
            "id": 205,
            "skill_id": 2,
            "difficulty_level": 2,
            "question_text": "What is the difference between '==' and '===' in JavaScript comparisons?",
            "question_type": "mcq",
            "code_snippet": "0 == '0'  vs  0 === '0'",
            "options": [
                "They are identical in modern ECMAScript",
                "'==' performs type coercion before comparing, while '===' requires equal types and values",
                "'===' only works on numbers and strings",
                "'==' is faster than '==='"
            ],
            "correct_answer": "'==' performs type coercion before comparing, while '===' requires equal types and values",
            "explanation": "Strict equality (===) verifies both value and type without converting types implicitly.",
            "subtopic": "Type Coercion & Operators"
        }
    ],
    # Python (skill_id: 1)
    1: [
        {
            "id": 101,
            "skill_id": 1,
            "difficulty_level": 2,
            "question_text": "What is the purpose of Python's 'with' statement when opening a file?",
            "question_type": "conceptual",
            "code_snippet": "with open('data.txt', 'r') as f:\n    content = f.read()",
            "options": [
                "It automatically closes the file even if exceptions occur (Context Manager)",
                "It reads the file concurrently across multiple CPU threads",
                "It encrypts the file contents in memory",
                "It prevents other processes from reading the file permanently"
            ],
            "correct_answer": "It automatically closes the file even if exceptions occur (Context Manager)",
            "explanation": "The 'with' statement guarantees proper acquisition and release of resources via __enter__ and __exit__ methods.",
            "subtopic": "Context Managers & File I/O"
        },
        {
            "id": 102,
            "skill_id": 1,
            "difficulty_level": 3,
            "question_text": "What is the time complexity of looking up a key in a Python dict on average?",
            "question_type": "conceptual",
            "code_snippet": "val = my_dict['target_key']",
            "options": [
                "O(1) constant time",
                "O(log N) logarithmic time",
                "O(N) linear time",
                "O(N log N)"
            ],
            "correct_answer": "O(1) constant time",
            "explanation": "Python dictionaries are implemented using hash tables, offering amortized O(1) key lookup and insertion.",
            "subtopic": "Data Structures & Time Complexity"
        },
        {
            "id": 103,
            "skill_id": 1,
            "difficulty_level": 2,
            "question_text": "What does a Python generator function use instead of 'return' to produce a stream of values lazily?",
            "question_type": "conceptual",
            "code_snippet": "def count_up():\n    yield 1",
            "options": [
                "stream",
                "yield",
                "produce",
                "emit"
            ],
            "correct_answer": "yield",
            "explanation": "The 'yield' keyword pauses execution and yields an intermediate value to the caller without destroying local stack state.",
            "subtopic": "Generators & Iteration"
        }
    ]
}

def get_questions_for_skill(skill_id: int) -> List[Dict[str, Any]]:
    return SKILL_DIAGNOSTIC_QUESTIONS.get(skill_id, SKILL_DIAGNOSTIC_QUESTIONS[2])

def evaluate_quiz_submission(
    user_id: int,
    skill_id: int,
    answers_submission: List[Dict[str, Any]]
) -> Dict[str, Any]:
    start_time = time.time()
    all_questions = get_questions_for_skill(skill_id)
    q_map = {q["id"]: q for q in all_questions}

    total_questions = len(answers_submission) if answers_submission else len(all_questions)
    correct_count = 0
    question_results = []
    weak_subtopics_set = set()

    for item in answers_submission:
        q_id = item.get("question_id")
        user_ans = item.get("user_answer", "").strip()
        q_data = q_map.get(q_id)
        
        if q_data:
            is_correct = (user_ans == q_data["correct_answer"].strip())
            if is_correct:
                correct_count += 1
            else:
                weak_subtopics_set.add(q_data["subtopic"])
                
            question_results.append({
                "question_id": q_id,
                "question_text": q_data["question_text"],
                "user_answer": user_ans,
                "correct_answer": q_data["correct_answer"],
                "is_correct": is_correct,
                "explanation": q_data["explanation"],
                "subtopic": q_data["subtopic"]
            })

    score_pct = round((correct_count / total_questions * 100.0), 1) if total_questions > 0 else 0.0
    passed = score_pct >= 70.0
    weak_subtopics = list(weak_subtopics_set)

    feedback = f"Completed diagnostic quiz with {score_pct}% ({correct_count}/{total_questions} correct)."
    if not passed:
        feedback += f" Detected conceptual difficulty in: {', '.join(weak_subtopics) if weak_subtopics else 'Core syntax'}."
    else:
        feedback += " Demonstrated sound comprehension of tested competencies."

    execution_time = (time.time() - start_time) * 1000.0

    agent_event_bus.emit_sync(
        user_id=user_id,
        agent_name="Assessment Agent",
        status="completed",
        task=f"Grade diagnostic assessment for Skill #{skill_id}",
        input_summary=f"Grading {total_questions} answers submitted by learner",
        output_summary=f"Score: {score_pct}%. Result: {'PASSED' if passed else 'FAILED'}. Identified {len(weak_subtopics)} weak subtopics.",
        execution_time_ms=execution_time,
        next_agent="Progress Evaluator Agent",
        metadata={"score": score_pct, "weak_subtopics": weak_subtopics}
    )

    return {
        "score_percentage": score_pct,
        "passed": passed,
        "feedback": feedback,
        "weak_subtopics": weak_subtopics,
        "question_results": question_results,
        "execution_time_ms": execution_time
    }
