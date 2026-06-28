'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import { getMonthlyScheduledActivities, Activity, ActivityHistory } from '@/database/db';
import { EXPORT_UI_THEMES, UITheme } from '@/database/exportThemes';
import html2canvas from 'html2canvas';
import {
  Download, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  Smile, Image as ImageIcon, X, FileJson
} from 'lucide-react';

const EMOJI_PRESETS = [
  '🎯', '🍕', '🎮', '💡', '🧘', '🎨', '🔥', '👟',
  '🍿', '🎸', '🧗', '🧁', '🏆', '💻', '🚲', '🌿',
  '🎤', '🎬', '🏸', '🍔', '🍦', '🎲', '🏖️', '⛰️',
  '🛶', '🎭', '🧶', '🪴'
];

type ActivityWithHistory = ActivityHistory & Activity;

export default function CalendarExportPage() {
  const { theme, organization, dbReady } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activities, setActivities] = useState<ActivityWithHistory[]>([]);
  const [customTagline, setCustomTagline] = useState(organization?.tagline || 'Team Engagement Plan');
  const [activeTheme, setActiveTheme] = useState<UITheme>(EXPORT_UI_THEMES[0]);
  const [useBranding, setUseBranding] = useState(false);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Icon customization
  const [customIconMap, setCustomIconMap] = useState<Record<string, string>>({});
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingActivityName, setEditingActivityName] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const list = await getMonthlyScheduledActivities(year, month);
    setActivities(list as ActivityWithHistory[]);
  }, [currentDate]);

  useEffect(() => {
    if (dbReady) {
      loadData();
    }
  }, [dbReady, loadData]);

  const handleExport = async () => {
    if (!printRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `engagement_calendar_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper functions for emojis
  const extractEmoji = (text: string) => {
    const match = text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    return match ? match[0] : null;
  };

  const stripEmoji = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
  };

  const getIconForCategory = (category: string, activityName = '') => {
    const name = activityName.toLowerCase();
    const cat = category.toLowerCase();
    if (name.includes('foot') || name.includes('socc')) return '⚽';
    if (name.includes('brick') || name.includes('crick')) return '🏏';
    if (name.includes('yoga')) return '🧘';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('drink') || name.includes('party')) return '🍹';
    if (cat.includes('sport')) return '⚽';
    if (cat.includes('well')) return '🌿';
    if (cat.includes('team')) return '👥';
    if (cat.includes('learn') || cat.includes('brain')) return '💡';
    if (cat.includes('social')) return '🎉';
    return '⭐';
  };

  // Grouped activities for list rendering
  const sortedGroupedActivities = useMemo(() => {
    const map = new Map<string, ActivityWithHistory & { all_dates: string[], display_date?: string }>();
    activities.forEach(acc => {
      if (map.has(acc.name)) {
        map.get(acc.name)!.all_dates.push(acc.scheduled_date);
      } else {
        map.set(acc.name, { ...acc, all_dates: [acc.scheduled_date] });
      }
    });

    const grouped = Array.from(map.values()).map(acc => {
      acc.all_dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      if (acc.all_dates.length > 1) {
        const first = new Date(acc.all_dates[0]);
        const last = new Date(acc.all_dates[acc.all_dates.length - 1]);
        acc.display_date = `${first.getDate()}/${first.getMonth() + 1} - ${last.getDate()}/${last.getMonth() + 1}`;
      } else {
        const d = new Date(acc.scheduled_date);
        acc.display_date = `${d.getDate()}/${d.getMonth() + 1}`;
      }
      return acc;
    });

    return grouped.sort((a, b) => {
      if (a.all_dates.length > 1 && b.all_dates.length === 1) return -1;
      if (a.all_dates.length === 1 && b.all_dates.length > 1) return 1;
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    });
  }, [activities]);

  const handlePickIcon = (name: string) => {
    setEditingActivityName(name);
    setPickerVisible(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!editingActivityName) return;
    setCustomIconMap(prev => ({
      ...prev,
      [editingActivityName]: emoji
    }));
    setPickerVisible(false);
    setEditingActivityName(null);
  };

  const logoSrc = organization?.orgLogoUri || "/logo.png";

  // ── SVG Export for Figma ──
  const handleSVGExport = () => {
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const yearNum = currentDate.getFullYear();
    const primaryColorVal = useBranding ? theme.colors.primary : activeTheme.primaryColor;
    const accentColorVal = useBranding ? theme.colors.secondary : activeTheme.accentColor;
    const bgVal = useBranding ? theme.colors.background : activeTheme.backgroundColor;

    const activityMap: Record<number, ActivityWithHistory[]> = {};
    activities.forEach(acc => {
      const day = new Date(acc.scheduled_date).getDate();
      if (!activityMap[day]) activityMap[day] = [];
      activityMap[day].push(acc);
    });

    const isDarkBg = useBranding && theme.isDark;
    const canvasTextColorVal = isDarkBg ? '#FFFFFF' : '#1A202C';
    const canvasSecondaryTextColorVal = isDarkBg ? '#CBD5E0' : '#718096';
    const canvasCardBgVal = isDarkBg ? '#2D3748' : '#FFFFFF';
    const canvasBorderColorVal = isDarkBg ? 'rgba(255,255,255,0.1)' : '#E8ECF1';

    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1000" height="850" viewBox="0 0 1000 850" xmlns="http://www.w3.org/2000/svg">
  <rect width="1000" height="850" fill="${bgVal}" />
`;

    const generateSVGGrid = (cellW: number, cellH: number) => {
      const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const daysInMonth = new Date(yearNum, month, 1).getDay();
      const totalDays = new Date(yearNum, month + 1, 0).getDate();
      const startOffset = daysInMonth === 0 ? 6 : daysInMonth - 1;

      let gridSvg = '';
      daysOfWeek.forEach((day, i) => {
        gridSvg += `<text x="${i * cellW + cellW / 2}" y="15" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#E53E3E" text-anchor="middle" dominant-baseline="central">${day}</text>`;
      });

      for (let i = 0; i < 42; i++) {
        const dayNum = i - startOffset + 1;
        const isCurrentMonth = dayNum > 0 && dayNum <= totalDays;
        const row = Math.floor(i / 7);
        const col = i % 7;

        if (isCurrentMonth) {
          const dayActivities = activityMap[dayNum];
          const iconVal = dayActivities && dayActivities.length > 0 ? (customIconMap[dayActivities[0].name] || extractEmoji(dayActivities[0].name) || getIconForCategory(dayActivities[0].category, dayActivities[0].name)) : '';

          gridSvg += `
          <g transform="translate(${col * cellW}, ${row * cellH + 45})">
            ${dayActivities && dayActivities.length > 0 ? `
              <circle cx="${cellW / 2}" cy="${cellH / 2}" r="${cellH / 2.5}" fill="${canvasCardBgVal}" stroke="${canvasBorderColorVal}" stroke-width="1" />
              ${iconVal.startsWith('data:image') ? `
                <clipPath id="clip-${dayNum}">
                  <circle cx="${cellW / 2}" cy="${cellH / 2}" r="${cellH / 2.5}" />
                </clipPath>
                <image x="${cellW / 2 - cellH / 2.5}" y="${cellH / 2 - cellH / 2.5}" width="${cellH / 1.25}" height="${cellH / 1.25}" href="${iconVal}" clip-path="url(#clip-${dayNum})" preserveAspectRatio="xMidYMid slice" />
              ` : `
                <text x="${cellW / 2}" y="${cellH / 2}" font-family="Arial, sans-serif" font-size="${cellH / 2.5}" text-anchor="middle" dominant-baseline="central" fill="${canvasTextColorVal}">${iconVal}</text>
              `}
            ` : `
              <text x="${cellW / 2}" y="${cellH / 2}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${canvasTextColorVal}" text-anchor="middle" dominant-baseline="central">${dayNum}</text>
            `}
          </g>`;
        }
      }
      return gridSvg;
    };

    if (activeTheme.layoutType === 'structured') {
      svg += `
  <rect width="1000" height="80" fill="${primaryColorVal}" />
  <text x="500" y="52" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle">HR CALENDAR</text>
  
  <line x1="500" y1="120" x2="500" y2="750" stroke="#E8ECF1" stroke-width="1.5" />
  <text x="100" y="150" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${primaryColorVal}">${monthName} ${yearNum}</text>
  
  <g transform="translate(60, 180)">
    ${generateSVGGrid(60, 60)}
  </g>

  <g transform="translate(540, 120)">
    <text x="0" y="30" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${primaryColorVal}">Events</text>
    <g transform="translate(0, 70)">
      ${sortedGroupedActivities.slice(0, 4).map((acc, i) => {
        const iconVal = customIconMap[acc.name] || extractEmoji(acc.name) || getIconForCategory(acc.category, acc.name);
        return `
        <g transform="translate(0, ${i * 140})">
          <rect width="400" height="120" rx="20" fill="${canvasCardBgVal}" stroke="${accentColorVal}30" stroke-width="1.5" />
          <circle cx="50" cy="60" r="30" fill="${accentColorVal}15" />
          ${iconVal.startsWith('data:image') ? `
            <clipPath id="clip-list-${i}">
              <circle cx="50" cy="60" r="30" />
            </clipPath>
            <image x="20" y="30" width="60" height="60" href="${iconVal}" clip-path="url(#clip-list-${i})" preserveAspectRatio="xMidYMid slice" />
          ` : `
            <text x="50" y="60" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="central">${iconVal}</text>
          `}
          <text x="100" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="${canvasTextColorVal}" dominant-baseline="central">${stripEmoji(acc.name)}</text>
          <text x="380" y="45" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="${accentColorVal}" text-anchor="end" dominant-baseline="central">${acc.display_date || ''}</text>
          <text x="100" y="75" font-family="Arial, sans-serif" font-size="14" fill="${canvasSecondaryTextColorVal}" dominant-baseline="central">${acc.description.substring(0, 120).replace(/[<>&"']/g, "")}...</text>
        </g>`;
      }).join('')}
    </g>
  </g>
`;
    } else if (activeTheme.layoutType === 'playful') {
      svg += `
  <rect x="60" y="60" width="180" height="40" rx="12" fill="${primaryColorVal}" />
  <text x="150" y="85" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">HR CALENDAR</text>

  <text x="60" y="180" font-family="Arial, sans-serif" font-size="85" font-weight="900" fill="${primaryColorVal}" letter-spacing="-2">${monthName}</text>
  <text x="60" y="230" font-family="Arial, sans-serif" font-size="36" font-weight="300" fill="${accentColorVal}" letter-spacing="10">${yearNum}</text>

  <g transform="translate(60, 300)">
    ${sortedGroupedActivities.slice(0, 5).map((acc, i) => {
      const iconVal = customIconMap[acc.name] || extractEmoji(acc.name) || getIconForCategory(acc.category, acc.name);
      return `
      <g transform="translate(0, ${i * 105})">
        <rect x="0" y="0" width="8" height="85" fill="${accentColorVal}" rx="4" />
        <g transform="translate(25, 25)">
          ${iconVal.startsWith('data:image') ? `
            <clipPath id="clip-play-${i}">
              <circle cx="12" cy="0" r="12" />
            </clipPath>
            <image x="0" y="-12" width="24" height="24" href="${iconVal}" clip-path="url(#clip-play-${i})" preserveAspectRatio="xMidYMid slice" />
          ` : `
            <text x="0" y="0" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${canvasTextColorVal}" dominant-baseline="central">${iconVal}</text>
          `}
          <text x="35" y="0" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${canvasTextColorVal}" dominant-baseline="central">${stripEmoji(acc.name)}</text>
        </g>
        <text x="25" y="60" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${accentColorVal}" dominant-baseline="central">${acc.display_date}</text>
        <text x="25" y="75" font-family="Arial, sans-serif" font-size="15" fill="${isDarkBg ? '#CBD5E0' : '#4A5568'}" dominant-baseline="central">${acc.description.substring(0, 80).replace(/[<>&"']/g, "")}...</text>
      </g>`;
    }).join('')}
  </g>

  <g transform="translate(520, 150)">
    <rect width="440" height="520" rx="40" fill="${isDarkBg ? '#1A202C' : '#FFFFFF'}" />
    <path d="M 0 40 Q 0 0 40 0 L 400 0 Q 440 0 440 40 L 440 60 L 0 60 Z" fill="${accentColorVal}" />
    <g transform="translate(30, 80)">
      ${generateSVGGrid(54, 60)}
    </g>
  </g>
`;
    } else {
      svg += `
  <rect x="780" y="30" width="190" height="35" rx="12" fill="${primaryColorVal}" />
  <text x="875" y="53" font-family="Arial, sans-serif" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">HR CALENDAR</text>
  
  <text x="500" y="140" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="${canvasTextColorVal}" text-anchor="middle">${monthName.toUpperCase()}</text>
  <text x="500" y="180" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="${canvasSecondaryTextColorVal}" text-anchor="middle" letter-spacing="4">${yearNum}</text>

  <g transform="translate(100, 220)">
    ${generateSVGGrid(115, 45)}
  </g>

  <line x1="80" y1="520" x2="920" y2="520" stroke="${canvasBorderColorVal}" stroke-width="1.5" />

  <g transform="translate(100, 560)">
    ${sortedGroupedActivities.slice(0, 3).map((acc, i) => {
      const iconVal = customIconMap[acc.name] || extractEmoji(acc.name) || getIconForCategory(acc.category, acc.name);
      return `
      <g transform="translate(${i * 300}, 0)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="${accentColorVal}" dominant-baseline="central">${acc.display_date}</text>
        <g transform="translate(0, 25)">
          ${iconVal.startsWith('data:image') ? `
            <clipPath id="clip-min-${i}">
              <circle cx="10" cy="0" r="10" />
            </clipPath>
            <image x="0" y="-10" width="20" height="20" href="${iconVal}" clip-path="url(#clip-min-${i})" preserveAspectRatio="xMidYMid slice" />
          ` : `
            <text x="0" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${canvasTextColorVal}" dominant-baseline="central">${iconVal}</text>
          `}
          <text x="25" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${canvasTextColorVal}" dominant-baseline="central">${stripEmoji(acc.name)}</text>
        </g>
      </g>`;
    }).join('')}
  </g>
`;
    }

    if (customTagline) {
      svg += `
  <g transform="translate(500, 810)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="${canvasSecondaryTextColorVal}" text-anchor="middle" letter-spacing="4">${customTagline.toUpperCase()}</text>
  </g>
`;
    }

    // Embed Logo
    svg += `
  <g transform="translate(500, 750)">
    <image x="-60" y="0" width="120" height="40" href="${logoSrc}" />
  </g>
`;

    svg += '\n</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ActivityMind_Calendar_${yearNum}_${month + 1}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Rendering colors
  const primaryColor = useBranding ? theme.colors.primary : activeTheme.primaryColor;
  const accentColor = useBranding ? theme.colors.secondary : activeTheme.accentColor;
  const bgColor = useBranding ? theme.colors.background : activeTheme.backgroundColor;

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const activityMap: Record<number, ActivityWithHistory[]> = {};
  activities.forEach(acc => {
    const day = new Date(acc.scheduled_date).getDate();
    if (!activityMap[day]) activityMap[day] = [];
    activityMap[day].push(acc);
  });

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }
  while (days.length < 42) {
    days.push(null);
  }

  const isDarkBg = useBranding && theme.isDark;
  const canvasTextColor = isDarkBg ? '#FFFFFF' : '#1A202C';
  const canvasSecondaryTextColor = isDarkBg ? '#CBD5E0' : '#718096';
  const canvasCardBg = isDarkBg ? '#2D3748' : '#FFFFFF';
  const canvasBorderColor = isDarkBg ? 'rgba(255,255,255,0.1)' : '#E8ECF1';

  // ── Render Icon Content safely supporting base64/url image tags ──
  const renderIconContent = (activityName: string, category: string, size = 22) => {
    const iconVal = customIconMap[activityName] || extractEmoji(activityName) || getIconForCategory(category, activityName);
    if (typeof iconVal === 'string' && (iconVal.startsWith('data:image') || iconVal.startsWith('http') || iconVal.startsWith('/') || iconVal.startsWith('blob:'))) {
      return (
        <img
          src={iconVal}
          alt="icon"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      );
    }
    return <span style={{ fontSize: size }}>{iconVal}</span>;
  };

  // ── Render Calendar Grid ──
  const renderCalendarGrid = (cellW: number, cellH: number) => {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#E53E3E' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map((day, i) => {
            const dayActivities = day ? activityMap[day] : null;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: cellH }}>
                {day && (
                  <>
                    {dayActivities && dayActivities.length > 0 ? (
                      <div
                        onClick={() => handlePickIcon(dayActivities[0].name)}
                        style={{
                          width: cellW,
                          height: cellW,
                          borderRadius: '50%',
                          backgroundColor: canvasCardBg,
                          border: `1px solid ${canvasBorderColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden'
                        }}
                        title="Click to customize icon"
                      >
                        {renderIconContent(dayActivities[0].name, dayActivities[0].category, cellW / 2)}
                      </div>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: canvasTextColor }}>{day}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header
        title="Calendar Export"
        subtitle="Generate shareable engagement plan images"
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={handleSVGExport}>
              <FileJson size={16} /> Download Editable SVG (for Figma)
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleExport} disabled={loading}>
              <Download size={16} /> {loading ? 'Generating...' : 'Download Image'}
            </button>
          </div>
        }
      />

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Controls Panel */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignSelf: 'start'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Export Options</h3>

          {/* Month Selector */}
          <div>
            <label className="input-label" style={{ marginTop: 0 }}>Select Month</label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <button className="header-icon-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button className="header-icon-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="input-label">Custom Tagline</label>
            <input className="input" value={customTagline} onChange={e => setCustomTagline(e.target.value)} />
          </div>

          {/* Theme Selector */}
          <div>
            <label className="input-label">Export Theme</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {EXPORT_UI_THEMES.map(themeItem => (
                <button
                  key={themeItem.id}
                  className={`filter-chip ${activeTheme.id === themeItem.id && !useBranding ? 'selected' : ''}`}
                  onClick={() => { setActiveTheme(themeItem); setUseBranding(false); }}
                  style={{ width: '100%', justifyContent: 'flex-start', margin: 0 }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: themeItem.primaryColor, marginRight: 8 }} />
                  {themeItem.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>Use App Branding</span>
            <button
              onClick={() => setUseBranding(!useBranding)}
              style={{ color: useBranding ? 'var(--color-primary)' : 'var(--color-icon-default)' }}
            >
              {useBranding ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>

        {/* Live Canvas Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowX: 'auto' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: 8 }}>
            LIVE PREVIEW (Tap icons to customize)
          </span>

          <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            background: 'var(--color-border)',
            display: 'inline-block',
            alignSelf: 'start'
          }}>
            <div
              ref={printRef}
              style={{
                width: 1000,
                height: 850,
                background: bgColor,
                padding: 40,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              {/* LAYOUT 1: STRUCTURED PRO */}
              {activeTheme.layoutType === 'structured' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                  <div style={{
                    background: primaryColor,
                    margin: '-40px -40px 24px -40px',
                    padding: '24px 0',
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 32,
                    fontWeight: 'bold',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase'
                  }}>
                    HR Calendar
                  </div>

                  <div style={{ display: 'flex', flex: 1, gap: 40 }}>
                    {/* Left Column */}
                    <div style={{ width: '50%', borderRight: '1.5px solid #E8ECF1', paddingRight: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                        <div style={{ padding: 10, borderRadius: 12, border: `2px solid ${primaryColor}`, color: primaryColor }}>
                          📅
                        </div>
                        <span style={{ fontSize: 34, fontWeight: 800, color: primaryColor }}>
                          {currentDate.toLocaleString('default', { month: 'long' })} {year}
                        </span>
                      </div>

                      {renderCalendarGrid(44, 48)}

                      {customTagline && (
                        <div style={{
                          marginTop: 'auto',
                          width: '100%',
                          padding: '16px 24px',
                          borderRadius: 18,
                          border: `2px solid ${accentColor}40`,
                          textAlign: 'center',
                          background: canvasCardBg,
                          color: canvasTextColor,
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          {customTagline}
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                      <h2 style={{ fontSize: 34, fontWeight: 900, color: primaryColor, marginBottom: 24, textAlign: 'center' }}>Events</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {sortedGroupedActivities.slice(0, 4).map((acc, i) => (
                          <div
                            key={i}
                            onClick={() => handlePickIcon(acc.name)}
                            style={{
                              display: 'flex',
                              background: canvasCardBg,
                              borderRadius: 20,
                              padding: 20,
                              alignItems: 'flex-start',
                              border: `1.5px solid ${accentColor}30`,
                              gap: 16,
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{
                              width: 52,
                              height: 52,
                              borderRadius: '50%',
                              background: `${accentColor}10`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              {renderIconContent(acc.name, acc.category, 24)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                <h4 style={{ fontSize: 18, fontWeight: 800, color: canvasTextColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }} title={acc.name}>
                                  {stripEmoji(acc.name)}
                                </h4>
                                <span style={{ fontSize: 13, fontWeight: 800, color: accentColor, flexShrink: 0 }}>{acc.display_date}</span>
                              </div>
                              <p style={{ fontSize: 13, color: canvasSecondaryTextColor, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {acc.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Logo block */}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 20, paddingBottom: 10 }}>
                    <img src={logoSrc} alt="Logo" style={{ width: 180, height: 60, objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              {/* LAYOUT 2: MODERN PLAYFUL */}
              {activeTheme.layoutType === 'playful' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                  <div style={{
                    position: 'absolute',
                    top: 40,
                    left: 40,
                    backgroundColor: primaryColor,
                    padding: '8px 16px',
                    borderRadius: 12,
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14,
                    letterSpacing: 2
                  }}>
                    HR CALENDAR
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 40, flex: 1 }}>
                    {/* Left Column */}
                    <div style={{ flex: 1, paddingRight: 40, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 80, fontWeight: 900, color: primaryColor, letterSpacing: -2, lineHeight: 1 }}>
                        {currentDate.toLocaleString('default', { month: 'long' })}
                      </div>
                      <div style={{ fontSize: 36, fontWeight: 300, color: accentColor, letterSpacing: 10, marginTop: 4, marginBottom: 30 }}>
                        {year}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {sortedGroupedActivities.slice(0, 4).map((acc, i) => (
                          <div
                            key={i}
                            onClick={() => handlePickIcon(acc.name)}
                            style={{ borderLeft: `6px solid ${accentColor}`, paddingLeft: 20, cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {renderIconContent(acc.name, acc.category, 18)}
                              </span>
                              <span style={{ fontSize: 24, fontWeight: 900, color: canvasTextColor }}>
                                {stripEmoji(acc.name)}
                              </span>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: accentColor, marginTop: 2 }}>{acc.display_date}</div>
                            <div style={{ fontSize: 13, color: canvasSecondaryTextColor, marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {acc.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ width: 440, flexShrink: 0 }}>
                      <div style={{
                        backgroundColor: canvasCardBg,
                        borderRadius: 40,
                        padding: 30,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        position: 'relative'
                      }}>
                        <div style={{ height: 20, borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: accentColor, position: 'absolute', top: 0, left: 0, right: 0 }} />
                        <div style={{ marginTop: 16 }}>
                          {renderCalendarGrid(36, 40)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
                    {customTagline && (
                      <span style={{ fontSize: 16, color: canvasSecondaryTextColor, fontStyle: 'italic', fontWeight: 500 }}>
                        {customTagline}
                      </span>
                    )}
                    <img src={logoSrc} alt="Logo" style={{ width: 140, height: 40, objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              {/* LAYOUT 3: ULTRA MINIMAL */}
              {activeTheme.layoutType === 'minimal' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', alignItems: 'center' }}>
                  <div style={{
                    position: 'absolute',
                    top: 30,
                    right: 30,
                    backgroundColor: primaryColor,
                    padding: '6px 12px',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2
                  }}>
                    HR CALENDAR
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 10, marginBottom: 20 }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: canvasTextColor, letterSpacing: 2 }}>
                      {currentDate.toLocaleString('default', { month: 'long' }).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: canvasSecondaryTextColor, letterSpacing: 4, marginTop: 2 }}>
                      {year}
                    </div>
                  </div>

                  <div style={{ width: '80%', flex: 1 }}>
                    {renderCalendarGrid(76, 36)}
                  </div>

                  <div style={{ width: '100%', height: 1.5, backgroundColor: canvasBorderColor, margin: '24px 0' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, width: '100%', textAlign: 'left', marginBottom: 20 }}>
                    {sortedGroupedActivities.slice(0, 3).map((acc, i) => (
                      <div
                        key={i}
                        onClick={() => handlePickIcon(acc.name)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: 12, color: accentColor, fontWeight: 800, marginBottom: 4 }}>{acc.display_date}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {renderIconContent(acc.name, acc.category, 16)}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: canvasTextColor }}>{stripEmoji(acc.name)}</span>
                        </div>
                        <p style={{ fontSize: 12, color: canvasSecondaryTextColor, marginTop: 4, lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {acc.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    {customTagline && (
                      <div style={{ fontSize: 13, color: canvasSecondaryTextColor, letterSpacing: 4, fontWeight: 600 }}>
                        {customTagline.toUpperCase()}
                      </div>
                    )}
                    <img src={logoSrc} alt="Logo" style={{ width: 120, height: 40, objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emoji Picker Modal */}
      {pickerVisible && (
        <div className="modal-overlay" onClick={() => setPickerVisible(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>Pick an Icon</h3>
              <button className="modal-close" onClick={() => setPickerVisible(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Select an emoji sticker or upload an image for &quot;{editingActivityName}&quot;
              </p>

              {/* Custom Image Upload Option */}
              <div style={{ marginBottom: 20 }}>
                <label 
                  htmlFor="icon-image-upload" 
                  className="btn btn-outline" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 8, 
                    cursor: 'pointer', 
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px dashed var(--color-primary)',
                    color: 'var(--color-primary)',
                    background: 'var(--color-primary-light)',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'all 0.2s'
                  }}
                >
                  <ImageIcon size={18} /> Upload Custom Image
                </label>
                <input
                  id="icon-image-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && editingActivityName) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCustomIconMap(prev => ({
                          ...prev,
                          [editingActivityName]: reader.result as string
                        }));
                        setPickerVisible(false);
                        setEditingActivityName(null);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 12,
                maxHeight: 220,
                overflowY: 'auto',
                padding: 4,
                marginBottom: 4
              }}>
                {EMOJI_PRESETS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    style={{
                      fontSize: 28,
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.1s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0' }} />

              <label className="input-label" style={{ marginTop: 0 }}>Or type a custom character/emoji</label>
              <input
                className="input"
                maxLength={2}
                placeholder="Type one emoji or letter..."
                onChange={e => {
                  if (e.target.value) {
                    handleEmojiSelect(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
