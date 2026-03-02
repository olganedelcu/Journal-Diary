import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEntriesPaginated,
  getEntries,
  getEntry,
  saveEntry,
  deleteEntry,
} from '../storage/journalStorage';
import type { JournalEntry } from '../types/journal';

const KEYS = {
  entries: 'entries',
  entriesPaged: 'entries-paged',
  entry: 'entry',
} as const;

export function useEntriesPaginated(
  page: number,
  pageSize: number,
  search?: string
) {
  return useQuery({
    queryKey: [KEYS.entriesPaged, page, pageSize, search],
    queryFn: () => getEntriesPaginated(page, pageSize, search),
    placeholderData: (prev) => prev,
  });
}

export function useAllEntries() {
  return useQuery({
    queryKey: [KEYS.entries],
    queryFn: getEntries,
    staleTime: 2 * 60 * 1000,
  });
}

export function useEntry(id: string | undefined) {
  return useQuery({
    queryKey: [KEYS.entry, id],
    queryFn: () => getEntry(id!),
    enabled: !!id,
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEYS.entriesPaged] });
      queryClient.invalidateQueries({ queryKey: [KEYS.entries] });
    },
  });
}

export function useSaveEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveEntry,
    onSuccess: (_data, entry: JournalEntry) => {
      queryClient.invalidateQueries({ queryKey: [KEYS.entriesPaged] });
      queryClient.invalidateQueries({ queryKey: [KEYS.entries] });
      queryClient.invalidateQueries({ queryKey: [KEYS.entry, entry.id] });
    },
  });
}
