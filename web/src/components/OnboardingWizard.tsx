'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  Building2, Users, Laptop, PiggyBank, Factory,
  ArrowLeft, Home, Briefcase, PlugZap
} from 'lucide-react';

const steps = ['Company', 'Team Size', 'Work Type', 'Budget', 'Industry'];

export default function OnboardingWizard() {
  const { theme, setOrganization } = useAppContext();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [workType, setWorkType] = useState<'Remote' | 'Onsite' | 'Hybrid' | null>(null);
  const [budgetRange, setBudgetRange] = useState<'Low' | 'Medium' | 'High' | null>(null);
  const [industry, setIndustry] = useState('');

  const isNextDisabled = () => {
    if (step === 0) return !companyName.trim();
    if (step === 1) return !employeeCount.trim() || isNaN(parseInt(employeeCount));
    if (step === 2) return workType === null;
    if (step === 3) return budgetRange === null;
    if (step === 4) return !industry.trim();
    return false;
  };

  const handleComplete = async () => {
    await setOrganization({
      companyName,
      employeeCount: parseInt(employeeCount) || 0,
      workType: workType || 'Hybrid',
      budgetRange: budgetRange || 'Medium',
      industry
    });
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete();
  };

  const renderOption = (
    label: string,
    value: string,
    selectedValue: string | null,
    onSelect: (val: string) => void,
    icon: React.ReactNode
  ) => {
    const isSelected = value === selectedValue;
    return (
      <button
        key={value}
        onClick={() => onSelect(value)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
          background: isSelected ? theme.colors.primaryLight : theme.colors.surface,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ color: isSelected ? theme.colors.primary : theme.colors.iconDefault }}>{icon}</span>
        <span style={{
          fontSize: 16,
          fontWeight: isSelected ? 600 : 500,
          color: isSelected ? theme.colors.primary : theme.colors.text
        }}>{label}</span>
      </button>
    );
  };

  const stepIcons = [
    <Building2 key="b" size={48} color={theme.colors.primary} />,
    <Users key="u" size={48} color={theme.colors.secondary} />,
    <Laptop key="l" size={48} color={theme.colors.primary} />,
    <PiggyBank key="p" size={48} color={theme.colors.secondary} />,
    <Factory key="f" size={48} color={theme.colors.primary} />,
  ];

  const stepTitles = [
    'Welcome setup',
    'Team Size',
    'Work Type',
    'Activity Budget',
    'Industry',
  ];

  const stepDescriptions = [
    "Let's tailor ActivityMind to your organization. What's your company name?",
    'How many employees are in your organization or team?',
    'How does your team primarily work?',
    'What is your typical budget per activity?',
    "Almost done! What industry are you in?",
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.primaryLight} 100%)`,
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: theme.colors.surface,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header with step indicator */}
        <div style={{
          padding: '24px 24px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ color: theme.colors.text }}>
              <ArrowLeft size={24} />
            </button>
          )}
          <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 4,
                  width: 36,
                  borderRadius: 2,
                  background: i <= step ? theme.colors.primary : theme.colors.border,
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
          {step > 0 && <div style={{ width: 24 }} />}
        </div>

        {/* Content */}
        <div style={{ padding: '0 32px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            {stepIcons[step]}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.colors.text, marginBottom: 8 }}>
            {stepTitles[step]}
          </h1>
          <p style={{ fontSize: 15, color: theme.colors.textSecondary, marginBottom: 28, lineHeight: 1.6 }}>
            {stepDescriptions[step]}
          </p>

          {step === 0 && (
            <input
              className="input"
              type="text"
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              autoFocus
            />
          )}

          {step === 1 && (
            <input
              className="input"
              type="number"
              placeholder="e.g. 50"
              value={employeeCount}
              onChange={e => setEmployeeCount(e.target.value)}
              autoFocus
            />
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {renderOption('Fully Remote', 'Remote', workType, (v) => setWorkType(v as 'Remote'), <Home size={24} />)}
              {renderOption('Fully Onsite', 'Onsite', workType, (v) => setWorkType(v as 'Onsite'), <Briefcase size={24} />)}
              {renderOption('Hybrid', 'Hybrid', workType, (v) => setWorkType(v as 'Hybrid'), <PlugZap size={24} />)}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {renderOption('Low Budget ($)', 'Low', budgetRange, (v) => setBudgetRange(v as 'Low'), <span style={{ fontSize: 24 }}>💰</span>)}
              {renderOption('Medium Budget ($$)', 'Medium', budgetRange, (v) => setBudgetRange(v as 'Medium'), <span style={{ fontSize: 24 }}>💎</span>)}
              {renderOption('High Budget ($$$)', 'High', budgetRange, (v) => setBudgetRange(v as 'High'), <span style={{ fontSize: 24 }}>🏆</span>)}
            </div>
          )}

          {step === 4 && (
            <input
              className="input"
              type="text"
              placeholder="e.g. Technology, Healthcare"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              autoFocus
            />
          )}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 28 }}
            onClick={handleNext}
            disabled={isNextDisabled()}
          >
            {step === 4 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
