import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Query Hooks
export function useSnippets(sortBy = '-updated_date', limit = 500) {
  return useQuery({
    queryKey: ['snippets', sortBy, limit],
    queryFn: () => base44.entities.Snippet.list(sortBy, limit),
    initialData: [],
  });
}

export function useSnippet(id) {
  return useQuery({
    queryKey: ['snippets', id],
    queryFn: () => base44.entities.Snippet.get(id),
    enabled: !!id,
  });
}

export function useFavorites(userEmail) {
  return useQuery({
    queryKey: ['favorites', userEmail],
    queryFn: () => base44.entities.Favorite.filter({ user_email: userEmail }),
    initialData: [],
    enabled: !!userEmail,
  });
}

export function useSnippetVersions(snippetId) {
  return useQuery({
    queryKey: ['snippetVersions', snippetId],
    queryFn: () => base44.entities.SnippetVersion.filter({ snippet_id: snippetId }, '-version_number'),
    initialData: [],
    enabled: !!snippetId,
  });
}

// Mutation Hooks
export function useCreateSnippet(user) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => base44.entities.Snippet.create({
      ...data,
      last_modified_by: user?.email,
      version: 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      toast.success('Snippet erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });
}

export function useUpdateSnippet(user, snippets) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, changeNote }) => {
      const snippet = snippets.find(s => s.id === id);
      
      // Create version history
      await base44.entities.SnippetVersion.create({
        snippet_id: id,
        version_number: snippet.version || 1,
        title: snippet.title,
        content: snippet.content,
        language: snippet.language,
        categories: snippet.categories,
        tags: snippet.tags,
        cases: snippet.cases,
        change_note: changeNote,
        changed_by: user?.email,
      });

      // Update snippet
      return base44.entities.Snippet.update(id, {
        ...data,
        last_modified_by: user?.email,
        version: (snippet.version || 1) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      queryClient.invalidateQueries({ queryKey: ['snippetVersions'] });
      toast.success('Snippet erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
}

export function useArchiveSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => base44.entities.Snippet.update(id, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      toast.success('Snippet archiviert');
    },
    onError: (error) => {
      toast.error(`Fehler beim Archivieren: ${error.message}`);
    },
  });
}

export function useToggleFavorite(user) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ snippet, favorites }) => {
      const existing = favorites.find(f => f.snippet_id === snippet.id);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({
          snippet_id: snippet.id,
          user_email: user?.email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error) => {
      toast.error(`Fehler beim Favorisieren: ${error.message}`);
    },
  });
}

export function useRestoreVersion(user, currentSnippet) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version) => {
      // Create version of current state
      await base44.entities.SnippetVersion.create({
        snippet_id: currentSnippet.id,
        version_number: currentSnippet.version || 1,
        title: currentSnippet.title,
        content: currentSnippet.content,
        language: currentSnippet.language,
        categories: currentSnippet.categories,
        tags: currentSnippet.tags,
        cases: currentSnippet.cases,
        change_note: `Wiederhergestellt von Version ${version.version_number}`,
        changed_by: user?.email,
      });

      // Restore old version
      return base44.entities.Snippet.update(currentSnippet.id, {
        title: version.title,
        content: version.content,
        language: version.language,
        categories: version.categories,
        tags: version.tags,
        cases: version.cases,
        last_modified_by: user?.email,
        version: (currentSnippet.version || 1) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      queryClient.invalidateQueries({ queryKey: ['snippetVersions'] });
      toast.success('Version wiederhergestellt');
    },
    onError: (error) => {
      toast.error(`Fehler beim Wiederherstellen: ${error.message}`);
    },
  });
}