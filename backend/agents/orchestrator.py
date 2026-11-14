from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END

from backend.agents.state import SkillPilotState
from backend.agents.profiler import run_profiler_agent
from backend.agents.skill_analyst import run_skill_analyst_agent
from backend.agents.career_matcher import run_career_matcher_agent
from backend.agents.path_planner import run_path_planner_agent
from backend.agents.resource_curator import run_resource_curator_agent
from backend.agents.mentor import run_mentor_agent

def create_full_onboarding_graph():
    """
    Constructs the end-to-end multi-agent LangGraph workflow.
    6 sequential agent nodes: Profiler -> Skill Analyst -> Career Matcher -> Path Planner -> Resource Curator -> Mentor
    """
    workflow = StateGraph(SkillPilotState)

    # Add Nodes
    workflow.add_node("profiler", run_profiler_agent)
    workflow.add_node("skill_analyst", run_skill_analyst_agent)
    workflow.add_node("career_matcher", run_career_matcher_agent)
    workflow.add_node("path_planner", run_path_planner_agent)
    workflow.add_node("resource_curator", run_resource_curator_agent)
    workflow.add_node("mentor", run_mentor_agent)

    # Set Entry Point and Linear Edges
    workflow.set_entry_point("profiler")
    workflow.add_edge("profiler", "skill_analyst")
    workflow.add_edge("skill_analyst", "career_matcher")
    workflow.add_edge("career_matcher", "path_planner")
    workflow.add_edge("path_planner", "resource_curator")
    workflow.add_edge("resource_curator", "mentor")
    workflow.add_edge("mentor", END)

    return workflow.compile()

def create_adaptive_replanning_graph():
    """
    Sub-workflow for dynamic roadmap adaptation:
    Path Planner -> Resource Curator -> Mentor
    """
    workflow = StateGraph(SkillPilotState)

    workflow.add_node("path_planner", run_path_planner_agent)
    workflow.add_node("resource_curator", run_resource_curator_agent)
    workflow.add_node("mentor", run_mentor_agent)

    workflow.set_entry_point("path_planner")
    workflow.add_edge("path_planner", "resource_curator")
    workflow.add_edge("resource_curator", "mentor")
    workflow.add_edge("mentor", END)

    return workflow.compile()

# Precompiled graph instances
onboarding_agent_graph = create_full_onboarding_graph()
adaptive_replanning_graph = create_adaptive_replanning_graph()

def execute_onboarding_pipeline(initial_state: SkillPilotState) -> SkillPilotState:
    """Executes the full 6-agent LangGraph pipeline."""
    return onboarding_agent_graph.invoke(initial_state)

def execute_adaptive_pipeline(initial_state: SkillPilotState) -> SkillPilotState:
    """Executes the adaptive replanning LangGraph pipeline."""
    return adaptive_replanning_graph.invoke(initial_state)
