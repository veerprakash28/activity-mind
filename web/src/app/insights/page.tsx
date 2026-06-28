'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import {
  getAllActivities, getRecentHistory, getFavorites, Activity, ActivityHistory
} from '@/database/db';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  TrendingUp, Award, BarChart3, Heart, Bot, Sparkles, AlertCircle, BookOpen
} from 'lucide-react';

export default function InsightsPage() {
  const { theme, dbReady } = useAppContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [history, setHistory] = useState<ActivityHistory[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const loadData = useCallback(async () => {
    const [allActs, allHist, favs] = await Promise.all([
      getAllActivities(),
      getRecentHistory(180), // Last 6 months
      getFavorites()
    ]);
    setActivities(allActs);
    setHistory(allHist);
    setFavoriteCount(favs.length);
  }, []);

  useEffect(() => {
    if (dbReady) {
      loadData();
    }
  }, [dbReady, loadData]);

  // Calculations
  const completedCount = useMemo(() => history.filter(h => h.completed === 1).length, [history]);

  // 1. Chart Data: Monthly completed activities (last 6 months)
  const monthlyChartData = useMemo(() => {
    const data: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      data[monthName] = 0;
    }

    history.forEach(h => {
      if (h.completed === 1) {
        const date = new Date(h.scheduled_date);
        const monthName = date.toLocaleString('default', { month: 'short' });
        if (data[monthName] !== undefined) {
          data[monthName]++;
        }
      }
    });

    return Object.entries(data).map(([name, completed]) => ({ name, completed }));
  }, [history]);

  // 2. Chart Data: Most popular categories
  const categoryChartData = useMemo(() => {
    const data: Record<string, number> = {};
    history.forEach(h => {
      if (h.completed === 1) {
        const act = activities.find(a => a.id === h.activity_id);
        if (act) {
          data[act.category] = (data[act.category] || 0) + 1;
        }
      }
    });

    return Object.entries(data)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [history, activities]);

  // Dynamic AI suggestions based on history (exact port of mobile app logic)
  const aiSuggestion = useMemo(() => {
    const completedHistory = history.filter(h => h.completed === 1);
    if (completedHistory.length === 0) {
      return "You haven't completed any activities yet. Start by generating and scheduling your first activity!";
    }

    // Group by category for bar chart
    const categoryCounts: Record<string, number> = {};
    completedHistory.forEach(h => {
      const act = activities.find(a => a.id === h.activity_id);
      if (act) {
        categoryCounts[act.category] = (categoryCounts[act.category] || 0) + 1;
      }
    });

    const allCategories = ['Icebreaker', 'Team Bonding', 'Wellness', 'Training', 'Recognition', 'Festival'];
    const usedCategories = Object.keys(categoryCounts);
    const missingCategories = allCategories.filter(c => !usedCategories.includes(c));

    if (missingCategories.length > 0) {
      return `You haven't tried any ${missingCategories[0]} activities yet. Consider adding one to keep your engagement diverse!`;
    }

    // Find least used category
    const leastUsed = Object.entries(categoryCounts).sort((a, b) => a[1] - b[1])[0];
    const mostUsed = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    return `Your team loves ${mostUsed[0]} activities! Try adding more ${leastUsed[0]} activities for better balance.`;
  }, [history, activities]);

  return (
    <>
      <Header title="Insights" subtitle="Data analytics & team engagement insights" />

      <div className="page-content">
        {/* Stats Summary */}
        <div className="stats-row" style={{ marginBottom: 28 }}>
          <div className="stat-card" style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)20' }}>
            <TrendingUp size={20} color="var(--color-primary)" />
            <div className="stat-card-value" style={{ color: 'var(--color-primary)' }}>{completedCount}</div>
            <div className="stat-card-title" style={{ color: 'var(--color-primary)' }}>Completed</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--color-secondary-light)', border: '1px solid var(--color-secondary)20' }}>
            <BookOpen size={20} color="var(--color-secondary)" />
            <div className="stat-card-value" style={{ color: 'var(--color-secondary)' }}>{activities.length}</div>
            <div className="stat-card-title" style={{ color: 'var(--color-secondary)' }}>In Bank</div>
          </div>
          <div className="stat-card" style={{ background: '#FEF3C7', border: '1px solid #F59E0B20' }}>
            <Heart size={20} color="#D97706" fill="#D97706" />
            <div className="stat-card-value" style={{ color: '#D97706' }}>{favoriteCount}</div>
            <div className="stat-card-title" style={{ color: '#D97706' }}>Favorites</div>
          </div>
        </div>

        {/* AI Suggestion Card */}
        <div style={{
          padding: 20,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-light)',
          border: `1px solid var(--color-primary)30`,
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          marginBottom: 32,
        }}>
          <div style={{
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            padding: 10,
            color: 'white',
            flexShrink: 0
          }}>
            <Bot size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} /> AI Suggestion
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
              {aiSuggestion}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}>
          {/* Monthly Trend Chart */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--color-primary)" />
              Monthly Activity Trend
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                  <Line type="monotone" dataKey="completed" stroke="var(--color-primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Categories Chart */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--color-secondary)" />
              Popular Categories
            </h3>
            {categoryChartData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    />
                    <Bar dataKey="count" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{
                height: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                <AlertCircle size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>No completed activity data</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Complete activities in the calendar to populate this chart.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
