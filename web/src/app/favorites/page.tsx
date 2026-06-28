'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import ActivityCard from '@/components/ActivityCard';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import { Activity, Favorite, getFavorites, toggleFavorite } from '@/database/db';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { dbReady } = useAppContext();
  const [favorites, setFavorites] = useState<(Favorite & Activity)[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadFavorites = useCallback(async () => {
    const list = await getFavorites();
    setFavorites(list);
  }, []);

  useEffect(() => {
    if (dbReady) {
      loadFavorites();
    }
  }, [dbReady, loadFavorites]);

  const handleFavToggle = async (activity: Activity) => {
    if (!activity.id) return;
    await toggleFavorite(activity.id);
    loadFavorites();
  };

  return (
    <>
      <Header title="Favorites" subtitle="Your curated list of saved activities" />

      <div className="page-content">
        {favorites.length > 0 ? (
          <div className="card-grid">
            {favorites.map((item) => (
              <ActivityCard
                key={item.id}
                activity={item}
                isFav={true}
                onPress={() => { setSelectedActivity(item); setDetailVisible(true); }}
                onFavToggle={() => handleFavToggle(item)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Heart size={48} className="empty-state-icon" style={{ color: 'var(--color-border)' }} />
            <p className="empty-state-title">No favorites yet</p>
            <p className="empty-state-text">
              Tap the heart icon on any activity in the Bank or Generator to save them here.
            </p>
          </div>
        )}
      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onSaved={loadFavorites}
      />
    </>
  );
}
