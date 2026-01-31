import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

import SnippetCard from "../components/snippets/SnippetCard";
import SnippetFilters from "../components/snippets/SnippetFilters";
import SnippetEditor from "../components/snippets/SnippetEditor";
import SnippetVersionHistory from "../components/snippets/SnippetVersionHistory";
import PageShell from "@/components/PageShell";
import Guard from "@/components/Guard";
import { useCurrentUser } from "@/components/api/useAuth";
import { useSnippets, useFavorites, useSnippetVersions, useCreateSnippet, useUpdateSnippet, useArchiveSnippet, useToggleFavorite, useRestoreVersion } from "@/components/api/useSnippets";
import { useCategories, useTags, useCases } from "@/components/api/useCollections";
import { isAdmin, isEditor, canPublish, canDeleteSnippet, canEditSnippet } from "@/components/lib/permissions";

export default function Snippets() {
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

  // Hooks
  const { data: user } = useCurrentUser();
  const { data: snippets = [], isLoading: snippetsLoading } = useSnippets();
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: cases = [] } = useCases();
  const { data: favorites = [] } = useFavorites(user?.email);
  const { data: versions = [] } = useSnippetVersions(selectedSnippet?.id);

  // Mutations
  const createSnippetMutation = useCreateSnippet(user);
  const updateSnippetMutation = useUpdateSnippet(user, snippets);
  const deleteSnippetMutation = useArchiveSnippet();
  const toggleFavoriteMutation = useToggleFavorite(user);
  const restoreVersionMutation = useRestoreVersion(user, selectedSnippet);
  
  // Handlers
  const handleCreateSnippet = (data) => {
    createSnippetMutation.mutate(data, {
      onSuccess: () => {
        setEditorOpen(false);
      }
    });
  };

  const handleUpdateSnippet = ({ id, data, changeNote }) => {
    updateSnippetMutation.mutate({ id, data, changeNote }, {
      onSuccess: () => {
        setEditorOpen(false);
        setSelectedSnippet(null);
      }
    });
  };

  const handleDeleteSnippet = () => {
    deleteSnippetMutation.mutate(selectedSnippet?.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedSnippet(null);
      }
    });
  };

  const handleToggleFavorite = (snippet) => {
    toggleFavoriteMutation.mutate({ snippet, favorites });
  };

  const handleRestoreVersion = (version) => {
    restoreVersionMutation.mutate(version, {
      onSuccess: () => {
        setHistoryOpen(false);
      }
    });
  };

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
      handleUpdateSnippet({ id: selectedSnippet.id, data, changeNote });
    } else {
      handleCreateSnippet(data);
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
    <PageShell
      title="Snippets"
      subtitle={`${filteredSnippets.length} Textbausteine`}
      actions={
        <>
          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1 bg-muted">
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

          <Guard permissions={['editor']}>
            <Button
              onClick={() => {
                setSelectedSnippet(null);
                setEditorOpen(true);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Neues Snippet
            </Button>
          </Guard>
        </>
      }
      toolbar={
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
      }
    >
      <div className="p-4 lg:p-6">
          {snippetsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium text-foreground">Keine Snippets gefunden</p>
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
                  onToggleFavorite={() => handleToggleFavorite(snippet)}
                  onView={() => handleViewHistory(snippet)}
                  onEdit={canEditSnippet(user, snippet) ? () => handleEdit(snippet) : undefined}
                  onDelete={canDeleteSnippet(user, snippet) ? () => handleDelete(snippet) : undefined}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          )}
        </div>

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
        canPublish={canPublish(user)}
      />

      {/* Version History Dialog */}
      <SnippetVersionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        versions={versions}
        currentSnippet={selectedSnippet}
        onRestore={handleRestoreVersion}
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
              onClick={handleDeleteSnippet}
              className="bg-destructive hover:bg-destructive/90"
            >
              Archivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}