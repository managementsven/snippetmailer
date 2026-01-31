import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  LayoutTemplate,
  Save,
  Plus,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { debounce } from "lodash";

import SnippetPickerDrawer from "../components/composer/SnippetPickerDrawer";
import ComposerEmailBuilder from "../components/composer/ComposerEmailBuilder";
import ComposerPreview from "../components/composer/ComposerPreview";

export default function Composer() {
  const queryClient = useQueryClient();
  const [snippetPickerOpen, setSnippetPickerOpen] = useState(false);
  
  // Filters
  const [language, setLanguage] = useState('de');
  
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

  const { data: snippets = [] } = useQuery({
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
      toast.success('Entwurf gespeichert');
    },
  });

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

  // Missing snippets
  const missingSnippets = draftData.snippet_items
    ?.filter(item => !snippets.find(s => s.id === item.snippet_id))
    .map(item => item.snippet_id) || [];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground">E-Mail Composer</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Ungespeichert
                  </span>
                )}
                {lastSaved && !hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <Check className="h-3 w-3" />
                    Gespeichert
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Select value={language} onValueChange={(val) => {
              setLanguage(val);
              updateDraft({ language: val });
            }}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Templates</span>
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
                        className="p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => loadTemplate(template)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-foreground">{template.name}</h4>
                          <Badge variant="outline" className="text-[10px]">
                            {template.language?.toUpperCase()}
                          </Badge>
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {template.snippet_ids?.length || 0} Snippets
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="sm" onClick={newDraft} className="gap-2 h-8">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={() => saveDraftMutation.mutate(draftData)}
              disabled={saveDraftMutation.isPending}
              className="gap-2 h-8"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline text-xs">Speichern</span>
            </Button>
          </div>
        </header>

        {/* 2-Panel Layout: Editor + Preview */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Editor */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 border-r border-border">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <span className="text-xs font-medium text-muted-foreground">Editor</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSnippetPickerOpen(true)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Snippet
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <ComposerEmailBuilder
                draft={draftData}
                snippets={snippets}
                onUpdateDraft={updateDraft}
                onRemoveSnippet={removeSnippetFromDraft}
                onUpdateSnippetOverride={updateSnippetOverride}
                onResetSnippetOverride={resetSnippetOverride}
              />
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-[480px] flex-shrink-0 hidden lg:flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-border bg-card">
              <span className="text-xs font-medium text-muted-foreground">Vorschau</span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <ComposerPreview
                draft={draftData}
                snippets={snippets}
                missingSnippets={missingSnippets}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Snippet Picker Drawer */}
      <SnippetPickerDrawer
        open={snippetPickerOpen}
        onOpenChange={setSnippetPickerOpen}
        snippets={snippets}
        categories={categories}
        tags={tags}
        cases={cases}
        onAddSnippet={addSnippetToDraft}
        language={language}
      />
    </DragDropContext>
  );
}