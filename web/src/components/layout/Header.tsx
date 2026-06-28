'use client';

import { useAppContext } from '@/context/AppContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { organization } = useAppContext();

  return (
    <header className="header">
      <div className="header-left">
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        {organization && (
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-primary-light)',
          }}>
            {organization.companyName}
          </span>
        )}
        {actions}
      </div>
    </header>
  );
}
