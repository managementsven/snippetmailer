import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  LayoutTemplate,
  Edit,
  Trash2,
  GripVertical,
  FileText,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PageShell from "@/components/PageShell";

export default function Templates() {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snippetSearch, setSnippetSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'de',
    default_subject: '',
    snippet_ids: [],
    notes: '',
    is_active: true,
  });

  // Queries
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('name', 100),
  });

  const { data: snippets = [] } = useQuery({
    queryKey: ['snippets'],
    queryFn: () => base44.entities.Snippet.filter({ status: 'published' }, 'title', 500),
  });

  const isAdmin = user?.app_role === 'admin' || user?.role === 'admin';
  const isEditor = user?.app_role === 'editor' || isAdmin;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditorOpen(false);
      resetForm();
      toast.success('Template erstellt');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditorOpen(false);
      setSelectedTemplate(null);
      resetForm();
      toast.success('Template aktualisiert');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
      toast.success('Template gelöscht');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      language: 'de',
      default_subject: '',
      snippet_ids: [],
      notes: '',
      is_active: true,
    });
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      language: template.language || 'de',
      default_subject: template.default_subject || '',
      snippet_ids: template.snippet_ids || [],
      notes: template.notes || '',
      is_active: template.is_active !== false,
    });
    setEditorOpen(true);
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.snippet_ids);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setFormData({ ...formData, snippet_ids: items });
  };

  const addSnippet = (snippetId) => {
    if (!formData.snippet_ids.includes(snippetId)) {
      setFormData({
        ...formData,
        snippet_ids: [...formData.snippet_ids, snippetId],
      });
    }
  };

  const removeSnippet = (snippetId) => {
    setFormData({
      ...formData,
      snippet_ids: formData.snippet_ids.filter(id => id !== snippetId),
    });
  };

  const getSnippetById = (id) => snippets.find(s => s.id === id);

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableSnippets = snippets.filter(s =>
    s.language === formData.language &&
    (s.title?.toLowerCase().includes(snippetSearch.toLowerCase()) ||
     s.content?.toLowerCase().includes(snippetSearch.toLowerCase()))
  );

  return (
    <PageShell
      title="Templates"
      subtitle={`${templates.length} Vorlagen`}
      actions={
        isEditor && (
          <Button
            onClick={() => {
              setSelectedTemplate(null);
              resetForm();
              setEditorOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Neues Template
          </Button>
        )
      }
      toolbar={
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Templates durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      }
    >
      <div className="p-4 lg:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <LayoutTemplate className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium text-foreground">Keine Templates gefunden</p>
              <p className="text-xs mt-1">Erstellen Sie ein neues Template</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="p-4 rounded-2xl hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LayoutTemplate className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {template.language?.toUpperCase()}
                          </Badge>
                          {!template.is_active && (
                            <Badge variant="secondary" className="text-[10px]">
                              Inaktiv
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground mb-3">
                    {template.snippet_ids?.length || 0} Snippets
                  </div>

                  {template.notes && (
                    <p className="text-xs text-muted-foreground bg-muted rounded p-2 mb-3 line-clamp-2">
                      💡 {template.notes}
                    </p>
                  )}

                  {isEditor && (
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        className="flex-1 gap-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Bearbeiten
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Template bearbeiten' : 'Neues Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Erstkontakt No Power"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Wofür wird dieses Template verwendet?"
                    className="h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sprache</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData({ ...formData, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="inactive">Inaktiv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Standard-Betreff</Label>
                  <Input
                    value={formData.default_subject}
                    onChange={(e) => setFormData({ ...formData, default_subject: e.target.value })}
                    placeholder="z.B. Troubleshooting: [Ticket-Nr]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notizen / Regeln</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="z.B. Immer Logupload-Snippet hinzufügen"
                    className="h-20"
                  />
                </div>
              </div>

              {/* Right: Snippet Selection */}
              <div className="space-y-4">
                <Label>Snippets auswählen</Label>
                
                {/* Available Snippets */}
                <div className="border rounded-lg">
                  <div className="p-2 border-b bg-slate-50">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={snippetSearch}
                        onChange={(e) => setSnippetSearch(e.target.value)}
                        placeholder="Snippet suchen..."
                        className="h-8 pl-8 text-sm"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-40">
                    <div className="p-2 space-y-1">
                      {availableSnippets.map(snippet => (
                        <div
                          key={snippet.id}
                          className={cn(
                            "p-2 rounded cursor-pointer text-sm transition-colors",
                            formData.snippet_ids.includes(snippet.id)
                              ? "bg-indigo-50 text-indigo-700"
                              : "hover:bg-slate-50"
                          )}
                          onClick={() => addSnippet(snippet.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{snippet.title}</span>
                            {formData.snippet_ids.includes(snippet.id) && (
                              <Badge variant="secondary" className="text-[10px] bg-indigo-100">
                                Hinzugefügt
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Selected Snippets */}
                <div>
                  <Label className="mb-2 block">
                    Reihenfolge ({formData.snippet_ids.length} ausgewählt)
                  </Label>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="template-snippets">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="border rounded-lg min-h-[150px] p-2 space-y-1 bg-slate-50"
                        >
                          {formData.snippet_ids.length === 0 ? (
                            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                              Keine Snippets ausgewählt
                            </div>
                          ) : (
                            formData.snippet_ids.map((id, index) => {
                              const snippet = getSnippetById(id);
                              return (
                                <Draggable key={id} draggableId={id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "p-2 bg-white rounded border flex items-center gap-2 text-sm",
                                        snapshot.isDragging && "shadow-lg"
                                      )}
                                    >
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="h-4 w-4 text-slate-300" />
                                      </div>
                                      <span className="text-slate-400 text-xs w-5">{index + 1}.</span>
                                      <span className="flex-1 truncate">
                                        {snippet?.title || `ID: ${id}`}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeSnippet(id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Template löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Template "{selectedTemplate?.name}" wird dauerhaft gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedTemplate?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}