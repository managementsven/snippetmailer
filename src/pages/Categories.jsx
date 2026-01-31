import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  FolderOpen,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1'
];

export default function Categories() {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLORS[0],
    sort_order: 0,
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('sort_order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create({
      ...data,
      sort_order: categories.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditorOpen(false);
      resetForm();
      toast.success('Kategorie erstellt');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditorOpen(false);
      setSelectedCategory(null);
      resetForm();
      toast.success('Kategorie aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      toast.success('Kategorie gelöscht');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          base44.entities.Category.update(id, { sort_order: index })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      sort_order: 0,
    });
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      color: category.color || COLORS[0],
      sort_order: category.sort_order || 0,
    });
    setEditorOpen(true);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const orderedIds = items.map(item => item.id);
    reorderMutation.mutate(orderedIds);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="h-20 border-b border-border bg-card flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Kategorien</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} Kategorien</p>
        </div>

        <Button
          onClick={() => {
            setSelectedCategory(null);
            resetForm();
            setEditorOpen(true);
          }}
          className="gap-2 h-10"
        >
          <Plus className="h-4 w-4" />
          Neue Kategorie
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 lg:p-8 max-w-3xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground bg-card/30 rounded-2xl border border-border/50">
              <FolderOpen className="h-16 w-16 mb-5 opacity-10" />
              <p className="text-base font-semibold text-foreground/70">Keine Kategorien vorhanden</p>
              <p className="text-sm mt-2 text-muted-foreground/60">Erstellen Sie Ihre erste Kategorie</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3"
                  >
                    {categories.map((category, index) => (
                      <Draggable key={category.id} draggableId={category.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(snapshot.isDragging && "z-50")}
                          >
                            <Card className={cn(
                              "p-5 transition-all duration-200 border-border bg-card hover:shadow-lg group",
                              snapshot.isDragging && "shadow-2xl ring-2 ring-primary/30"
                            )}>
                              <div className="flex items-center gap-5">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
                                </div>
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: category.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground text-base">{category.name}</h3>
                                  {category.description && (
                                    <p className="text-sm text-muted-foreground/70 truncate mt-0.5">{category.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleEdit(category)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(category)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </ScrollArea>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Hardware"
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung"
              />
            </div>

            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      formData.color === color && "ring-2 ring-offset-2 ring-slate-400"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
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
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Kategorie "{selectedCategory?.name}" wird dauerhaft gelöscht.
              Snippets, die diese Kategorie verwenden, verlieren die Zuordnung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedCategory?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}