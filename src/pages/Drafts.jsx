import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Search,
  FolderOpen,
  Edit,
  Trash2,
  Clock,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

export default function Drafts() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);

  // Queries
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['drafts', user?.email],
    queryFn: () => base44.entities.Draft.filter({ created_by: user?.email }, '-updated_date', 100),
    enabled: !!user?.email,
  });

  const { data: snippets = [] } = useQuery({
    queryKey: ['snippets'],
    queryFn: () => base44.entities.Snippet.list('title', 500),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('name', 100),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Draft.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      setDeleteDialogOpen(false);
      setSelectedDraft(null);
      toast.success('Entwurf gelöscht');
    },
  });

  const getSnippetById = (id) => snippets.find(s => s.id === id);
  const getTemplateById = (id) => templates.find(t => t.id === id);

  const filteredDrafts = drafts.filter(d =>
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (draft) => {
    setSelectedDraft(draft);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Entwürfe</h1>
          <p className="text-sm text-slate-500">{drafts.length} gespeicherte Entwürfe</p>
        </div>
      </header>

      {/* Search */}
      <div className="p-4 border-b bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Entwürfe durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 lg:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Keine Entwürfe gefunden</p>
              <p className="text-xs mt-1">Entwürfe werden automatisch im Composer gespeichert</p>
              <Link to={createPageUrl("Composer")}>
                <Button className="mt-4 gap-2">
                  <Edit className="h-4 w-4" />
                  Zum Composer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDrafts.map(draft => {
                const template = draft.template_id ? getTemplateById(draft.template_id) : null;
                const snippetCount = draft.snippet_items?.length || 0;
                
                return (
                  <Card key={draft.id} className="p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {draft.name || draft.subject || 'Unbenannter Entwurf'}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {draft.language?.toUpperCase() || 'DE'}
                            </Badge>
                            {template && (
                              <Badge variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-700">
                                {template.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {draft.subject && (
                      <p className="text-sm text-slate-600 mb-2 truncate">
                        <span className="text-slate-400">Betreff:</span> {draft.subject}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <span>{snippetCount} Snippets</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {draft.updated_date 
                          ? format(new Date(draft.updated_date), "dd.MM.yyyy HH:mm", { locale: de })
                          : '-'
                        }
                      </span>
                    </div>

                    {/* Snippet Preview */}
                    {snippetCount > 0 && (
                      <div className="text-xs text-slate-400 mb-3 space-y-1">
                        {draft.snippet_items?.slice(0, 3).map((item, idx) => {
                          const snippet = getSnippetById(item.snippet_id);
                          return (
                            <div key={idx} className="truncate">
                              {idx + 1}. {snippet?.title || `ID: ${item.snippet_id}`}
                              {item.override_content && (
                                <span className="text-amber-500 ml-1">*</span>
                              )}
                            </div>
                          );
                        })}
                        {snippetCount > 3 && (
                          <div className="text-slate-300">
                            +{snippetCount - 3} weitere...
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Link to={`${createPageUrl("Composer")}?draft=${draft.id}`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Öffnen
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(draft)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entwurf löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Entwurf wird dauerhaft gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedDraft?.id)}
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