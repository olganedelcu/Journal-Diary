import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, subDays } from 'date-fns';
import {
  Trash2, Search, BookOpen,
  PenLine, LogOut, Clock, ImageIcon, Calendar, Flame,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEntriesPaginated, useAllEntries, useDeleteEntry } from '../hooks/useJournal';

const PAGE_SIZE = 10;

function calcStreak(entries: { createdAt: string }[]) {
  if (entries.length === 0) return 0;

  const daysSet = new Set<string>();
  for (const e of entries) {
    daysSet.add(startOfDay(new Date(e.createdAt)).toISOString());
  }

  let streak = 0;
  let day = startOfDay(new Date());

  if (!daysSet.has(day.toISOString())) {
    day = subDays(day, 1);
  }

  while (daysSet.has(day.toISOString())) {
    streak++;
    day = subDays(day, 1);
  }

  return streak;
}

export default function EntriesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const deleteMutation = useDeleteEntry();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useEntriesPaginated(page, PAGE_SIZE, debouncedSearch || undefined);
  const { data: allEntries } = useAllEntries();

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const streak = useMemo(() => calcStreak(allEntries ?? []), [allEntries]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this entry?')) return;
    deleteMutation.mutate(id);
  }

  function truncate(text: string, len: number) {
    if (text.length <= len) return text;
    return text.slice(0, len) + '...';
  }

  if (isLoading && entries.length === 0) {
    return (
      <div className="entries-page">
        <div className="loading-screen" style={{ minHeight: 'auto', padding: 60, background: 'none' }}>
          <div className="loading-spinner" />
          <p>Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="entries-page">
      {/* Topbar: email + logout */}
      <div className="welcome-topbar">
        <span className="welcome-email">{user?.email}</span>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>
          <LogOut size={16} />
        </button>
      </div>

      {/* Hero section: icon cards */}
      <div className="entries-hero">
        <div className="welcome-grid">
          <button className="welcome-card" onClick={() => navigate('/entries/new')}>
            <div className="welcome-card-icon">
              <PenLine size={28} />
            </div>
            <span>Write</span>
          </button>
          <button className="welcome-card" onClick={() => document.getElementById('search-input')?.focus()}>
            <div className="welcome-card-icon">
              <BookOpen size={28} />
            </div>
            <span>Journal</span>
          </button>
          <button className="welcome-card" onClick={() => navigate('/timeline')}>
            <div className="welcome-card-icon">
              <Clock size={28} />
            </div>
            <span>Timeline</span>
          </button>
          <button className="welcome-card" onClick={() => navigate('/photos')}>
            <div className="welcome-card-icon">
              <ImageIcon size={28} />
            </div>
            <span>Photos</span>
          </button>
        </div>
      </div>

      {/* Streak widget */}
      <div className="streak-widget">
        <Flame size={24} className={streak > 0 ? 'streak-on' : 'streak-off'} />
        <span className="streak-count">{streak}</span>
        <span className="streak-label">day streak</span>
      </div>

      {/* Search */}
      <div className="entries-content">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            id="search-input"
            type="text"
            placeholder="Search by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Diary page cards */}
        {entries.length === 0 && !isLoading ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h2>{debouncedSearch ? 'No matches' : 'No entries yet'}</h2>
            <p>
              {debouncedSearch
                ? 'Try a different search term.'
                : 'Start capturing your thoughts, memories, and moments.'}
            </p>
            {!debouncedSearch && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/entries/new')}
              >
                <PenLine size={18} />
                Write Your First Entry
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="diary-grid">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="diary-card"
                  onClick={() => navigate(`/entries/${entry.id}`)}
                >
                  {entry.images.length > 0 && (
                    <div className="diary-card-img">
                      <img src={entry.images[0].url} alt="" />
                    </div>
                  )}
                  <div className="diary-card-body">
                    <h3 className="diary-card-title">{entry.title}</h3>
                    {entry.quote && (
                      <p className="diary-card-quote">"{truncate(entry.quote, 80)}"</p>
                    )}
                    <p className="diary-card-text">{truncate(entry.content, 150)}</p>
                    <div className="diary-card-footer">
                      <span className="diary-card-date">
                        <Calendar size={14} />
                        {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                      </span>
                      {entry.images.length > 0 && (
                        <span className="diary-card-photos">
                          <ImageIcon size={14} />
                          {entry.images.length}
                        </span>
                      )}
                      <button
                        className="diary-card-delete icon-btn icon-btn-danger"
                        title="Delete"
                        onClick={(e) => handleDelete(entry.id, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <span className="pagination-info">
                  {page + 1} of {totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
