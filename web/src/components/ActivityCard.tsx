'use client';

import { useAppContext } from '@/context/AppContext';
import { Activity } from '@/database/db';
import { Heart, Clock, Users, DollarSign, Wifi } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  isFav?: boolean;
  onPress?: () => void;
  onFavToggle?: () => void;
  showActions?: boolean;
  actions?: React.ReactNode;
}

export default function ActivityCard({
  activity, isFav, onPress, onFavToggle, showActions = true, actions
}: ActivityCardProps) {
  const { theme } = useAppContext();

  return (
    <div className="activity-card" onClick={onPress}>
      <div className="activity-card-header">
        <h3 className="activity-card-title">{activity.name}</h3>
        {showActions && onFavToggle && (
          <button
            className={`activity-card-heart ${isFav ? 'active' : ''}`}
            onClick={e => { e.stopPropagation(); onFavToggle(); }}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={18} fill={isFav ? theme.colors.error : 'none'} />
          </button>
        )}
      </div>

      <p className="activity-card-desc">{activity.description}</p>

      <div className="activity-card-meta">
        <span className="activity-card-badge" style={{ background: theme.colors.primaryLight, color: theme.colors.primary }}>
          {activity.category}
        </span>
        <span className="activity-card-badge" style={{ background: theme.colors.secondaryLight, color: theme.colors.secondary }}>
          <Clock size={12} /> {activity.duration}
        </span>
        <span className="activity-card-badge" style={{ background: theme.colors.success + '15', color: theme.colors.success }}>
          <DollarSign size={12} /> {activity.estimated_cost}
        </span>
        <span className="activity-card-badge" style={{ background: theme.colors.warning + '15', color: theme.colors.warning }}>
          <Users size={12} /> {activity.min_employees}-{activity.max_employees}
        </span>
        {activity.remote_compatible === 1 && (
          <span className="activity-card-badge" style={{ background: theme.colors.primary + '15', color: theme.colors.primary }}>
            <Wifi size={12} /> Remote
          </span>
        )}
      </div>

      {actions && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}
