'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import ActivityCard from '@/components/ActivityCard';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import StatusModal from '@/components/ui/StatusModal';
import {
  Activity, ActivityHistory, getMonthlyScheduledActivities,
  removeScheduledActivity, markCompleted, unmarkCompleted,
  toggleFavorite, isFavorite, normalizeDate
} from '@/database/db';
import {
  CalendarDays, Calendar as CalendarIcon, CheckCircle2,
  Undo2, Trash2, CalendarPlus, ChevronLeft, ChevronRight,
  Share2
} from 'lucide-react';
import Link from 'next/link';

export default function CalendarPage() {
  const { theme, dbReady } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledActivities, setScheduledActivities] = useState<(ActivityHistory & Activity)[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [favMap, setFavMap] = useState<Record<number, boolean>>({});

  // Completion modal state
  const [completionVisible, setCompletionVisible] = useState(false);
  const [completionActivity, setCompletionActivity] = useState<(ActivityHistory & Activity) | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // Remove confirm state
  const [removeConfirmVisible, setRemoveConfirmVisible] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<(ActivityHistory & Activity) | null>(null);

  const loadMonthlyData = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const items = await getMonthlyScheduledActivities(year, month);
    setScheduledActivities(items);

    // Load favorites map
    const map: Record<number, boolean> = {};
    for (const item of items) {
      if (item.activity_id) {
        map[item.activity_id] = await isFavorite(item.activity_id);
      }
    }
    setFavMap(map);
  }, [currentDate]);

  useEffect(() => {
    if (dbReady) {
      loadMonthlyData();
    }
  }, [dbReady, loadMonthlyData]);

  // Calendar rendering helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Next month padding to make complete weeks
  const totalSlots = 42; // 6 weeks
  const nextMonthPadding = totalSlots - calendarDays.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const getActivitiesForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledActivities.filter(item => item.scheduled_date.split('T')[0] === dateStr);
  };

  const handleMarkCompletedClick = (activity: ActivityHistory & Activity) => {
    setCompletionActivity(activity);
    setRating(5);
    setFeedback('');
    setCompletionVisible(true);
  };

  const handleSaveCompletion = async () => {
    if (!completionActivity?.id) return;
    await markCompleted(completionActivity.id, rating, feedback);
    setCompletionVisible(false);
    loadMonthlyData();
  };

  const handleUndoCompletion = async (activity: ActivityHistory & Activity) => {
    if (!activity.id) return;
    await unmarkCompleted(activity.id);
    loadMonthlyData();
  };

  const handleRemoveClick = (activity: ActivityHistory & Activity) => {
    setRemoveTarget(activity);
    setRemoveConfirmVisible(true);
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget?.id) return;
    await removeScheduledActivity(removeTarget.id);
    setRemoveConfirmVisible(false);
    loadMonthlyData();
  };

  const selectedDayActivities = getActivitiesForDay(selectedDate);

  return (
    <>
      <Header
        title="Calendar"
        subtitle="Manage and track your team activities"
        actions={
          <Link href="/export" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            <Share2 size={16} /> Export Calendar
          </Link>
        }
      />

      <div className="page-content">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 32,
          alignItems: 'start'
        }}>
          {/* Calendar Side */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            boxShadow: 'var(--shadow-md)'
          }}>
            {/* Calendar Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 28
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="header-icon-btn" onClick={handlePrevMonth}>
                  <ChevronLeft size={20} />
                </button>
                <button className="header-icon-btn" onClick={handleNextMonth}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Days of Week Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ padding: '8px 0' }}>{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 12
            }}>
              {calendarDays.map((cell, idx) => {
                const dayActivities = getActivitiesForDay(cell.date);
                const isSelected = isSameDay(cell.date, selectedDate);
                const isToday = isSameDay(cell.date, new Date());

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: isSelected
                        ? 'var(--color-primary)'
                        : isToday
                          ? 'var(--color-primary-light)'
                          : 'transparent',
                      outline: isToday && !isSelected ? '2px dashed var(--color-primary)' : 'none',
                      opacity: cell.isCurrentMonth ? 1 : 0.35,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--color-background)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isToday ? 'var(--color-primary-light)' : 'transparent';
                      }
                    }}
                  >
                    <span style={{
                      fontSize: 15,
                      fontWeight: isSelected || isToday ? 700 : 500,
                      color: isSelected
                        ? '#FFFFFF'
                        : isToday
                          ? 'var(--color-primary)'
                          : 'var(--color-text)',
                    }}>
                      {cell.date.getDate()}
                    </span>

                    {/* Dots for activities */}
                    {dayActivities.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: 4,
                        justifyContent: 'center',
                        position: 'absolute',
                        bottom: 6,
                        left: 0,
                        right: 0
                      }}>
                        {dayActivities.map((act, actIdx) => (
                          <div
                            key={actIdx}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: isSelected
                                ? '#FFFFFF'
                                : act.completed === 1
                                  ? 'var(--color-success)'
                                  : 'var(--color-primary)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-md)',
              minHeight: 400
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 24,
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 16
              }}>
                <CalendarIcon size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                  Agenda for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </h3>
              </div>

              {selectedDayActivities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedDayActivities.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <ActivityCard
                        activity={item}
                        showActions={false}
                        onPress={() => { setSelectedActivity(item); setDetailVisible(true); }}
                        actions={
                          <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
                            {item.completed === 1 ? (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={(e) => { e.stopPropagation(); handleUndoCompletion(item); }}
                                style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'var(--color-surface)', flex: 1 }}
                              >
                                <Undo2 size={14} /> Completed (Undo)
                              </button>
                            ) : (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={(e) => { e.stopPropagation(); handleMarkCompletedClick(item); }}
                                style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', flex: 1 }}
                              >
                                <CheckCircle2 size={14} /> Mark Complete
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-error)' }}
                              onClick={(e) => { e.stopPropagation(); handleRemoveClick(item); }}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)'
                }}>
                  <CalendarPlus size={44} style={{ marginBottom: 16, opacity: 0.4, color: 'var(--color-primary)' }} />
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>No activities scheduled</p>
                  <p style={{ fontSize: 13, marginTop: 6, maxWidth: 280, color: 'var(--color-text-secondary)' }}>
                    Go to the Generator or Bank to schedule activities for this day.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {completionVisible && (
        <div className="modal-overlay" onClick={() => setCompletionVisible(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>Complete Activity</h3>
              <button className="modal-close" onClick={() => setCompletionVisible(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                Rate your experience with &quot;{completionActivity?.name}&quot;
              </p>

              {/* Star Rating */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      fontSize: 32,
                      color: star <= rating ? 'var(--color-warning)' : 'var(--color-border)',
                      transition: 'transform 0.1s ease'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label className="input-label">Share some feedback (optional)</label>
              <textarea
                className="input textarea"
                placeholder="How did the team like it? Any learnings?"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCompletionVisible(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCompletion} style={{ background: 'var(--color-success)' }}>
                Save & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      <StatusModal
        visible={removeConfirmVisible}
        type="confirm"
        title="Remove Activity?"
        message={`Are you sure you want to remove "${removeTarget?.name}" from your schedule?`}
        confirmLabel="Remove"
        onConfirm={handleConfirmRemove}
        onClose={() => setRemoveConfirmVisible(false)}
      />

      <ActivityDetailModal
        activity={selectedActivity}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </>
  );
}
