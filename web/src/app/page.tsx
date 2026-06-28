'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import ActivityCard from '@/components/ActivityCard';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import {
  Activity, getActivityStats, getUpcomingActivity,
  getPendingTasks, PersonalTask, ActivityHistory, getUniqueCategories,
  toggleFavorite, isFavorite
} from '@/database/db';
import {
  TrendingUp, CalendarDays, Target, Sparkles, ArrowRight,
  CheckCircle, Clock
} from 'lucide-react';

export default function DashboardPage() {
  const { theme, organization, preferences, dbReady, pendingTasksCount } = useAppContext();
  const [stats, setStats] = useState({ completedThisMonth: 0 });
  const [upcoming, setUpcoming] = useState<(ActivityHistory & Activity) | null>(null);
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    if (!dbReady) return;
    loadData();
  }, [dbReady]);

  const loadData = async () => {
    const [statsData, upcomingData, tasksData, cats] = await Promise.all([
      getActivityStats(),
      getUpcomingActivity(),
      getPendingTasks(3),
      getUniqueCategories(),
    ]);
    setStats(statsData);
    setUpcoming(upcomingData);
    setTasks(tasksData);
    setCategories(cats);
  };

  const engagementPercent = preferences.monthlyTarget > 0
    ? Math.min(Math.round((stats.completedThisMonth / preferences.monthlyTarget) * 100), 100)
    : 0;

  return (
    <>
      <Header title="Activity Mind" subtitle={`Welcome back${organization?.companyName ? `, ${organization.companyName}` : ''}`} />

      <div className="page-content">
        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}dd)`, color: 'white' }}>
            <TrendingUp size={24} />
            <div className="stat-card-value">{stats.completedThisMonth}</div>
            <div className="stat-card-title">Completed This Month</div>
          </div>
          <div className="stat-card" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondary}dd)`, color: 'white' }}>
            <Target size={24} />
            <div className="stat-card-value">{engagementPercent}%</div>
            <div className="stat-card-title">Monthly Goal ({stats.completedThisMonth}/{preferences.monthlyTarget})</div>
          </div>
          <div className="stat-card" style={{ background: `linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.success}dd)`, color: 'white' }}>
            <CalendarDays size={24} />
            <div className="stat-card-value">{pendingTasksCount}</div>
            <div className="stat-card-title">Pending Tasks</div>
          </div>
        </div>

        {/* Upcoming Activity */}
        {upcoming && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">📅 Upcoming Activity</h2>
              <Link href="/calendar" className="section-action">View Calendar →</Link>
            </div>
            <div style={{
              padding: 20,
              borderRadius: 'var(--radius-lg)',
              background: theme.colors.primaryLight,
              border: `1px solid ${theme.colors.primary}30`,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                background: theme.colors.primary,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{new Date(upcoming.scheduled_date).getDate()}</span>
                <span style={{ fontSize: 10, fontWeight: 500 }}>{new Date(upcoming.scheduled_date).toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.text }}>{upcoming.name}</h3>
                <p style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                  {upcoming.category} · {upcoming.duration}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Tasks */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">✅ My Tasks</h2>
            <Link href="/tasks" className="section-action">View All →</Link>
          </div>
          {tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => (
                <Link href="/tasks" key={task.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${task.priority === 'High' ? theme.colors.error : task.priority === 'Medium' ? theme.colors.warning : theme.colors.success}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {task.status === 'completed' && <CheckCircle size={14} color={theme.colors.success} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.colors.text }}>
                      {task.title}
                    </span>
                    {task.description && (
                      <span style={{ display: 'block', fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                        {task.description}
                      </span>
                    )}
                    {task.notes && (
                      <span style={{ display: 'block', fontSize: 12, color: theme.colors.textSecondary, fontStyle: 'italic', marginTop: 2 }}>
                        📝 {task.notes}
                      </span>
                    )}
                  </div>
                  {task.reminder_time && (
                    <span style={{ fontSize: 11, color: theme.colors.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(task.reminder_time).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: theme.colors.textSecondary, padding: 20, textAlign: 'center' }}>
              No pending tasks. You&apos;re all caught up! 🎉
            </p>
          )}
        </div>

        {/* Quick Explore */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">🚀 Quick Explore</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.slice(0, 8).map(cat => (
              <Link
                href={`/generate?category=${encodeURIComponent(cat)}`}
                key={cat}
                className="filter-chip"
                style={{ textDecoration: 'none' }}
              >
                <Sparkles size={14} />
                {cat}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </>
  );
}
