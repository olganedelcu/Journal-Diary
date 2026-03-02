import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, subDays } from 'date-fns';
import { ArrowLeft, Flame } from 'lucide-react';
import { useAllEntries } from '../hooks/useJournal';

function calcStreak(entries: { createdAt: string }[]) {
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

export default function TimelinePage() {
  const navigate = useNavigate();
  const { data: allEntries, isLoading } = useAllEntries();

  const entries = useMemo(
    () =>
      [...(allEntries ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [allEntries]
  );

  const streak = useMemo(() => calcStreak(entries), [entries]);

  if (isLoading) {
    return (
      <div className="timeline-page">
        <div className="loading-screen" style={{ minHeight: 'auto', padding: 60, background: 'none' }}>
          <div className="loading-spinner" />
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-page">
      <div className="timeline-topbar">
        <button className="btn btn-ghost" onClick={() => navigate('/entries')}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="streak-widget streak-inline">
          <Flame size={20} className={streak > 0 ? 'streak-on' : 'streak-off'} />
          <span className="streak-count">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No entries yet. Write your first entry to see your timeline.</p>
        </div>
      ) : (
        <div className="timeline-map">
          <div className="timeline-line" />
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`timeline-node ${i % 2 === 0 ? 'left' : 'right'}`}
              onClick={() => navigate(`/entries/${entry.id}`)}
            >
              <div className="timeline-node-dot" />
              <div className="timeline-node-strike" />
              <div className="timeline-node-card">
                <div className="timeline-node-content">
                  <span className="timeline-node-date">
                    {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <h4>{entry.title}</h4>
                  <p>{entry.content.length > 80 ? entry.content.slice(0, 80) + '...' : entry.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
