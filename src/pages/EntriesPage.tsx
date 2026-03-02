import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Eye, Pencil, Trash2, Search, BookOpen,
  PenLine, LogOut, Clock, ImageIcon,
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { getEntries, deleteEntry } from '../storage/journalStorage';
import { useAuth } from '../context/AuthContext';

export default function EntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    getEntries().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const filtered = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    await deleteEntry(id);
    const updated = await getEntries();
    setEntries(updated);
  }

  function truncate(text: string, len: number) {
    if (text.length <= len) return text;
    return text.slice(0, len) + '...';
  }

  if (loading) {
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
      {/* Welcome banner with quick-action cards */}
      <div className="entries-welcome">
        <div className="entries-welcome-top">
          <div className="entries-welcome-text">
            <h1>Welcome</h1>
            <p>Your personal digital journal starts here</p>
          </div>
          <div className="entries-welcome-user">
            <span className="welcome-email">{user?.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={signOut}>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className="entries-welcome-grid">
          <button className="welcome-card" onClick={() => navigate('/entries/new')}>
            <div className="welcome-card-icon">
              <PenLine size={24} />
            </div>
            <span>Write</span>
          </button>
          <button className="welcome-card" onClick={() => document.getElementById('search-input')?.focus()}>
            <div className="welcome-card-icon">
              <BookOpen size={24} />
            </div>
            <span>Journal</span>
          </button>
          <button className="welcome-card" onClick={() => document.querySelector('.entries-table-wrapper')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="welcome-card-icon">
              <Clock size={24} />
            </div>
            <span>Timeline</span>
          </button>
          <button className="welcome-card" onClick={() => navigate('/entries/new')}>
            <div className="welcome-card-icon">
              <ImageIcon size={24} />
            </div>
            <span>Photos</span>
          </button>
        </div>
      </div>

      {/* Search */}
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

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h2>No entries yet</h2>
          <p>Start capturing your thoughts, memories, and moments.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/entries/new')}
          >
            <PenLine size={18} />
            Write Your First Entry
          </button>
        </div>
      ) : (
        <div className="entries-table-wrapper">
          <table className="entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Preview</th>
                <th>Images</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="td-date">
                    {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="td-title">{entry.title}</td>
                  <td className="td-preview">{truncate(entry.content, 60)}</td>
                  <td className="td-images">
                    {entry.images.length > 0 ? (
                      <span className="image-badge">
                        {entry.images.length} photo
                        {entry.images.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td className="td-date">
                    {format(new Date(entry.updatedAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="td-actions">
                    <button
                      className="icon-btn"
                      title="View"
                      onClick={() => navigate(`/entries/${entry.id}`)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      title="Edit"
                      onClick={() => navigate(`/entries/${entry.id}/edit`)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      title="Delete"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
