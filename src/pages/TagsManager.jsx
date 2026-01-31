import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Tags,
  Edit,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
];

export default function TagsManager() {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    color: COLORS[0],
  });

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.Tag.list('name', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tag.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setEditorOpen(false);
      resetForm();
      toast.success('Tag erstellt');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tag.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setEditorOpen(false);
      setSelectedTag(null);
      resetForm();
      toast.success('Tag aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tag.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setDeleteDialogOpen(false);
      setSelectedTag(null);
      toast.success('Tag gelöscht');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  };

  const handleEdit = (tag) => {
    setSelectedTag(tag);
    setFormData({
      name: tag.name || '',
      color: tag.color || COLORS[0],
    });
    setEditorOpen(true);
  };

  const handleDelete = (tag) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    if (selectedTag) {
      updateMutation.mutate({ id: selectedTag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredTags = tags.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col">
      <header className="h-20 border-b border-border bg-card flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tags.length} Tags</p>
        </div>

        <Button
          onClick={() => {
            setSelectedTag(null);
            resetForm();
            setEditorOpen(true);
          }}
          className="gap-2 h-10"
        >
          <Plus className="h-4 w-4" />
          Neuer Tag
        </Button>
      </header>

      {/* Search */}
      <div className="p-5 border-b border-border bg-card/50">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Tags durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-input border-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground bg-card/30 rounded-2xl border border-border/50">
              <Tags className="h-16 w-16 mb-5 opacity-10" />
              <p className="text-base font-semibold text-foreground/70">Keine Tags gefunden</p>
              <p className="text-sm mt-2 text-muted-foreground/60">Erstellen Sie Ihren ersten Tag</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {filteredTags.map(tag => (
                <Card
                  key={tag.id}
                  className="px-4 py-3 flex items-center gap-3 hover:shadow-lg transition-all duration-200 group border-border bg-card"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium text-foreground text-sm">{tag.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(tag)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTag ? 'Tag bearbeiten' : 'Neuer Tag'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. BIOS"
              />
            </div>

            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
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
            <AlertDialogTitle>Tag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Tag "{selectedTag?.name}" wird dauerhaft gelöscht.
              Snippets, die diesen Tag verwenden, verlieren die Zuordnung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedTag?.id)}
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