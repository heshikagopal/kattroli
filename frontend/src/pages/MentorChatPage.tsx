import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { mentorApi } from '../api';
import {
  Bot,
  Send,
  User as UserIcon,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'mentor';
  text: string;
  action?: string;
  actions?: string[];
  timestamp: string;
}

export const MentorChatPage: React.FC = () => {
  const { user, setActiveTab } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mentorApi.getBriefing().then(b => {
      setMessages([
        {
          id: 'msg-init',
          sender: 'mentor',
          text: b.guidance || `Hello ${user?.full_name?.split(' ')[0] || 'Alex'}! I am your AI Mentor. How can I assist your learning today?`,
          action: b.suggested_action,
          actions: ['Explain my skill gap', 'Why did my roadmap change?', 'What should I learn next?'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }).catch(() => {});
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await mentorApi.chat(textToSend);
      const mentorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'mentor',
        text: res.response || res.reply,
        action: res.suggested_action,
        actions: res.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, mentorMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'mentor',
        text: "I am accessing your learning telemetry. Let's try again in just a moment!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const groundedQuickActions = [
    { label: 'Explain my skill gap', query: 'Explain my skill gap' },
    { label: 'Why did my roadmap change?', query: 'Why did my roadmap change?' },
    { label: 'What should I learn next?', query: 'What should I learn next?' },
    { label: 'Help me improve my score', query: 'Help me improve my assessment score' },
    { label: 'Compare my career options', query: 'Compare my career options' },
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col pb-4">
      {/* Header */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-4 shadow-sm flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-[6px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#17202A] flex items-center space-x-2">
              <span>Personalized AI Mentor</span>
            </h1>
            <p className="text-xs text-[#5B6573]">
              Context-aware guidance grounded in your roadmap, diagnostic quizzes, and career goals.
            </p>
          </div>
        </div>
      </div>

      {/* Grounded Quick Action Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-2 shrink-0">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573] shrink-0">
          Suggested:
        </span>
        {groundedQuickActions.map((qa, i) => (
          <button
            key={i}
            onClick={() => handleSend(qa.query)}
            disabled={loading}
            className="px-3 py-1 rounded-[6px] bg-white hover:bg-[#F0FDFA] text-[#5B6573] hover:text-[#0F766E] border border-[#DDE1E7] hover:border-[#0F766E] text-xs font-medium whitespace-nowrap transition"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 p-5 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'mentor' && (
              <div className="w-7 h-7 rounded-[6px] bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-[8px] p-4 text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-[#F6F7F9] border border-[#DDE1E7] text-[#17202A]'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">
                {msg.text}
              </div>

              {/* Action Chip Recommendation */}
              {(msg.action || (msg.actions && msg.actions.length > 0)) && (
                <div className="pt-2 border-t border-[#DDE1E7] mt-2 space-y-1.5">
                  <div className="flex items-center space-x-1 text-[10px] font-semibold text-[#0F766E] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>Suggested next actions:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.action && (
                      <button
                        onClick={() => {
                          if (msg.action?.toLowerCase().includes('roadmap')) setActiveTab('roadmap');
                          else if (msg.action?.toLowerCase().includes('quiz')) setActiveTab('assessments');
                          else if (msg.action?.toLowerCase().includes('radar')) setActiveTab('skills');
                          else handleSend(msg.action!);
                        }}
                        className="px-2.5 py-1 rounded-[4px] bg-white hover:bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] text-[11px] font-medium transition flex items-center space-x-1"
                      >
                        <span>{msg.action}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {msg.actions?.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (act.toLowerCase().includes('roadmap')) setActiveTab('roadmap');
                          else if (act.toLowerCase().includes('quiz') || act.toLowerCase().includes('assessment')) setActiveTab('assessments');
                          else if (act.toLowerCase().includes('radar') || act.toLowerCase().includes('skill')) setActiveTab('skills');
                          else if (act.toLowerCase().includes('career')) setActiveTab('careers');
                          else handleSend(act);
                        }}
                        className="px-2.5 py-1 rounded-[4px] bg-white hover:bg-[#F0FDFA] text-[#5B6573] hover:text-[#0F766E] border border-[#DDE1E7] text-[11px] font-medium transition flex items-center space-x-1"
                      >
                        <span>{act}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-[#5B6573] text-right">{msg.timestamp}</div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-[6px] bg-[#EEF1F5] text-[#5B6573] flex items-center justify-center shrink-0 border border-[#DDE1E7]">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-[#5B6573] text-xs py-2">
            <div className="w-3.5 h-3.5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
            <span>AI Mentor analyzing your profile and formulating guidance...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 flex items-center space-x-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your learning roadmap, skill gaps, or career strategy..."
          className="flex-1 rounded-[6px] border border-[#DDE1E7] bg-white px-4 py-2.5 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs shadow-sm disabled:opacity-50 transition flex items-center space-x-1.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
