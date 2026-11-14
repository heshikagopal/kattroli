import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assessmentsApi } from '../api';
import { QuestionDisplay, QuizResult } from '../types';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  XCircle
} from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const { refreshUser, setActiveTab, showNotification } = useAuth();
  const [skillId, setSkillId] = useState(2); // JavaScript by default
  const [questions, setQuestions] = useState<QuestionDisplay[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async (id: number) => {
    try {
      setLoading(true);
      setResult(null);
      setAnswers({});
      const qs = await assessmentsApi.getQuestions(id);
      setQuestions(qs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(skillId);
  }, [skillId]);

  const handleSelectOption = (qId: number, opt: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  // 1-Click pre-fill scenario answers that yield 40% (2 correct, 3 wrong on async/closures)
  const handlePreFillScenarioAnswers = () => {
    setAnswers({
      201: "A, B, C, D", // Incorrect (Async event loop)
      202: "By copying the outer variables into global window memory", // Incorrect (Closures)
      203: "Wrapping the await expression inside a try...catch block", // Correct
      204: "It prevents accidental global variable creation and eliminates silent errors", // Correct
      205: "'==' is faster than '==='" // Incorrect (Type coercion)
    });
    showNotification('info', 'Loaded demonstration answers (designed to test 40% low-score adaptive trigger)');
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      showNotification('warning', 'Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, ans]) => ({
        question_id: Number(qId),
        user_answer: ans
      }));

      const res = await assessmentsApi.submitQuiz(skillId, payloadAnswers);
      setResult(res);
      await refreshUser();

      if (res.passed) {
        showNotification('success', `Assessment completed: passed with ${res.score_percentage}%!`);
      } else if (res.adaptation_triggered) {
        showNotification('warning', `Roadmap adapted to v${res.roadmap_version}! Review the added remedial modules.`);
      }
    } catch (e: any) {
      showNotification('error', `Assessment submission failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
              Diagnostic Assessment
            </span>
          </div>
          <h1 className="text-xl font-semibold text-[#17202A] mt-2">
            Skill Diagnostic Assessment
          </h1>
          <p className="text-xs text-[#5B6573] mt-1 leading-relaxed">
            Verify comprehension of key technical concepts. Scoring below 60% automatically adapts your learning roadmap.
          </p>
        </div>

        {/* Skill Selector Tabs */}
        <div className="flex items-center space-x-1 bg-[#EEF1F5] p-1 rounded-[6px] text-xs shrink-0">
          <button
            onClick={() => setSkillId(2)}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition ${
              skillId === 2
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            JavaScript
          </button>
          <button
            onClick={() => setSkillId(1)}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition ${
              skillId === 1
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            Python
          </button>
        </div>
      </div>

      {/* Pre-fill Demo Shortcut */}
      {!result && (
        <div className="flex items-center justify-between p-3.5 rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB] text-xs">
          <div className="flex items-center space-x-2 text-[#92400E]">
            <Sparkles className="w-4 h-4 text-[#B45309]" />
            <span>Demonstration: Pre-fill answers with 40% score (2/5) to trigger Roadmap v2 adaptation</span>
          </div>
          <button
            onClick={handlePreFillScenarioAnswers}
            className="px-3 py-1 rounded-[4px] bg-white border border-[#FDE68A] text-[#B45309] font-medium hover:bg-[#FEF3C7] transition shrink-0"
          >
            Pre-fill 40% Demo
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center space-x-3 text-[#5B6573]">
            <div className="w-5 h-5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Generating diagnostic assessment questions...</span>
          </div>
        </div>
      ) : result ? (
        /* Results View */
        <div className="space-y-6 animate-in fade-in">
          {/* Result Banner */}
          <div
            className={`p-6 rounded-[10px] border shadow-sm ${
              result.passed
                ? 'bg-white border-[#CCFBF1]'
                : 'bg-white border-[#FDE68A]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${
                    result.passed
                      ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]'
                      : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                  }`}
                >
                  {result.passed ? 'Assessment Passed' : 'Adaptive Remediation Triggered'}
                </span>
                <h2 className="text-2xl font-semibold text-[#17202A] mt-2 tabular-nums">
                  Score: {result.score_percentage}%
                </h2>
                <p className="text-xs text-[#5B6573] mt-1 max-w-2xl leading-relaxed">
                  {result.feedback}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-[#5B6573] font-medium block">Proficiency update</span>
                <span className="text-base font-mono font-semibold text-[#17202A]">
                  {result.old_proficiency} → {result.new_proficiency} / 5.0
                </span>
                <p className="text-[11px] text-[#5B6573] mt-0.5">Weighted calibration</p>
              </div>
            </div>

            {/* If Adaptive Replanning was Triggered */}
            {result.adaptation_triggered && (
              <div className="mt-5 p-4 rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB]">
                <div className="flex items-center space-x-2 text-[#92400E] text-xs font-semibold uppercase tracking-wider mb-1">
                  <AlertCircle className="w-4 h-4 text-[#B45309]" />
                  <span>Roadmap updated to Version {result.roadmap_version}</span>
                </div>
                <p className="text-xs text-[#92400E] leading-relaxed">
                  {result.adaptation_reason}
                </p>
                <div className="mt-3 flex items-center space-x-3">
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className="px-4 py-2 rounded-[6px] bg-[#B45309] hover:bg-[#92400E] text-white font-medium text-xs transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <span>View adapted roadmap v{result.roadmap_version}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('agents')}
                    className="px-4 py-2 rounded-[6px] bg-white hover:bg-[#F6F7F9] text-[#17202A] border border-[#DDE1E7] font-medium text-xs transition"
                  >
                    Inspect agent logs
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Weak Subtopics Breakdown */}
          {result.weak_subtopics.length > 0 && (
            <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B45309] mb-2 flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Identified conceptual gaps</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.weak_subtopics.map((sub, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-[4px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Question Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#17202A]">Detailed Question Review</h3>
            {result.question_results.map((q, idx) => (
              <div
                key={q.question_id}
                className="p-5 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#5B6573]">
                    Question {idx + 1} • {q.subtopic}
                  </span>
                  {q.is_correct ? (
                    <span className="flex items-center space-x-1 text-xs font-medium text-[#0F766E]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs font-medium text-[#B91C1C]">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-[#17202A] mb-3 leading-relaxed">
                  {q.question_text}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2.5 rounded-[6px] bg-[#F6F7F9] border border-[#DDE1E7]">
                    <span className="text-[10px] text-[#5B6573] uppercase font-semibold block">Your answer:</span>
                    <span className={q.is_correct ? 'text-[#0F766E] font-medium' : 'text-[#B91C1C] font-medium'}>
                      {q.user_answer}
                    </span>
                  </div>
                  {!q.is_correct && (
                    <div className="p-2.5 rounded-[6px] bg-[#F6F7F9] border border-[#DDE1E7]">
                      <span className="text-[10px] text-[#5B6573] uppercase font-semibold block">Correct answer:</span>
                      <span className="text-[#0F766E] font-medium">{q.correct_answer}</span>
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <p className="text-xs text-[#5B6573] bg-[#F6F7F9] p-3 rounded-[6px] border border-[#DDE1E7] leading-relaxed">
                    <strong className="text-[#17202A]">Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => fetchQuestions(skillId)}
              className="px-4 py-2 rounded-[6px] border border-[#DDE1E7] bg-white hover:bg-[#F6F7F9] text-[#17202A] text-xs font-medium transition flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake quiz</span>
            </button>
          </div>
        </div>
      ) : (
        /* Questions Taking View */
        <div className="space-y-5">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-5 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#0F766E]">
                  Question {idx + 1} of {questions.length}
                </span>
                <span className="text-[11px] text-[#5B6573]">
                  {q.subtopic} • Level {q.difficulty_level}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-[#17202A] mb-3 leading-snug">
                {q.question_text}
              </h3>

              {/* Code Snippet */}
              {q.code_snippet && (
                <div className="mb-4 rounded-[6px] border border-[#DDE1E7] bg-[#F6F7F9] p-3 font-mono text-xs text-[#17202A] overflow-x-auto">
                  <pre>{q.code_snippet}</pre>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`p-3 rounded-[6px] border cursor-pointer text-xs font-medium transition ${
                        isSelected
                          ? 'border-[#0F766E] bg-[#F0FDFA] text-[#17202A] ring-1 ring-[#0F766E]'
                          : 'border-[#DDE1E7] bg-white text-[#17202A] hover:border-[#0F766E]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#0F766E] bg-[#0F766E]' : 'border-[#DDE1E7]'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Evaluating responses...' : 'Submit answers'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
