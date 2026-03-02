import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfDay, subDays } from 'date-fns';
import { ArrowLeft, Flame } from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { getEntries } from '../storage/journalStorage';

function calcStreak(entries: JournalEntry[]) {
  if (entries.length === 0) return 0;
  const daysSet = new Set<string>();
  for (const e of entries) {
    daysSet.add(startOfDay(new Date(e.createdAt)).toISOString());
  }
  let streak = 0;
  let day = startOfDay(new Date());
  if (!daysSet.has(day.toISOString())) day = subDays(day, 1);
  while (daysSet.has(day.toISOString())) { streak++; day = subDays(day, 1); }
  return streak;
}

interface PhotoItem {
  url: string;
  name: string;
  entryId: string;
  entryTitle: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    getEntries().then((entries) => {
      setAllEntries(entries);
      const all: PhotoItem[] = [];
      for (const entry of entries) {
        for (const img of entry.images) {
          all.push({
            url: img.url,
            name: img.name,
            entryId: entry.id,
            entryTitle: entry.title,
          });
        }
      }
      setPhotos(all);
      setLoading(false);
    });
  }, []);

  const streak = useMemo(() => calcStreak(allEntries), [allEntries]);

  if (loading) {
    return (
      <div className="photos-page">
        <div className="loading-screen" style={{ minHeight: 'auto', padding: 60, background: 'none' }}>
          <div className="loading-spinner" />
          <p>Loading photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="photos-page">
      <div className="photos-topbar">
        <button className="btn btn-ghost" onClick={() => navigate('/entries')}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="streak-widget streak-inline">
          <Flame size={20} className={streak > 0 ? 'streak-on' : 'streak-off'} />
          <span className="streak-count">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <p>No photos yet. Add images to your entries to see them here.</p>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="photos-item"
              onClick={() => navigate(`/entries/${photo.entryId}`)}
            >
              <img src={photo.url} alt={photo.name} />
              <div className="photos-item-overlay">
                <span>{photo.entryTitle}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
