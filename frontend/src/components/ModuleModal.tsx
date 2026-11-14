import React, { useState } from 'react';
import { RoadmapItem, PracticalEvaluationResponse } from '../types';
import { roadmapsApi } from '../api';
import {
  X, ExternalLink, CheckCircle2, Clock,
  Code, BookOpen, AlertCircle, ShieldCheck, Sparkles, Send, Award, HelpCircle
} from 'lucide-react';

interface ModuleModalProps {
  module: RoadmapItem | null;
  onClose: () => void;
  onToggleComplete: (moduleId: number) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({ module, onClose, onToggleComplete, onRefresh }) => {
  if (!module) return null;

  const [activeSubTab, setActiveSubTab] = useState<'resources' | 'practical' | 'explainability'>('resources');
  const [submissionText, setSubmissionText] = useState(module.practical_submission || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<PracticalEvaluationResponse | null>(null);

  const isCompleted = module.status === 'completed';

  const handleToggle = async () => {
    await onToggleComplete(module.id);
  };

  const handlePracticalSubmit = async () => {
    if (!submissionText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await roadmapsApi.submitPractical(module.id, submissionText);
      setEvalResult(res);
      if (onRefresh) await onRefresh();
    } catch (e: any) {
      alert(`Submission error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadges: Record<string, { label: string; style: string }> = {
    not_started: { label: 'Not started', style: 'bg-[#EEF1F5] text-[#5B6573]' },
    in_progress: { label: 'In progress', style: 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]' },
    submitted_for_evaluation: { label: 'Under evaluation', style: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]' },
    completed: { label: 'Completed', style: 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]' },
    needs_improvement: { label: 'Needs revision', style: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]' },
    pending: { label: 'Planned', style: 'bg-[#EEF1F5] text-[#5B6573]' },
  };

  const currentStatus = statusBadges[module.status] || statusBadges.not_started;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[10px] border border-[#DDE1E7] bg-white shadow-xl text-[#17202A] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#DDE1E7] p-5 shrink-0 bg-white">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-[#5B6573] bg-[#EEF1F5] px-2 py-0.5 rounded-[4px]">
                Week {module.week_number}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] ${currentStatus.style}`}>
                {currentStatus.label}
              </span>
              {module.is_remedial && (
                <span className="text-[11px] font-medium text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-[4px] border border-[#FDE68A]">
                  Adapted module
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-[#17202A] mt-2 leading-snug">
              {module.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-[#5B6573] hover:bg-[#EEF1F5] hover:text-[#17202A] transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#DDE1E7] bg-[#F6F7F9] px-5 pt-1 space-x-4 shrink-0 text-xs">
          <button
            onClick={() => setActiveSubTab('resources')}
            className={`py-2.5 font-medium transition border-b-2 ${
              activeSubTab === 'resources'
                ? 'border-[#0F766E] text-[#17202A] font-semibold'
                : 'border-transparent text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            Curated resources ({module.resources.length})
          </button>
          <button
            onClick={() => setActiveSubTab('practical')}
            className={`py-2.5 font-medium transition border-b-2 flex items-center space-x-1.5 ${
              activeSubTab === 'practical'
                ? 'border-[#0F766E] text-[#17202A] font-semibold'
                : 'border-transparent text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Practical exercise</span>
          </button>
          <button
            onClick={() => setActiveSubTab('explainability')}
            className={`py-2.5 font-medium transition border-b-2 flex items-center space-x-1.5 ${
              activeSubTab === 'explainability'
                ? 'border-[#0F766E] text-[#17202A] font-semibold'
                : 'border-transparent text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Why recommended</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* SubTab 1: Resources & Objectives */}
          {activeSubTab === 'resources' && (
            <>
              {/* Objectives */}
              {module.learning_objectives && module.learning_objectives.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-2 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Learning objectives</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[#17202A]">
                    {module.learning_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-[#0F766E] font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verified Resources */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B6573] flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Verified learning materials ({module.resources.length})</span>
                  </h3>
                  <span className="text-[11px] text-[#0F766E] font-medium bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
                    Verified links
                  </span>
                </div>

                <div className="space-y-2.5">
                  {module.resources.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-[6px] border border-[#DDE1E7] bg-white hover:border-[#0F766E] transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 text-[11px]">
                            <span className="font-semibold text-[#17202A] uppercase">{res.provider}</span>
                            <span className="text-[#5B6573]">•</span>
                            <span className="text-[#5B6573]">{res.resource_type}</span>
                            <span className="text-[#5B6573]">•</span>
                            <span className="text-[#5B6573]">{res.difficulty}</span>
                          </div>
                          <h4 className="text-xs font-semibold text-[#17202A] mt-1">
                            {res.title}
                          </h4>
                          {res.suitability_reason && (
                            <p className="text-[11px] text-[#5B6573] mt-1 leading-relaxed">
                              {res.suitability_reason}
                            </p>
                          )}
                          {res.explanation_learner_match && (
                            <p className="mt-1 text-[11px] text-[#5B6573]">
                              <span className="font-medium text-[#17202A]">Why it matches you:</span> {res.explanation_learner_match}
                            </p>
                          )}
                        </div>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-[6px] border border-[#DDE1E7] hover:border-[#0F766E] hover:bg-[#F0FDFA] text-[#0F766E] text-xs font-medium transition shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SubTab 2: Practical Exercise & Rubric Evaluation */}
          {activeSubTab === 'practical' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-[6px] border border-[#DDE1E7] bg-[#F6F7F9]">
                <div className="flex items-center space-x-2 mb-1.5">
                  <Code className="w-4 h-4 text-[#0F766E]" />
                  <h4 className="text-xs font-semibold text-[#17202A]">Practical assignment prompt</h4>
                </div>
                <p className="text-xs text-[#17202A] leading-relaxed">
                  {module.practical_exercise || 'Implement a code solution applying concepts from this module.'}
                </p>
              </div>

              {/* Rubric Criteria */}
              <div className="p-3.5 rounded-[6px] border border-[#DDE1E7] bg-white text-xs">
                <h4 className="font-semibold text-[#17202A] mb-2 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Evaluation criteria</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-[4px] bg-[#F6F7F9] border border-[#DDE1E7]">
                    <span className="font-semibold text-[#17202A]">1. Correctness (40%)</span>
                    <p className="text-[#5B6573] mt-0.5">Execution logic, syntax fluency, error handling</p>
                  </div>
                  <div className="p-2 rounded-[4px] bg-[#F6F7F9] border border-[#DDE1E7]">
                    <span className="font-semibold text-[#17202A]">2. Completeness (30%)</span>
                    <p className="text-[#5B6573] mt-0.5">Fulfills all prompt requirements and edge cases</p>
                  </div>
                  <div className="p-2 rounded-[4px] bg-[#F6F7F9] border border-[#DDE1E7]">
                    <span className="font-semibold text-[#17202A]">3. Code Quality (30%)</span>
                    <p className="text-[#5B6573] mt-0.5">Structure, comments, modern patterns</p>
                  </div>
                </div>
              </div>

              {/* Submission Textarea */}
              <div>
                <label className="block text-xs font-medium text-[#17202A] mb-1.5">
                  Your implementation (code or solution description):
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste your code implementation or write your solution here..."
                  rows={6}
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white p-3 text-xs font-mono text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[#5B6573]">
                    {submissionText.length} characters • Pass threshold: 60%
                  </span>
                  <button
                    onClick={handlePracticalSubmit}
                    disabled={isSubmitting || !submissionText.trim()}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium disabled:opacity-50 transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Evaluating...' : 'Submit for evaluation'}</span>
                  </button>
                </div>
              </div>

              {/* Live Evaluation Results */}
              {(evalResult || module.practical_score) && (
                <div className="p-4 rounded-[6px] border border-[#CCFBF1] bg-[#F0FDFA] space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                      <span className="text-xs font-semibold text-[#17202A]">Rubric evaluation results</span>
                    </div>
                    <span className="text-xs font-bold text-[#0F766E] bg-white px-2 py-0.5 rounded border border-[#CCFBF1]">
                      Score: {evalResult?.score_percentage || module.practical_score}%
                    </span>
                  </div>
                  <p className="text-xs text-[#17202A] leading-relaxed">
                    {evalResult?.feedback || module.practical_feedback}
                  </p>
                  {evalResult?.rubric_scores && (
                    <div className="flex items-center space-x-4 text-[11px] text-[#5B6573] pt-1.5 border-t border-[#CCFBF1]">
                      <span>Correctness: <strong className="text-[#17202A]">{evalResult.rubric_scores.correctness}</strong>/40</span>
                      <span>Completeness: <strong className="text-[#17202A]">{evalResult.rubric_scores.completeness}</strong>/30</span>
                      <span>Code Quality: <strong className="text-[#17202A]">{evalResult.rubric_scores.code_quality}</strong>/30</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SubTab 3: Explainable Recommendations */}
          {activeSubTab === 'explainability' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[6px] border border-[#DDE1E7] bg-[#F6F7F9]">
                <div className="flex items-center space-x-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#B45309]" />
                  <h4 className="text-xs font-semibold text-[#17202A]">Recommendation rationale</h4>
                </div>
                <p className="text-xs text-[#5B6573]">
                  Every module in your roadmap is grounded in evidence-based skill gap analysis, prerequisite sequences, and industry role benchmarks.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-[6px] border border-[#DDE1E7] bg-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F766E]">
                    1. Skill gap addressed
                  </span>
                  <p className="text-[#17202A] mt-1 leading-relaxed">
                    {module.explanation_gap || `Bridges the identified deficiency in ${module.skill_name || 'core stack'} to meet baseline role proficiency.`}
                  </p>
                </div>

                <div className="p-3 rounded-[6px] border border-[#DDE1E7] bg-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6573]">
                    2. Prerequisite justification
                  </span>
                  <p className="text-[#17202A] mt-1 leading-relaxed">
                    {module.explanation_prereq || `Essential prerequisite required before progressing to advanced architectural integrations.`}
                  </p>
                </div>

                <div className="p-3 rounded-[6px] border border-[#DDE1E7] bg-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F766E]">
                    3. Target outcome
                  </span>
                  <p className="text-[#17202A] mt-1 leading-relaxed">
                    {module.explanation_outcome || `Attain verified practical fluency and score ≥60% on practical exercises.`}
                  </p>
                </div>

                <div className="p-3 rounded-[6px] border border-[#DDE1E7] bg-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B45309]">
                    4. Career benchmark contribution
                  </span>
                  <p className="text-[#17202A] mt-1 leading-relaxed">
                    {module.explanation_career || `Directly satisfies core technical benchmark for your active career target.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#DDE1E7] p-4 shrink-0 bg-[#F6F7F9]">
          <div className="flex items-center space-x-1.5 text-xs text-[#5B6573]">
            <Clock className="w-3.5 h-3.5 text-[#5B6573]" />
            <span>Estimated duration: {module.duration_hours} hours</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggle}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-[6px] text-xs font-medium transition shadow-sm ${
                isCompleted
                  ? 'border border-[#DDE1E7] bg-white hover:bg-[#EEF1F5] text-[#17202A]'
                  : 'bg-[#0F766E] hover:bg-[#115E59] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Mark as in progress' : 'Mark as completed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
