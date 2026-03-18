import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  ImageIcon,
  FileText,
  Quote,
} from 'lucide-react';
import { useEntry, useDeleteEntry } from '../hooks/useJournal';

export default function ViewEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: entry, isLoading } = useEntry(id);
  const deleteMutation = useDeleteEntry();

  useEffect(() => {
    if (!isLoading && !entry) {
      navigate('/entries');
    }
  }, [isLoading, entry, navigate]);

  function handleDelete() {
    if (!entry) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;
    deleteMutation.mutate(entry.id, {
      onSuccess: () => navigate('/entries'),
    });
  }

  if (isLoading || !entry) {
    return (
      <div className="view-page">
        <div className="loading-screen" style={{ minHeight: 'auto', padding: 60, background: 'none' }}>
          <div className="loading-spinner" />
          <p>Loading entry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-page">
      <div className="view-topbar">
        <button className="btn btn-ghost" onClick={() => navigate('/entries')}>
          <ArrowLeft size={18} />
          Back to Journal
        </button>
        <div className="view-topbar-actions">
          <button
            className="icon-btn icon-btn-danger"
            title="Delete"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/entries/${entry.id}/edit`)}
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>
      </div>

      <div className="view-header">
        <h1>{entry.title}</h1>
        <div className="view-meta-row">
          <span className="view-meta-item">
            <Calendar size={14} />
            {format(new Date(entry.createdAt), 'MMMM dd, yyyy')}
          </span>
          <span className="view-meta-item">
            <Clock size={14} />
            Updated {format(new Date(entry.updatedAt), 'MMM dd, yyyy')}
          </span>
          <span className="view-meta-item">
            <FileText size={14} />
            {entry.content.split(/\s+/).filter(Boolean).length} words
          </span>
          {entry.images.length > 0 && (
            <span className="view-meta-item">
              <ImageIcon size={14} />
              {entry.images.length} photo{entry.images.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {entry.quote && (
        <blockquote className="entry-quote">
          <Quote size={20} className="entry-quote-icon" />
          <p>{entry.quote}</p>
        </blockquote>
      )}

      <div className="view-body">
        <div className="card">
          <div className="entry-content">
            {entry.content ? (
              entry.content.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))
            ) : (
              <p className="empty-note">No writing added yet.</p>
            )}
          </div>
        </div>

        {entry.images.length > 0 && (
          <div className="card">
            <h2 className="card-title">
              <ImageIcon size={20} />
              Photos
            </h2>
            <div className="image-gallery">
              {entry.images.map((img) => (
                <div key={img.id} className="gallery-item">
                  <img src={img.url} alt={img.name} />
                  <span className="gallery-label">{img.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
