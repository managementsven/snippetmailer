import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import PageShell from "@/components/PageShell";
import Guard from "@/components/Guard";
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
  AlertTriangle,
  Edit,
  Trash2,
  Loader2,
  Search,
  Zap,
  Monitor,
  Wifi,
  Volume2,
  HardDrive,
  Power,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCases, useCreateCase, useUpdateCase, useDeleteCase } from "@/components/api/useCollections";

const ICONS = [
  { name: 'Power', icon: Power },
  { name: 'Monitor', icon: Monitor },
  { name: 'Zap', icon: Zap },
  { name: 'Wifi', icon: Wifi },
  { name: 'Volume2', icon: Volume2 },
  { name: 'HardDrive', icon: HardDrive },
  { name: 'RefreshCw', icon: RefreshCw },
  { name: 'AlertTriangle', icon: AlertTriangle },
];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
];

export default function Cases() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'AlertTriangle',
    color: COLORS[0],
  });

  const { data: cases = [], isLoading } = useCases();
  const createMutation = useCreateCase();
  const updateMutation = useUpdateCase();
  const deleteMutation = useDeleteCase();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'AlertTriangle',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  };

  const handleEdit = (caseItem) => {
    setSelectedCase(caseItem);
    setFormData({
      name: caseItem.name || '',
      description: caseItem.description || '',
      icon: caseItem.icon || 'AlertTriangle',
      color: caseItem.color || COLORS[0],
    });
    setEditorOpen(true);
  };

  const handleDelete = (caseItem) => {
    setSelectedCase(caseItem);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (selectedCase) {
      updateMutation.mutate({ id: selectedCase.id, data: formData }, {
        onSuccess: () => {
          setEditorOpen(false);
          setSelectedCase(null);
          resetForm();
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setEditorOpen(false);
          resetForm();
        }
      });
    }
  };

  const getIconComponent = (iconName) => {
    const found = ICONS.find(i => i.name === iconName);
    return found?.icon || AlertTriangle;
  };

  const filteredCases = cases.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell
      title="Fehlerbilder / Cases"
      subtitle={`${cases.length} Fehlerbilder`}
      actions={
        <Guard permissions={['admin']}>
          <Button
            onClick={() => {
              setSelectedCase(null);
              resetForm();
              setEditorOpen(true);
            }}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Neues Fehlerbild
          </Button>
        </Guard>
      }
      toolbar={
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Fehlerbilder durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      }
      className="p-6"
    >
      <div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Keine Fehlerbilder gefunden</p>
              <p className="text-xs mt-1 opacity-60">Erstellen Sie Ihr erstes Fehlerbild</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCases.map(caseItem => {
                const IconComponent = getIconComponent(caseItem.icon);
                return (
                  <Card key={caseItem.id} className="p-4 hover:shadow-lg transition-shadow group rounded-2xl border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${caseItem.color}20` }}
                      >
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: caseItem.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{caseItem.name}</h3>
                        {caseItem.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {caseItem.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Guard permissions={['admin']}>
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(caseItem)}
                          className="flex-1 gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(caseItem)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Guard>
                  </Card>
                );
              })}
            </div>
          )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCase ? 'Fehlerbild bearbeiten' : 'Neues Fehlerbild'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. No Power"
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreibung des Fehlerbilds..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    className={cn(
                      "w-10 h-10 rounded-lg border flex items-center justify-center transition-all",
                      formData.icon === name
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                    onClick={() => setFormData({ ...formData, icon: name })}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      formData.icon === name ? "text-indigo-600" : "text-slate-500"
                    )} />
                  </button>
                ))}
              </div>
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
            <AlertDialogTitle>Fehlerbild löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Fehlerbild "{selectedCase?.name}" wird dauerhaft gelöscht.
              Snippets, die dieses Fehlerbild verwenden, verlieren die Zuordnung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedCase?.id, {
                onSuccess: () => {
                  setDeleteDialogOpen(false);
                  setSelectedCase(null);
                }
              })}
              className="bg-destructive hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}