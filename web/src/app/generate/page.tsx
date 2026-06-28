'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import ActivityCard from '@/components/ActivityCard';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import StatusModal from '@/components/ui/StatusModal';
import { Activity, saveHistory, toggleFavorite, isFavorite } from '@/database/db';
import { generateActivities, FilterParams } from '@/database/smartEngine';
import {
  Sparkles, Shuffle, SlidersHorizontal, CalendarPlus,
  Heart, Settings2
} from 'lucide-react';

const DURATIONS = ['15 min', '30 min', '1 hr', 'Half Day'];
const BUDGETS: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

export default function GeneratePage() {
  const { theme, organization, categories, preferences, dbReady } = useAppContext();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterParams>({});
  const [results, setResults] = useState<Activity[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [favMap, setFavMap] = useState<Record<number, boolean>>({});

  const [scheduleActivity, setScheduleActivity] = useState<Activity | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

  const [statusVisible, setStatusVisible] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const [showSettings, setShowSettings] = useState(false);
  const [genCount, setGenCount] = useState(preferences.generationCount);

  // Read initial category from URL and auto-generate
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && dbReady) {
      const runAutoGenerate = async () => {
        setLoading(true);
        try {
          const initialFilters = { category: cat };
          setFilters(initialFilters);
          const result = await generateActivities(organization, initialFilters, genCount);
          setResults(result.activities);
          setMessage(result.message);
          setGenerated(true);

          const map: Record<number, boolean> = {};
          for (const a of result.activities) {
            if (a.id) map[a.id] = await isFavorite(a.id);
          }
          setFavMap(map);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      runAutoGenerate();
    }
  }, [searchParams, dbReady, organization, genCount]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateActivities(organization, filters, genCount);
      setResults(result.activities);
      setMessage(result.message);
      setGenerated(true);

      // Check favorites
      const map: Record<number, boolean> = {};
      for (const a of result.activities) {
        if (a.id) map[a.id] = await isFavorite(a.id);
      }
      setFavMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = () => handleGenerate();

  const handleFavToggle = async (activity: Activity) => {
    if (!activity.id) return;
    const result = await toggleFavorite(activity.id);
    setFavMap(prev => ({ ...prev, [activity.id!]: result }));
  };

  const handleScheduleConfirm = async () => {
    if (!scheduleActivity?.id || !scheduleDate) return;
    try {
      await saveHistory(scheduleActivity.id, scheduleDate);
      setStatusType('success');
      setStatusTitle('Scheduled!');
      setStatusMessage(`"${scheduleActivity.name}" scheduled for ${new Date(scheduleDate).toLocaleDateString()}`);
      setStatusVisible(true);
      setScheduleModalVisible(false);
      setScheduleDate('');
    } catch {
      setStatusType('error');
      setStatusTitle('Error');
      setStatusMessage('Failed to schedule.');
      setStatusVisible(true);
    }
  };

  const toggleFilter = (key: keyof FilterParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  };

  return (
    <>
      <Header
        title="Smart Generator"
        subtitle="AI-powered activity recommendations"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>
            <Settings2 size={18} /> Settings
          </button>
        }
      />

      <div className="page-content">
        {/* Filters */}
        <div className="section">
          <h3 style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Category
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${filters.category === cat ? 'selected' : ''}`}
                onClick={() => toggleFilter('category', cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Duration
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
            {DURATIONS.map(d => (
              <button
                key={d}
                className={`filter-chip ${filters.duration === d ? 'selected' : ''}`}
                onClick={() => toggleFilter('duration', d)}
              >
                {d}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Budget
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 24 }}>
            {BUDGETS.map(b => (
              <button
                key={b}
                className={`filter-chip ${filters.budgetLevel === b ? 'selected' : ''}`}
                onClick={() => toggleFilter('budgetLevel', b)}
              >
                {b === 'Low' ? '💰' : b === 'Medium' ? '💎' : '🏆'} {b}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerate}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? (
                <><span className="btn-spinner" /> Generating...</>
              ) : (
                <><Sparkles size={20} /> Generate Now</>
              )}
            </button>
            {generated && (
              <button className="btn btn-outline btn-lg" onClick={handleShuffle} disabled={loading}>
                <Shuffle size={20} /> Shuffle
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {generated && (
          <div className="section" style={{ animation: 'slideUp 0.4s ease' }}>
            {message && (
              <div style={{
                padding: '14px 20px',
                borderRadius: 'var(--radius-md)',
                background: theme.colors.primaryLight,
                border: `1px solid ${theme.colors.primary}30`,
                marginBottom: 20,
                fontSize: 14,
                color: theme.colors.primary,
                fontWeight: 500,
              }}>
                💡 {message}
              </div>
            )}

            {results.length > 0 ? (
              <div className="card-grid">
                {results.map((activity, i) => (
                  <div key={activity.id || i} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: -8,
                      left: -8,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: theme.colors.primary,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      zIndex: 2,
                    }}>
                      {i + 1}
                    </div>
                    <ActivityCard
                      activity={activity}
                      isFav={favMap[activity.id!]}
                      onPress={() => { setSelectedActivity(activity); setDetailVisible(true); }}
                      onFavToggle={() => handleFavToggle(activity)}
                      actions={
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setScheduleActivity(activity); setScheduleModalVisible(true); }}
                        >
                          <CalendarPlus size={14} /> Schedule
                        </button>
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <SlidersHorizontal size={48} className="empty-state-icon" />
                <p className="empty-state-title">No matches found</p>
                <p className="empty-state-text">Try adjusting your filters to discover more activities.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModalVisible && (
        <div className="modal-overlay" onClick={() => setScheduleModalVisible(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Schedule Activity</h3>
              <button className="modal-close" onClick={() => setScheduleModalVisible(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 }}>
                Schedule &quot;{scheduleActivity?.name}&quot; to your calendar.
              </p>
              <input
                type="date"
                className="input"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setScheduleModalVisible(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleScheduleConfirm} disabled={!scheduleDate}>
                <CalendarPlus size={16} /> Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Generation Settings</h3>
              <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="input-label" style={{ marginTop: 0 }}>Ideas per generation</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    className={`filter-chip ${genCount === n ? 'selected' : ''}`}
                    onClick={() => setGenCount(n)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowSettings(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <ActivityDetailModal
        activity={selectedActivity}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />

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
