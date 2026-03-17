import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, ImagePlus, Camera, X, Loader } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import type { JournalEntry, JournalImage } from '../types/journal';
import { uploadImage, deleteImage } from '../storage/journalStorage';
import { useEntry, useSaveEntry } from '../hooks/useJournal';

export default function EditEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<JournalImage[]>([]);
  const [createdAt, setCreatedAt] = useState(new Date().toISOString());
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [entryId] = useState(() => (isNew ? uuidv4() : id));
  const { data: existing } = useEntry(isNew ? undefined : id);
  const saveMutation = useSaveEntry();

  useEffect(() => {
    if (isNew || !existing) return;
    setTitle(existing.title);
    setContent(existing.content);
    setImages(existing.images);
    setCreatedAt(existing.createdAt);
  }, [existing, isNew]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const uploaded = await uploadImage(file, entryId);
      if (uploaded) {
        setImages((prev) => [...prev, uploaded]);
      }
    }

    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function removeImage(imgId: string) {
    const img = images.find((i) => i.id === imgId);
    if (img?.storagePath) {
      await deleteImage(img.storagePath);
    }
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  }

  async function handleCameraCapture(file: File) {
    setShowCamera(false);
    setUploading(true);
    const uploaded = await uploadImage(file, entryId);
    if (uploaded) {
      setImages((prev) => [...prev, uploaded]);
    }
    setUploading(false);
  }

  function handleSave() {
    if (!title.trim()) {
      alert('Please add a title for your journal entry.');
      return;
    }

    const entry: JournalEntry = {
      id: entryId,
      title: title.trim(),
      content,
      images,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    saveMutation.mutate(entry, {
      onSuccess: () => navigate(`/entries/${entry.id}`),
    });
  }

  return (
    <div className="edit-page">
      <div className="edit-topbar">
        <button
          className="btn btn-ghost"
          onClick={() => navigate(isNew ? '/entries' : `/entries/${id}`)}
        >
          <ArrowLeft size={18} />
          Cancel
        </button>
        <h2>{isNew ? 'New Diary Page' : 'Edit Entry'}</h2>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? <Loader size={16} className="spin" /> : <Save size={16} />}
          {saveMutation.isPending ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      <div className="edit-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="form-input"
            placeholder="Give your entry a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Your Writing</label>
          <textarea
            id="content"
            className="form-textarea"
            placeholder="Write your thoughts, memories, reflections..."
            rows={20}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Photos</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <div className="photo-actions">
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader size={18} className="spin" />
              ) : (
                <ImagePlus size={18} />
              )}
              {uploading ? 'Uploading...' : 'Upload Images'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCamera(true)}
              disabled={uploading}
            >
              <Camera size={18} />
              Take Photo
            </button>
          </div>

          {showCamera && (
            <CameraCapture
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
          )}

          {images.length > 0 && (
            <div className="edit-image-grid">
              {images.map((img) => (
                <div key={img.id} className="edit-image-item">
                  <img src={img.url} alt={img.name} />
                  <button
                    className="edit-image-remove"
                    onClick={() => removeImage(img.id)}
                  >
                    <X size={14} />
                  </button>
                  <span className="edit-image-name">{img.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
