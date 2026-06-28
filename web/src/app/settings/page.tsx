'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import StatusModal from '@/components/ui/StatusModal';
import { renameCategory } from '@/database/db';
import { Save, Laptop, Building2, Eye, Palette, Trash2, Edit } from 'lucide-react';

const PRESET_COLORS = [
  { primary: '#2563EB', secondary: '#7C3AED', name: 'Royal Indigo' },
  { primary: '#10B981', secondary: '#059669', name: 'Emerald' },
  { primary: '#EF4444', secondary: '#DC2626', name: 'Sunset Red' },
  { primary: '#F59E0B', secondary: '#D97706', name: 'Warm Amber' },
  { primary: '#EC4899', secondary: '#DB2777', name: 'Hot Pink' },
  { primary: '#06B6D4', secondary: '#0891B2', name: 'Teal' },
  { primary: '#111827', secondary: '#4B5563', name: 'Charcoal' },
  { primary: '#8B5CF6', secondary: '#6D28D9', name: 'Amethyst' },
];

export default function SettingsPage() {
  const {
    theme, preferences, organization, setOrganization,
    setThemePreference, customColors, setCustomColors,
    setMonthlyTarget, setRemindersEnabled, setReminderTime,
    categories, refreshCategories
  } = useAppContext();

  const [tab, setTab] = useState<'org' | 'theme'>('org');

  // Org form states
  const [companyName, setCompanyName] = useState(organization?.companyName || '');
  const [employeeCount, setEmployeeCount] = useState(String(organization?.employeeCount || ''));
  const [workType, setWorkType] = useState(organization?.workType || 'Hybrid');
  const [budgetRange, setBudgetRange] = useState(organization?.budgetRange || 'Medium');
  const [industry, setIndustry] = useState(organization?.industry || '');
  const [orgLogoUri, setOrgLogoUri] = useState<string | null>(organization?.orgLogoUri || null);
  const [monthlyGoal, setMonthlyGoal] = useState(preferences.monthlyTarget);
  const [reminders, setReminders] = useState(preferences.remindersEnabled);
  const [reminderTimeVal, setReminderTimeVal] = useState(preferences.reminderTime || '09:00');

  // Theme states
  const [appThemeMode, setAppThemeMode] = useState(preferences.theme);
  const [customPrimary, setCustomPrimary] = useState(customColors?.primary || theme.colors.primary);
  const [customSecondary, setCustomSecondary] = useState(customColors?.secondary || theme.colors.secondary);

  // Category rename states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [statusVisible, setStatusVisible] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgLogoUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOrg = async () => {
    await setOrganization({
      companyName,
      employeeCount: parseInt(employeeCount) || 0,
      workType: workType as any,
      budgetRange: budgetRange as any,
      industry,
      orgLogoUri: orgLogoUri || undefined
    });
    await setMonthlyTarget(monthlyGoal);
    await setRemindersEnabled(reminders);
    await setReminderTime(reminderTimeVal);

    setStatusTitle('Settings Saved!');
    setStatusMessage('Your organization settings have been updated.');
    setStatusVisible(true);
  };

  const handleSaveTheme = async () => {
    await setThemePreference(appThemeMode);
    await setCustomColors({
      primary: customPrimary,
      secondary: customSecondary
    });

    setStatusTitle('Theme Applied!');
    setStatusMessage('Your new branding styles have been applied across the app.');
    setStatusVisible(true);
  };

  const handleApplyPreset = (primary: string, secondary: string) => {
    setCustomPrimary(primary);
    setCustomSecondary(secondary);
  };

  const handleRenameCategory = async (oldName: string) => {
    if (!newCategoryName.trim()) return;
    await renameCategory(oldName, newCategoryName.trim());
    setEditingCategory(null);
    setNewCategoryName('');
    refreshCategories();
  };

  return (
    <>
      <Header title="Settings" subtitle="Configure organization & theme settings" />

      <div className="page-content">
        {/* Settings Tabs */}
        <div className="tab-row" style={{ marginBottom: 24 }}>
          <button className={`tab ${tab === 'org' ? 'active' : ''}`} onClick={() => setTab('org')}>
            <Building2 size={16} /> Organization
          </button>
          <button className={`tab ${tab === 'theme' ? 'active' : ''}`} onClick={() => setTab('theme')}>
            <Palette size={16} /> Theme Branding
          </button>
        </div>

        {tab === 'org' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
            {/* Logo Upload Profile Card (Full Width) */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%'
            }}>
              <div style={{ position: 'relative', width: 110, height: 110, marginBottom: 16 }}>
                <label htmlFor="logo-upload" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--color-primary-light)',
                    border: '2.5px dashed var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  >
                    {orgLogoUri ? (
                      <img src={orgLogoUri} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <Building2 size={36} color={theme.colors.primary} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)' }}>Upload Logo</span>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
                {orgLogoUri && (
                  <button
                    onClick={() => setOrgLogoUri(null)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-error)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer'
                    }}
                    title="Remove Logo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
                {companyName || 'Your Organization'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {employeeCount ? `${employeeCount} employees` : '0 employees'} · {industry || 'No industry set'}
              </p>
            </div>

            {/* Grid Container for Side-by-Side Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              alignItems: 'start',
              width: '100%'
            }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Organization Profile */}
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
                    Organization Profile
                  </h3>

                  <label className="input-label" style={{ marginTop: 0 }}>Company Name</label>
                  <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} />

                  <label className="input-label">Employee Count</label>
                  <input className="input" type="number" value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} />

                  <label className="input-label">Work Type</label>
                  <select className="input" value={workType} onChange={e => setWorkType(e.target.value as any)}>
                    <option>Hybrid</option>
                    <option>Remote</option>
                    <option>Onsite</option>
                  </select>

                  <label className="input-label">Typical Budget Range</label>
                  <select className="input" value={budgetRange} onChange={e => setBudgetRange(e.target.value as any)}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>

                  <label className="input-label">Industry</label>
                  <input className="input" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Engagement Strategy */}
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
                    Engagement Strategy
                  </h3>

                  <label className="input-label" style={{ marginTop: 0 }}>Monthly Goal Target (Activities)</label>
                  <select className="input" value={monthlyGoal} onChange={e => setMonthlyGoal(parseInt(e.target.value))}>
                    {[1, 2, 3, 4, 6, 8, 10, 12].map(n => (
                      <option key={n} value={n}>{n} activities / month</option>
                    ))}
                  </select>

                  <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0' }} />

                  {/* Smart Reminders */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>Smart Reminders</h4>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        Get notified 30 minutes before your scheduled team activities.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reminders}
                      onChange={e => setReminders(e.target.checked)}
                      style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                  </div>

                  {reminders && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                      <label className="input-label" style={{ marginTop: 0 }}>Reminder Time</label>
                      <input
                        type="time"
                        className="input"
                        value={reminderTimeVal}
                        onChange={e => setReminderTimeVal(e.target.value)}
                      />
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                        You will be nudged at this time on the day of the activity.
                      </p>
                    </div>
                  )}
                </div>

                {/* Manage Categories */}
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
                    Manage Categories
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {categories.map(cat => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {editingCategory === cat ? (
                          <>
                            <input
                              className="input"
                              value={newCategoryName}
                              onChange={e => setNewCategoryName(e.target.value)}
                              placeholder={cat}
                              style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => handleRenameCategory(cat)}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingCategory(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{cat}</span>
                            <button className="header-icon-btn" onClick={() => { setEditingCategory(cat); setNewCategoryName(cat); }}>
                              <Edit size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSaveOrg}>
                <Save size={18} /> Save Settings
              </button>
            </div>
          </div>
        )}

        {tab === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
            {/* Grid Container for Theme Branding */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              alignItems: 'start',
              width: '100%'
            }}>
              {/* Left Column */}
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
                  Appearance
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['light', 'dark', 'system'].map(mode => (
                    <button
                      key={mode}
                      className={`filter-chip ${appThemeMode === mode ? 'selected' : ''}`}
                      onClick={() => setAppThemeMode(mode as any)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
                    Brand Palette Presets
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {PRESET_COLORS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => handleApplyPreset(preset.primary, preset.secondary)}
                        style={{
                          padding: 12,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          background: 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', gap: 4 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, background: preset.primary }} />
                          <div style={{ width: 16, height: 16, borderRadius: 4, background: preset.secondary }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
                    Custom Branding
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="input-label" style={{ marginTop: 0 }}>Primary Color</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="color" value={customPrimary} onChange={e => setCustomPrimary(e.target.value)} style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                        <input className="input" value={customPrimary} onChange={e => setCustomPrimary(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="input-label" style={{ marginTop: 0 }}>Secondary Color</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="color" value={customSecondary} onChange={e => setCustomSecondary(e.target.value)} style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                        <input className="input" value={customSecondary} onChange={e => setCustomSecondary(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSaveTheme}>
                <Save size={18} /> Apply Branding
              </button>
            </div>
          </div>
        )}
      </div>

      <StatusModal
        visible={statusVisible}
        type="success"
        title={statusTitle}
        message={statusMessage}
        onConfirm={() => setStatusVisible(false)}
        onClose={() => setStatusVisible(false)}
      />
    </>
  );
}
