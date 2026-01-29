import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  GripVertical, 
  Trash2, 
  Edit2, 
  RotateCcw, 
  Mail,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ComposerEmailBuilder({
  draft,
  snippets = [],
  onUpdateDraft,
  onRemoveSnippet,
  onUpdateSnippetOverride,
  onResetSnippetOverride,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [greetingOpen, setGreetingOpen] = useState(!!draft?.greeting);
  const [signatureOpen, setSignatureOpen] = useState(!!draft?.signature);

  const getSnippetById = (id) => snippets.find(s => s.id === id);

  const handleStartEdit = (item) => {
    setEditingId(item.snippet_id);
    setEditContent(item.override_content || getSnippetById(item.snippet_id)?.content || '');
  };

  const handleSaveEdit = (snippetId) => {
    const originalContent = getSnippetById(snippetId)?.content;
    if (editContent !== originalContent) {
      onUpdateSnippetOverride(snippetId, editContent);
    }
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const sortedItems = [...(draft?.snippet_items || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="h-full flex flex-col">
      {/* Subject */}
      <div className="p-4 border-b bg-white">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-sm font-medium text-slate-700">
              Betreff
            </Label>
            <Input
              id="subject"
              value={draft?.subject || ''}
              onChange={(e) => onUpdateDraft({ subject: e.target.value })}
              placeholder="E-Mail-Betreff eingeben..."
              className="text-base"
            />
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Greeting */}
        <Collapsible open={greetingOpen} onOpenChange={setGreetingOpen}>
          <Card className="border-dashed">
            <CollapsibleTrigger asChild>
              <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Anrede</span>
                  {draft?.greeting && !greetingOpen && (
                    <span className="text-sm text-slate-400 truncate max-w-[200px]">
                      {draft.greeting}
                    </span>
                  )}
                </div>
                {greetingOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3">
                <Input
                  value={draft?.greeting || ''}
                  onChange={(e) => onUpdateDraft({ greeting: e.target.value })}
                  placeholder="z.B. Sehr geehrte Damen und Herren,"
                />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Snippets Drop Zone */}
        <Droppable droppableId="email-body">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "min-h-[200px] rounded-lg transition-colors",
                snapshot.isDraggingOver 
                  ? "bg-indigo-50 ring-2 ring-indigo-200 ring-dashed" 
                  : "bg-transparent"
              )}
            >
              {sortedItems.length === 0 ? (
                <div className={cn(
                  "h-48 rounded-lg border-2 border-dashed flex flex-col items-center justify-center",
                  snapshot.isDraggingOver 
                    ? "border-indigo-400 bg-indigo-50" 
                    : "border-slate-200 bg-slate-50/50"
                )}>
                  <Mail className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    Snippets hierher ziehen
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    oder auf + klicken
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedItems.map((item, index) => {
                    const snippet = getSnippetById(item.snippet_id);
                    const isEditing = editingId === item.snippet_id;
                    const hasOverride = !!item.override_content;
                    const displayContent = item.override_content || snippet?.content || '';

                    if (!snippet) {
                      return (
                        <Card key={item.snippet_id} className="p-3 bg-red-50 border-red-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-red-600">
                              Snippet nicht gefunden (ID: {item.snippet_id})
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              onClick={() => onRemoveSnippet(item.snippet_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    }

                    return (
                      <Draggable
                        key={item.snippet_id}
                        draggableId={`email-${item.snippet_id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              snapshot.isDragging && "z-50"
                            )}
                          >
                            <Card className={cn(
                              "group transition-all duration-200",
                              snapshot.isDragging 
                                ? "shadow-xl ring-2 ring-indigo-500/30" 
                                : "hover:shadow-md",
                              hasOverride && "ring-1 ring-amber-200 bg-amber-50/30"
                            )}>
                              {/* Header */}
                              <div className="p-3 border-b bg-slate-50/50 flex items-center gap-2">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-slate-300 cursor-grab active:cursor-grabbing" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                                  {snippet.title}
                                </span>
                                {hasOverride && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
                                    Angepasst
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {hasOverride && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                      onClick={() => onResetSnippetOverride(item.snippet_id)}
                                      title="Zurücksetzen"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {!isEditing && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                      onClick={() => handleStartEdit(item)}
                                      title="Bearbeiten"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-red-500"
                                    onClick={() => onRemoveSnippet(item.snippet_id)}
                                    title="Entfernen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="p-4">
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <Textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="min-h-[150px] font-mono text-sm"
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                      >
                                        Abbrechen
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveEdit(item.snippet_id)}
                                      >
                                        Übernehmen
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="prose prose-sm prose-slate max-w-none">
                                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Signature */}
        <Collapsible open={signatureOpen} onOpenChange={setSignatureOpen}>
          <Card className="border-dashed">
            <CollapsibleTrigger asChild>
              <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Signatur</span>
                  {draft?.signature && !signatureOpen && (
                    <span className="text-sm text-slate-400 truncate max-w-[200px]">
                      {draft.signature.split('\n')[0]}...
                    </span>
                  )}
                </div>
                {signatureOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3">
                <Textarea
                  value={draft?.signature || ''}
                  onChange={(e) => onUpdateDraft({ signature: e.target.value })}
                  placeholder="Mit freundlichen Grüßen,&#10;Max Mustermann"
                  className="min-h-[80px]"
                />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}