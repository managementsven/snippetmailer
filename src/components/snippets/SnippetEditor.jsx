import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, FileText, Settings, History, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function SnippetEditor({
  open,
  onOpenChange,
  snippet,
  categories = [],
  tags = [],
  cases = [],
  onSave,
  onPublish,
  isLoading = false,
  canPublish = false,
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    language: 'de',
    categories: [],
    tags: [],
    cases: [],
    status: 'draft',
  });
  const [changeNote, setChangeNote] = useState('');
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    if (snippet) {
      setFormData({
        title: snippet.title || '',
        content: snippet.content || '',
        language: snippet.language || 'de',
        categories: snippet.categories || [],
        tags: snippet.tags || [],
        cases: snippet.cases || [],
        status: snippet.status || 'draft',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        language: 'de',
        categories: [],
        tags: [],
        cases: [],
        status: 'draft',
      });
    }
    setChangeNote('');
    setActiveTab('edit');
  }, [snippet, open]);

  const handleSave = (publish = false) => {
    const data = { ...formData };
    if (publish) {
      data.status = 'published';
    }
    onSave(data, changeNote);
  };

  const toggleArrayItem = (field, id) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter(i => i !== id)
        : [...prev[field], id]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            {snippet ? 'Snippet bearbeiten' : 'Neues Snippet'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="edit" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent"
            >
              <FileText className="h-4 w-4 mr-2" />
              Bearbeiten
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent"
            >
              <Eye className="h-4 w-4 mr-2" />
              Vorschau
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent"
            >
              <Settings className="h-4 w-4 mr-2" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="edit" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Snippet-Titel eingeben..."
                  className="text-lg font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Inhalt * (Markdown unterstützt)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Snippet-Inhalt eingeben... (Markdown wird unterstützt)"
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {snippet && (
                <div className="space-y-2">
                  <Label htmlFor="changeNote">Änderungsnotiz (optional)</Label>
                  <Input
                    id="changeNote"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="Was wurde geändert?"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="bg-white border rounded-lg p-6 min-h-[300px]">
                <h2 className="text-xl font-semibold mb-4">{formData.title || 'Kein Titel'}</h2>
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>{formData.content || '*Kein Inhalt*'}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 space-y-6">
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
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={!canPublish && formData.status !== 'draft'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Entwurf</SelectItem>
                      {canPublish && <SelectItem value="published">Veröffentlicht</SelectItem>}
                      {canPublish && <SelectItem value="archived">Archiviert</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kategorien</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50 min-h-[60px]">
                  {categories.map(cat => (
                    <Badge
                      key={cat.id}
                      variant={formData.categories.includes(cat.id) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.categories.includes(cat.id) && "ring-2 ring-offset-1"
                      )}
                      style={formData.categories.includes(cat.id) ? { backgroundColor: cat.color } : {}}
                      onClick={() => toggleArrayItem('categories', cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                  {categories.length === 0 && (
                    <span className="text-sm text-slate-500">Keine Kategorien verfügbar</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fehlerbilder / Cases</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50 min-h-[60px]">
                  {cases.map(c => (
                    <Badge
                      key={c.id}
                      variant={formData.cases.includes(c.id) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.cases.includes(c.id) && "bg-orange-500 hover:bg-orange-600"
                      )}
                      onClick={() => toggleArrayItem('cases', c.id)}
                    >
                      {c.name}
                    </Badge>
                  ))}
                  {cases.length === 0 && (
                    <span className="text-sm text-slate-500">Keine Fehlerbilder verfügbar</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50 min-h-[60px]">
                  {tags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant={formData.tags.includes(tag.id) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.tags.includes(tag.id) && "bg-indigo-600"
                      )}
                      onClick={() => toggleArrayItem('tags', tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-sm text-slate-500">Keine Tags verfügbar</span>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-500">
              {snippet && `Version ${snippet.version || 1}`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={!formData.title || !formData.content || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
              {canPublish && formData.status === 'draft' && (
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleSave(true)}
                  disabled={!formData.title || !formData.content || isLoading}
                >
                  Veröffentlichen
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}