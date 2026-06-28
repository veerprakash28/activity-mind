'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import ActivityCard from '@/components/ActivityCard';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import StatusModal from '@/components/ui/StatusModal';
import { 
  Activity, addCustomActivity, getChatHistory, saveChatMessage, 
  clearChatHistory, saveHistory 
} from '@/database/db';
import { processAIChat, AIChatResponse } from '@/database/smartEngine';
import { Bot, Send, Sparkles, Trash2, Cpu, CalendarDays } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  activities?: Activity[];
  timestamp: Date;
  engine?: 'gemini' | 'heuristic';
}

export default function BrainstormPage() {
  const { theme, organization, dbReady } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('AI is thinking...');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Status and Modals
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [clearChatVisible, setClearChatVisible] = useState(false);

  // Direct Scheduling
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [schedulingActivity, setSchedulingActivity] = useState<Activity | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isGeminiActive, setIsGeminiActive] = useState(false);

  useEffect(() => {
    // Check if the Gemini API Key is configured in environment variables
    setIsGeminiActive(!!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  }, []);

  const loadHistory = useCallback(async () => {
    const history = await getChatHistory();
    if (history.length > 0) {
      setMessages(history.map(m => ({
        id: m.id!.toString(),
        text: m.text,
        sender: m.sender,
        activities: m.activities ? JSON.parse(m.activities) : undefined,
        timestamp: new Date(m.timestamp),
        engine: (m.engine as any) || undefined
      })));
    } else {
      setMessages([{
        id: '1',
        text: `Hi! I'm your AI Brainstorm partner. ${new Date().getHours() < 12 ? 'Good morning!' : new Date().getHours() < 18 ? 'Good afternoon!' : 'Good evening!'} Ready to architect some custom activities for ${organization?.companyName || 'your team'}?`,
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  }, [organization]);

  useEffect(() => {
    if (dbReady) {
      loadHistory();
    }
  }, [dbReady, loadHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    await saveChatMessage(userMsg.text, userMsg.sender);
    
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    const thoughts = [
      "Analyzing team profile...",
      `Scanning ${organization?.industry || 'industry'} patterns...`,
      "Drafting custom variants...",
      "Finalizing architect drafts..."
    ];

    for (let i = 0; i < thoughts.length; i++) {
      setTypingMessage(thoughts[i]);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    }

    try {
      const response: AIChatResponse = await processAIChat(
        currentInput,
        messages.map(m => ({ role: m.sender, content: m.text })),
        organization as any
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        activities: response.suggestedActivities,
        timestamp: new Date(),
        engine: response.engine
      };

      setMessages(prev => [...prev, aiMsg]);
      await saveChatMessage(aiMsg.text, aiMsg.sender, aiMsg.activities, aiMsg.engine);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const saveToBank = async (activity: Activity) => {
    try {
      await addCustomActivity({
        name: activity.name,
        description: activity.description,
        category: activity.category,
        steps: JSON.stringify(activity.steps ? (typeof activity.steps === 'string' ? JSON.parse(activity.steps) : activity.steps) : ["Collaborate with your team"]),
        materials: JSON.stringify(activity.materials ? (typeof activity.materials === 'string' ? JSON.parse(activity.materials) : activity.materials) : ["None"]),
        estimated_cost: activity.estimated_cost,
        duration: activity.duration,
        difficulty: activity.difficulty || 'Medium',
        prep_time: activity.prep_time || '10 min',
        min_employees: activity.min_employees,
        max_employees: activity.max_employees,
        indoor_outdoor: activity.indoor_outdoor,
        remote_compatible: activity.remote_compatible
      });
      setStatusTitle('Brainstorm Saved!');
      setStatusMessage(`"${activity.name}" variant has been added to your bank.`);
      setStatusVisible(true);
    } catch {
      setStatusTitle('Oops!');
      setStatusMessage('Failed to save activity. Please try again.');
      setStatusVisible(true);
    }
  };

  const handleScheduleClick = (activity: Activity) => {
    setSchedulingActivity(activity);
    setScheduleDate(new Date().toISOString().split('T')[0]);
    setScheduleModalVisible(true);
  };

  const handleConfirmSchedule = async () => {
    if (!schedulingActivity || !scheduleDate) return;
    try {
      // 1. Save activity to the bank first
      const activityId = await addCustomActivity({
        name: schedulingActivity.name,
        description: schedulingActivity.description,
        category: schedulingActivity.category,
        steps: JSON.stringify(schedulingActivity.steps ? (typeof schedulingActivity.steps === 'string' ? JSON.parse(schedulingActivity.steps) : schedulingActivity.steps) : ["Collaborate with your team"]),
        materials: JSON.stringify(schedulingActivity.materials ? (typeof schedulingActivity.materials === 'string' ? JSON.parse(schedulingActivity.materials) : schedulingActivity.materials) : ["None"]),
        estimated_cost: schedulingActivity.estimated_cost,
        duration: schedulingActivity.duration,
        difficulty: schedulingActivity.difficulty || 'Medium',
        prep_time: schedulingActivity.prep_time || '10 min',
        min_employees: schedulingActivity.min_employees,
        max_employees: schedulingActivity.max_employees,
        indoor_outdoor: schedulingActivity.indoor_outdoor,
        remote_compatible: schedulingActivity.remote_compatible
      });

      // 2. Schedule it in history
      await saveHistory(activityId, scheduleDate);

      setScheduleModalVisible(false);
      setStatusTitle('Activity Scheduled!');
      setStatusMessage(`"${schedulingActivity.name}" has been saved to your bank and scheduled for ${new Date(scheduleDate).toLocaleDateString()}.`);
      setStatusVisible(true);
    } catch (err) {
      console.error(err);
      setStatusTitle('Oops!');
      setStatusMessage('Failed to schedule activity. Please try again.');
      setStatusVisible(true);
    }
  };

  const confirmClearChat = async () => {
    await clearChatHistory();
    setMessages([{
      id: Date.now().toString(),
      text: `Chat cleared. Ready for a fresh brainstorm!`,
      sender: 'ai',
      timestamp: new Date()
    }]);
  };

  return (
    <>
      <Header
        title="AI Brainstorm"
        subtitle="Collaborate with AI to draft custom variants"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: isGeminiActive ? 'var(--color-success)' : '#D97706',
              background: isGeminiActive ? 'color-mix(in srgb, var(--color-success) 10%, transparent)' : 'color-mix(in srgb, #D97706 10%, transparent)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isGeminiActive ? 'var(--color-success)' : '#D97706' }} />
              {isGeminiActive ? 'Gemini: Active' : 'Heuristic Fallback'}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setClearChatVisible(true)}>
              <Trash2 size={16} /> Clear Chat
            </button>
          </div>
        }
      />

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height) - 40px)', paddingBottom: 0 }}>
        {/* Chat Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isAI ? 'flex-start' : 'flex-end',
                  gap: 12,
                  maxWidth: '80%',
                  alignSelf: isAI ? 'flex-start' : 'flex-end',
                }}
              >
                {isAI && (
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={18} />
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: isAI ? 'flex-start' : 'flex-end' }}>
                  {/* Bubble */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    background: isAI ? 'var(--color-surface)' : 'var(--color-primary)',
                    color: isAI ? 'var(--color-text)' : 'white',
                    border: isAI ? '1px solid var(--color-border)' : 'none',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    borderBottomLeftRadius: isAI ? 4 : undefined,
                    borderBottomRightRadius: !isAI ? 4 : undefined
                  }}>
                    {msg.text}

                    {isAI && msg.engine && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: '1px solid var(--color-border)',
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        <Cpu size={10} />
                        {msg.engine === 'gemini' ? "Powered by Gemini" : "Heuristic Fallback"}
                      </div>
                    )}
                  </div>

                  {/* Generated drafts */}
                  {msg.activities && msg.activities.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4, width: '100%', minWidth: 320 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: 4 }}>
                        Brainstorm Drafts (Tap to view details)
                      </span>
                      {msg.activities.map((act, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <ActivityCard
                            activity={act}
                            showActions={false}
                            onPress={() => { setSelectedActivity(act); setDetailVisible(true); }}
                          />
                          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveToBank(act)}
                            >
                              <Sparkles size={14} /> Save this Variant
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleScheduleClick(act)}
                              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'var(--color-surface)' }}
                            >
                              <CalendarDays size={14} /> Schedule Directly
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} />
              </div>
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                borderBottomLeftRadius: 4,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span className="btn-spinner" style={{ width: 14, height: 14 }} />
                {typingMessage}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '16px 0 24px',
          background: 'var(--color-background)',
          display: 'flex',
          gap: 12,
          borderTop: '1px solid var(--color-border)'
        }}>
          <input
            className="input"
            placeholder="Refine this idea with the AI..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={!inputText.trim() || isTyping}>
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Scheduling Modal */}
      {scheduleModalVisible && (
        <div className="modal-overlay" onClick={() => setScheduleModalVisible(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Schedule Activity</h3>
              <button className="modal-close" onClick={() => setScheduleModalVisible(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Choose a date to schedule &quot;{schedulingActivity?.name}&quot;:
              </p>
              <input
                type="date"
                className="input"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setScheduleModalVisible(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmSchedule}>
                Schedule Now
              </button>
            </div>
          </div>
        </div>
      )}

      <ActivityDetailModal
        activity={selectedActivity}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        hideSave
        hideSchedule
      />

      <StatusModal
        visible={statusVisible}
        type="success"
        title={statusTitle}
        message={statusMessage}
        onConfirm={() => setStatusVisible(false)}
        onClose={() => setStatusVisible(false)}
      />

      <StatusModal
        visible={clearChatVisible}
        type="confirm"
        title="Clear Chat History"
        message="Are you sure you want to delete all messages? This cannot be undone."
        confirmLabel="Clear All"
        onConfirm={confirmClearChat}
        onClose={() => setClearChatVisible(false)}
      />
    </>
  );
}
