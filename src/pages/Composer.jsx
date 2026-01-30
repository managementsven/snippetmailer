import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutTemplate,
  Save,
  FileText,
  Eye,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  Plus,
  Star,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";

import SnippetFilters from "../components/snippets/SnippetFilters";
import ComposerSnippetList from "../components/composer/ComposerSnippetList";
import ComposerEmailBuilder from "../components/composer/ComposerEmailBuilder";
import ComposerPreview from "../components/composer/ComposerPreview";

export default function Composer() {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('de');
  const [status, setStatus] = useState('published');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCases, setSelectedCases] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Draft state
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [draftData, setDraftData] = useState({
    language: 'de',
    subject: '',
    greeting: '',
    signature: '',
    snippet_items: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

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

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.filter({ is_active: true }, 'name', 100),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: drafts = [] } = useQuery({
    queryKey: ['drafts', user?.email],
    queryFn: () => base44.entities.Draft.filter({ created_by: user?.email }, '-updated_date', 50),
    enabled: !!user?.email,
  });

  // Mutations
  const saveDraftMutation = useMutation({
    mutationFn: async (data) => {
      if (currentDraftId) {
        return base44.entities.Draft.update(currentDraftId, data);
      } else {
        return base44.entities.Draft.create(data);
      }
    },
    onSuccess: (result) => {
      if (!currentDraftId) {
        setCurrentDraftId(result.id);
      }
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    let result = snippets;

    // Language filter
    if (language !== 'all') {
      result = result.filter(s => s.language === language);
    }

    // Status filter
    if (status !== 'all') {
      result = result.filter(s => s.status === status);
    }

    // Categories filter
    if (selectedCategories.length > 0) {
      result = result.filter(s => 
        selectedCategories.some(catId => s.categories?.includes(catId))
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(s => 
        selectedTags.some(tagId => s.tags?.includes(tagId))
      );
    }

    // Cases filter
    if (selectedCases.length > 0) {
      result = result.filter(s => 
        selectedCases.some(caseId => s.cases?.includes(caseId))
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      const favoriteIds = favorites.map(f => f.snippet_id);
      result = result.filter(s => favoriteIds.includes(s.id));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title?.toLowerCase().includes(query) ||
        s.content?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [snippets, language, status, selectedCategories, selectedTags, selectedCases, showFavoritesOnly, favorites, searchQuery]);

  // Auto-save debounced
  const debouncedSave = useCallback(
    debounce((data) => {
      saveDraftMutation.mutate(data);
    }, 3000),
    [currentDraftId]
  );

  // Track changes
  useEffect(() => {
    if (hasUnsavedChanges && draftData.snippet_items?.length > 0) {
      debouncedSave(draftData);
    }
  }, [draftData, hasUnsavedChanges]);

  // Update draft
  const updateDraft = (updates) => {
    setDraftData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Add snippet to draft
  const addSnippetToDraft = (snippet) => {
    if (draftData.snippet_items?.some(item => item.snippet_id === snippet.id)) {
      toast.info('Snippet bereits hinzugefügt');
      return;
    }

    const newItem = {
      snippet_id: snippet.id,
      override_content: null,
      order: (draftData.snippet_items?.length || 0),
    };

    updateDraft({
      snippet_items: [...(draftData.snippet_items || []), newItem],
    });
    toast.success('Snippet hinzugefügt');
  };

  // Remove snippet from draft
  const removeSnippetFromDraft = (snippetId) => {
    updateDraft({
      snippet_items: draftData.snippet_items
        .filter(item => item.snippet_id !== snippetId)
        .map((item, index) => ({ ...item, order: index })),
    });
  };

  // Update snippet override
  const updateSnippetOverride = (snippetId, content) => {
    updateDraft({
      snippet_items: draftData.snippet_items.map(item =>
        item.snippet_id === snippetId
          ? { ...item, override_content: content }
          : item
      ),
    });
  };

  // Reset snippet override
  const resetSnippetOverride = (snippetId) => {
    updateDraft({
      snippet_items: draftData.snippet_items.map(item =>
        item.snippet_id === snippetId
          ? { ...item, override_content: null }
          : item
      ),
    });
  };

  // Drag and drop
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // From library to email
    if (source.droppableId === 'snippet-library' && destination.droppableId === 'email-body') {
      const snippetId = draggableId.replace('library-', '');
      const snippet = snippets.find(s => s.id === snippetId);
      
      if (snippet) {
        if (draftData.snippet_items?.some(item => item.snippet_id === snippetId)) {
          toast.info('Snippet bereits hinzugefügt');
          return;
        }

        const items = [...(draftData.snippet_items || [])];
        const newItem = {
          snippet_id: snippetId,
          override_content: null,
          order: destination.index,
        };

        items.splice(destination.index, 0, newItem);
        
        updateDraft({
          snippet_items: items.map((item, index) => ({ ...item, order: index })),
        });
      }
      return;
    }

    // Reorder within email
    if (source.droppableId === 'email-body' && destination.droppableId === 'email-body') {
      const items = [...(draftData.snippet_items || [])];
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      updateDraft({
        snippet_items: items.map((item, index) => ({ ...item, order: index })),
      });
    }
  };

  // Load template
  const loadTemplate = (template) => {
    const snippetItems = (template.snippet_ids || []).map((id, index) => ({
      snippet_id: id,
      override_content: null,
      order: index,
    }));

    setDraftData({
      language: template.language || 'de',
      subject: template.default_subject || '',
      greeting: '',
      signature: user?.default_signature || '',
      snippet_items: snippetItems,
      template_id: template.id,
    });
    setCurrentDraftId(null);
    setHasUnsavedChanges(true);
    setLanguage(template.language || 'de');
    toast.success(`Template "${template.name}" geladen`);
  };

  // New draft
  const newDraft = () => {
    setDraftData({
      language: language,
      subject: '',
      greeting: '',
      signature: user?.default_signature || '',
      snippet_items: [],
    });
    setCurrentDraftId(null);
    setHasUnsavedChanges(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatus('published');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedCases([]);
    setShowFavoritesOnly(false);
  };

  // Missing snippets
  const missingSnippets = draftData.snippet_items
    ?.filter(item => !snippets.find(s => s.id === item.snippet_id))
    .map(item => item.snippet_id) || [];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">E-Mail Composer</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Ungespeichert
                  </span>
                )}
                {lastSaved && !hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Check className="h-3 w-3" />
                    Gespeichert
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <Select value={language} onValueChange={(val) => {
              setLanguage(val);
              updateDraft({ language: val });
            }}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>

            {/* Templates */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutTemplate className="h-4 w-4" />
                  <span className="hidden sm:inline">Templates</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Templates</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                  <div className="space-y-2 pr-4">
                    {templates.filter(t => t.language === language || language === 'all').map(template => (
                      <div
                        key={template.id}
                        className="p-4 border rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                        onClick={() => loadTemplate(template)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-slate-900">{template.name}</h4>
                          <Badge variant="outline" className="text-[10px]">
                            {template.language?.toUpperCase()}
                          </Badge>
                        </div>
                        {template.description && (
                          <p className="text-sm text-slate-500 mb-2">{template.description}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          {template.snippet_ids?.length || 0} Snippets
                        </p>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Keine Templates verfügbar</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* New Draft */}
            <Button variant="outline" size="sm" onClick={newDraft} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Neu</span>
            </Button>

            {/* Preview Toggle (Mobile) */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden gap-2"
              onClick={() => setPreviewOpen(!previewOpen)}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Save */}
            <Button
              size="sm"
              onClick={() => saveDraftMutation.mutate(draftData)}
              disabled={saveDraftMutation.isPending}
              className="gap-2"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Speichern</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Snippet Library */}
          <aside className={cn(
            "w-80 border-r bg-slate-50/50 flex flex-col flex-shrink-0 transition-all duration-300",
            "absolute lg:relative inset-y-0 left-0 z-40 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="p-4 border-b bg-card">
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
                compact
              />
            </div>
            <ScrollArea className="flex-1">
              <ComposerSnippetList
                snippets={filteredSnippets}
                categories={categories}
                tags={tags}
                cases={cases}
                favorites={favorites}
                onAddSnippet={addSnippetToDraft}
                isLoading={snippetsLoading}
              />
            </ScrollArea>
            <div className="p-3 border-t bg-card text-xs text-muted-foreground text-center">
              {filteredSnippets.length} Snippets gefunden
            </div>
          </aside>

          {/* Email Builder */}
          <div className="flex-1 flex flex-col min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b bg-card px-4">
                <TabsList className="h-12 bg-transparent p-0 gap-4">
                  <TabsTrigger
                    value="edit"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none px-1 pb-3"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none px-1 pb-3"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vorschau
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="edit" className="flex-1 m-0 overflow-hidden">
                <div className="h-full bg-slate-50/50">
                  <ComposerEmailBuilder
                    draft={draftData}
                    snippets={snippets}
                    onUpdateDraft={updateDraft}
                    onRemoveSnippet={removeSnippetFromDraft}
                    onUpdateSnippetOverride={updateSnippetOverride}
                    onResetSnippetOverride={resetSnippetOverride}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
                <ComposerPreview
                  draft={draftData}
                  snippets={snippets}
                  missingSnippets={missingSnippets}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop Preview Panel */}
          <aside className="hidden xl:block w-96 border-l flex-shrink-0">
            <ComposerPreview
              draft={draftData}
              snippets={snippets}
              missingSnippets={missingSnippets}
            />
          </aside>
        </div>
      </div>
    </DragDropContext>
  );
}