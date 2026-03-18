import type { JournalEntry, JournalImage } from '../types/journal';
import { supabase } from './supabase';

// ---- Helpers ----

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

function rowToEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: row.id as string,
    title: row.title as string,
    content: (row.content as string) ?? '',
    quote: (row.quote as string) ?? '',
    images: (row.images as JournalImage[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---- Entries ----

export interface PaginatedResult {
  entries: JournalEntry[];
  total: number;
}

export async function getEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch entries:', error.message);
    return [];
  }
  return (data ?? []).map(rowToEntry);
}

export async function getEntriesPaginated(
  page: number,
  pageSize: number,
  search?: string
): Promise<PaginatedResult> {
  let query = supabase
    .from('journal_entries')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Failed to fetch entries:', error.message);
    return { entries: [], total: 0 };
  }

  return {
    entries: (data ?? []).map(rowToEntry),
    total: count ?? 0,
  };
}

export async function getEntry(id: string): Promise<JournalEntry | undefined> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return rowToEntry(data);
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const row = {
    id: entry.id,
    user_id: userId,
    title: entry.title,
    content: entry.content,
    quote: entry.quote,
    images: entry.images,
    created_at: entry.createdAt || now,
    updated_at: entry.updatedAt || now,
  };

  const { error } = await supabase
    .from('journal_entries')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('Failed to save entry:', error.message);
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const entry = await getEntry(id);
  if (entry) {
    const paths = entry.images
      .filter((img) => img.storagePath)
      .map((img) => img.storagePath);
    if (paths.length > 0) {
      await supabase.storage.from('diary-images').remove(paths);
    }
  }

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete entry:', error.message);
  }
}

// ---- Image uploads (bucket: diary-images, folder: userId/entryId/) ----

export async function uploadImage(
  file: File,
  entryId: string
): Promise<JournalImage | null> {
  const userId = await getUserId();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${entryId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('diary-images')
    .upload(path, file);

  if (error) {
    console.error('Failed to upload image:', error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('diary-images').getPublicUrl(path);

  return {
    id: crypto.randomUUID(),
    url: publicUrl,
    storagePath: path,
    name: file.name,
    addedAt: new Date().toISOString(),
  };
}

export async function deleteImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('diary-images')
    .remove([storagePath]);

  if (error) {
    console.error('Failed to delete image:', error.message);
  }
}
