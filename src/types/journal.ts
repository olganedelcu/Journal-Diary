export interface JournalImage {
  id: string;
  url: string;
  storagePath: string;
  name: string;
  addedAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  quote: string;
  images: JournalImage[];
  createdAt: string;
  updatedAt: string;
}
