import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Query Hooks
export function useDrafts(sortBy = '-updated_date', limit = 100) {
  return useQuery({
    queryKey: ['drafts', sortBy, limit],
    queryFn: () => base44.entities.Draft.list(sortBy, limit),
    initialData: [],
  });
}

export function useDraft(id) {
  return useQuery({
    queryKey: ['drafts', id],
    queryFn: () => base44.entities.Draft.get(id),
    enabled: !!id,
  });
}

// Mutation Hooks - Silent for auto-save
export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return base44.entities.Draft.update(id, data);
      } else {
        return base44.entities.Draft.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      // Silent - no toast for auto-save
    },
    onError: (error) => {
      toast.error(`Fehler beim Speichern: ${error.message}`);
    },
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => base44.entities.Draft.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Entwurf erstellt');
    },
    onError: (error) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => base44.entities.Draft.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Entwurf aktualisiert');
    },
    onError: (error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => base44.entities.Draft.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Entwurf gelöscht');
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });
}