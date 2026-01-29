import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const queryClient = useQueryClient();
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

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('name', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setEditorOpen(false);
      resetForm();
      toast.success('Fehlerbild erstellt');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setEditorOpen(false);
      setSelectedCase(null);
      resetForm();
      toast.success('Fehlerbild aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Case.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setDeleteDialogOpen(false);
      setSelectedCase(null);
      toast.success('Fehlerbild gelöscht');
    },
  });

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
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    if (selectedCase) {
      updateMutation.mutate({ id: selectedCase.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Fehlerbilder / Cases</h1>
          <p className="text-sm text-slate-500">{cases.length} Fehlerbilder</p>
        </div>

        <Button
          onClick={() => {
            setSelectedCase(null);
            resetForm();
            setEditorOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Neues Fehlerbild
        </Button>
      </header>

      {/* Search */}
      <div className="p-4 border-b bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Fehlerbilder durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 lg:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <AlertTriangle className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Keine Fehlerbilder gefunden</p>
              <p className="text-xs mt-1">Erstellen Sie Ihr erstes Fehlerbild</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCases.map(caseItem => {
                const IconComponent = getIconComponent(caseItem.icon);
                return (
                  <Card key={caseItem.id} className="p-4 hover:shadow-md transition-shadow group">
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
                        <h3 className="font-semibold text-slate-900">{caseItem.name}</h3>
                        {caseItem.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                            {caseItem.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

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
              onClick={() => deleteMutation.mutate(selectedCase?.id)}
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