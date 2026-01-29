import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  FileText,
  History,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import SnippetCard from "../components/snippets/SnippetCard";
import SnippetFilters from "../components/snippets/SnippetFilters";
import SnippetEditor from "../components/snippets/SnippetEditor";
import SnippetVersionHistory from "../components/snippets/SnippetVersionHistory";

export default function Snippets() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('all');
  const [status, setStatus] = useState('published');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCases, setSelectedCases] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Dialogs
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  // Queries
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: snippets = [], isLoading: snippetsLoading } = useQuery({
    queryKey: ['snippets'],
    queryFn: () => base44.entities.Snippet.list('-updated_date', 500),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('sort_order', 100),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.Tag.list('name', 100),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('name', 100),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['snippetVersions', selectedSnippet?.id],
    queryFn: () => base44.entities.SnippetVersion.filter({ snippet_id: selectedSnippet?.id }, '-version_number', 50),
    enabled: !!selectedSnippet?.id && historyOpen,
  });

  const isAdmin = user?.app_role === 'admin' || user?.role === 'admin';
  const isEditor = user?.app_role === 'editor' || isAdmin;
  const canPublish = isAdmin;

  // Mutations
  const createSnippetMutation = useMutation({
    mutationFn: (data) => base44.entities.Snippet.create({
      ...data,
      last_modified_by: user?.email,
      version: 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      setEditorOpen(false);
      toast.success('Snippet erstellt');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateSnippetMutation = useMutation({
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
      setEditorOpen(false);
      setSelectedSnippet(null);
      toast.success('Snippet aktualisiert');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: (id) => base44.entities.Snippet.update(id, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      setDeleteDialogOpen(false);
      setSelectedSnippet(null);
      toast.success('Snippet archiviert');
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (snippet) => {
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
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (version) => {
      const currentSnippet = selectedSnippet;
      
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
      setHistoryOpen(false);
      toast.success('Version wiederhergestellt');
    },
  });

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    let result = snippets;

    if (language !== 'all') {
      result = result.filter(s => s.language === language);
    }

    if (status !== 'all') {
      result = result.filter(s => s.status === status);
    }

    if (selectedCategories.length > 0) {
      result = result.filter(s => 
        selectedCategories.some(catId => s.categories?.includes(catId))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter(s => 
        selectedTags.some(tagId => s.tags?.includes(tagId))
      );
    }

    if (selectedCases.length > 0) {
      result = result.filter(s => 
        selectedCases.some(caseId => s.cases?.includes(caseId))
      );
    }

    if (showFavoritesOnly) {
      const favoriteIds = favorites.map(f => f.snippet_id);
      result = result.filter(s => favoriteIds.includes(s.id));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title?.toLowerCase().includes(query) ||
        s.content?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [snippets, language, status, selectedCategories, selectedTags, selectedCases, showFavoritesOnly, favorites, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setLanguage('all');
    setStatus('published');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedCases([]);
    setShowFavoritesOnly(false);
  };

  const handleSaveSnippet = (data, changeNote) => {
    if (selectedSnippet) {
      updateSnippetMutation.mutate({ id: selectedSnippet.id, data, changeNote });
    } else {
      createSnippetMutation.mutate(data);
    }
  };

  const handleEdit = (snippet) => {
    setSelectedSnippet(snippet);
    setEditorOpen(true);
  };

  const handleDelete = (snippet) => {
    setSelectedSnippet(snippet);
    setDeleteDialogOpen(true);
  };

  const handleViewHistory = (snippet) => {
    setSelectedSnippet(snippet);
    setHistoryOpen(true);
  };

  const isFavorite = (snippet) => favorites.some(f => f.snippet_id === snippet.id);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Snippets</h1>
          <p className="text-sm text-slate-500">{filteredSnippets.length} Textbausteine</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-slate-50">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {isEditor && (
            <Button
              onClick={() => {
                setSelectedSnippet(null);
                setEditorOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Neues Snippet
            </Button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 border-b bg-white">
        <SnippetFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          language={language}
          setLanguage={setLanguage}
          status={status}
          setStatus={setStatus}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedCases={selectedCases}
          setSelectedCases={setSelectedCases}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          categories={categories}
          tags={tags}
          cases={cases}
          onReset={resetFilters}
        />
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 lg:p-6">
          {snippetsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Keine Snippets gefunden</p>
              <p className="text-xs mt-1">Versuche andere Filter oder erstelle ein neues Snippet</p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "space-y-3"
            )}>
              {filteredSnippets.map(snippet => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  categories={categories}
                  tags={tags}
                  cases={cases}
                  isFavorite={isFavorite(snippet)}
                  onToggleFavorite={() => toggleFavoriteMutation.mutate(snippet)}
                  onView={() => handleViewHistory(snippet)}
                  onEdit={isEditor ? () => handleEdit(snippet) : undefined}
                  onDelete={isAdmin ? () => handleDelete(snippet) : undefined}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Editor Dialog */}
      <SnippetEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        snippet={selectedSnippet}
        categories={categories}
        tags={tags}
        cases={cases}
        onSave={handleSaveSnippet}
        isLoading={createSnippetMutation.isPending || updateSnippetMutation.isPending}
        canPublish={canPublish}
      />

      {/* Version History Dialog */}
      <SnippetVersionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        versions={versions}
        currentSnippet={selectedSnippet}
        onRestore={restoreVersionMutation.mutate}
        isLoading={restoreVersionMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Snippet archivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Snippet "{selectedSnippet?.title}" wird archiviert und ist nicht mehr in der Suche sichtbar. 
              Sie können es später wiederherstellen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSnippetMutation.mutate(selectedSnippet?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Archivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}