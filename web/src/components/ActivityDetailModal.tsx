'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Activity, saveHistory, toggleFavorite, isFavorite, updateActivity } from '@/database/db';
import StatusModal from '@/components/ui/StatusModal';
import {
  X, Clock, DollarSign, Users, MapPin, Wifi,
  BarChart3, Heart, CalendarPlus, ChevronRight, RefreshCw
} from 'lucide-react';

interface ActivityDetailModalProps {
  activity: Activity | null;
  visible: boolean;
  onClose: () => void;
  hideSave?: boolean;
  hideSchedule?: boolean;
  onSaved?: () => void;
}

export default function ActivityDetailModal({
  activity, visible, onClose, hideSave, hideSchedule, onSaved
}: ActivityDetailModalProps) {
  const { theme } = useAppContext();
  const [isFav, setIsFav] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [recurringPattern, setRecurringPattern] = useState<string | null>(null);

  const checkFavAndRecurring = useCallback(async () => {
    if (activity && activity.id) {
      const fav = await isFavorite(activity.id);
      setIsFav(fav);
      setRecurringPattern(activity.recurring_pattern || null);
    }
  }, [activity]);

  useEffect(() => {
    if (visible && activity) {
      checkFavAndRecurring();
    }
  }, [activity, visible, checkFavAndRecurring]);

  if (!visible || !activity) return null;

  const handleToggleFav = async () => {
    if (!activity.id) return;
    const result = await toggleFavorite(activity.id);
    setIsFav(result);
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !activity.id) return;
    try {
      await saveHistory(activity.id, scheduleDate);
      setStatusType('success');
      setStatusTitle('Scheduled!');
      setStatusMessage(`"${activity.name}" has been scheduled for ${new Date(scheduleDate).toLocaleDateString()}`);
      setStatusVisible(true);
      setShowDatePicker(false);
      setScheduleDate('');
      onSaved?.();
    } catch {
      setStatusType('error');
      setStatusTitle('Error');
      setStatusMessage('Failed to schedule activity.');
      setStatusVisible(true);
    }
  };

  const handleSetRecurring = async (day: number | null) => {
    if (!activity || !activity.id) return;
    const pattern = day !== null ? `weekly-${day}` : null;
    setRecurringPattern(pattern);
    await updateActivity(activity.id, { recurring_pattern: pattern });
    onSaved?.();
  };

  let steps: string[] = [];
  let materials: string[] = [];
  try { steps = JSON.parse(activity.steps); } catch { steps = []; }
  try { materials = JSON.parse(activity.materials); } catch { materials = []; }

  const metaItems = [
    { icon: <Clock size={16} />, label: 'Duration', value: activity.duration },
    { icon: <DollarSign size={16} />, label: 'Budget', value: activity.estimated_cost },
    { icon: <Users size={16} />, label: 'Team Size', value: `${activity.min_employees}-${activity.max_employees}` },
    { icon: <MapPin size={16} />, label: 'Location', value: activity.indoor_outdoor },
    { icon: <BarChart3 size={16} />, label: 'Difficulty', value: activity.difficulty },
    { icon: <Clock size={16} />, label: 'Prep Time', value: activity.prep_time },
  ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: 640 }}
        >
          <div className="modal-header">
            <h2>{activity.name}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Category & Remote badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className="activity-card-badge" style={{ background: theme.colors.primaryLight, color: theme.colors.primary }}>
                {activity.category}
              </span>
              {activity.remote_compatible === 1 && (
                <span className="activity-card-badge" style={{ background: theme.colors.success + '15', color: theme.colors.success }}>
                  <Wifi size={12} /> Remote Compatible
                </span>
              )}
            </div>

            {/* Description */}
            <p style={{ fontSize: 15, lineHeight: 1.7, color: theme.colors.text, marginBottom: 24 }}>
              {activity.description}
            </p>

            {/* Meta grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}>
              {metaItems.map((item, i) => (
                <div key={i} style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: theme.colors.textSecondary }}>
                    {item.icon}
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.text }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Steps */}
            {steps.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Steps
                </h4>
                {steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: theme.colors.primary,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 14, color: theme.colors.text, lineHeight: 1.6, paddingTop: 2 }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Materials */}
            {materials.length > 0 && materials[0] !== 'None' && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Materials Needed
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {materials.map((mat, i) => (
                    <span key={i} style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      background: theme.colors.secondaryLight,
                      color: theme.colors.secondary,
                      fontSize: 13,
                      fontWeight: 500,
                    }}>
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring Ritual */}
            <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${theme.colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <RefreshCw size={18} color={theme.colors.primary} />
                <h4 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.text }}>Recurring Ritual</h4>
              </div>
              <p style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12 }}>
                Make this a weekly event to automatically populate monthly calendars.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleSetRecurring(null)}
                  className={`filter-chip ${recurringPattern === null ? 'selected' : ''}`}
                  style={{ margin: 0 }}
                >
                  None
                </button>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                  const isSelected = recurringPattern === `weekly-${idx}`;
                  return (
                    <button
                      key={day}
                      onClick={() => handleSetRecurring(idx)}
                      className={`filter-chip ${isSelected ? 'selected' : ''}`}
                      style={{ margin: 0, minWidth: 36, justifyContent: 'center' }}
                    >
                      {day.charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date picker for scheduling */}
            {showDatePicker && (
              <div style={{
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                marginBottom: 16,
              }}>
                <label className="input-label" style={{ marginTop: 0 }}>Select date to schedule</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="date"
                    className="input"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <button className="btn btn-primary" onClick={handleSchedule} disabled={!scheduleDate}>
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-footer">
            {!hideSave && (
              <button
                className={`btn ${isFav ? 'btn-outline' : 'btn-ghost'}`}
                onClick={handleToggleFav}
                style={isFav ? { borderColor: theme.colors.error, color: theme.colors.error } : {}}
              >
                <Heart size={16} fill={isFav ? theme.colors.error : 'none'} />
                {isFav ? 'Saved' : 'Save'}
              </button>
            )}
            {!hideSchedule && (
              <button className="btn btn-primary" onClick={() => setShowDatePicker(!showDatePicker)}>
                <CalendarPlus size={16} />
                Schedule
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <StatusModal
        visible={statusVisible}
        type={statusType}
        title={statusTitle}
        message={statusMessage}
        onConfirm={() => setStatusVisible(false)}
        onClose={() => setStatusVisible(false)}
      />
    </>
  );
}
