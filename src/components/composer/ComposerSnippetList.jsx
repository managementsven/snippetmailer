import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Star, GripVertical, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable, Droppable } from "@hello-pangea/dnd";

export default function ComposerSnippetList({
  snippets = [],
  categories = [],
  tags = [],
  cases = [],
  favorites = [],
  onAddSnippet,
  isLoading = false,
}) {
  const getFavoriteIds = () => favorites.map(f => f.snippet_id);
  const favoriteIds = getFavoriteIds();

  const getSnippetMeta = (snippet) => {
    const cats = categories.filter(c => snippet.categories?.includes(c.id));
    const snippetCases = cases.filter(c => snippet.cases?.includes(c.id));
    return { cats, cases: snippetCases };
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Keine Snippets gefunden</p>
        <p className="text-xs mt-1">Versuche andere Filter</p>
      </div>
    );
  }

  return (
    <Droppable droppableId="snippet-library" isDropDisabled={true}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="space-y-2 p-2"
        >
          {snippets.map((snippet, index) => {
            const { cats, cases: snippetCases } = getSnippetMeta(snippet);
            const isFavorite = favoriteIds.includes(snippet.id);

            return (
              <Draggable
                key={snippet.id}
                draggableId={`library-${snippet.id}`}
                index={index}
              >
                {(provided, snapshot) => (
                  <>
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "group relative",
                        snapshot.isDragging && "z-50"
                      )}
                    >
                      <Card className={cn(
                        "p-3 cursor-grab active:cursor-grabbing transition-all duration-200",
                        snapshot.isDragging 
                          ? "shadow-xl ring-2 ring-indigo-500/30 rotate-2" 
                          : "hover:shadow-md hover:border-indigo-200"
                      )}>
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-slate-900 truncate">
                                {snippet.title}
                              </h4>
                              {isFavorite && (
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                              )}
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-auto flex-shrink-0">
                                {snippet.language?.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                              {snippet.content?.replace(/[#*_`]/g, '').slice(0, 100)}...
                            </p>
                            <div className="flex items-center gap-1 flex-wrap">
                              {cats.slice(0, 2).map(cat => (
                                <Badge 
                                  key={cat.id}
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-4"
                                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                >
                                  {cat.name}
                                </Badge>
                              ))}
                              {snippetCases.slice(0, 1).map(c => (
                                <Badge 
                                  key={c.id}
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-4 bg-orange-50 text-orange-700"
                                >
                                  {c.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddSnippet(snippet);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    </div>
                    {snapshot.isDragging && (
                      <Card className="p-3 border-2 border-dashed border-slate-200 bg-slate-50">
                        <div className="flex items-start gap-2 opacity-50">
                          <GripVertical className="h-4 w-4 text-slate-300 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-900 truncate">
                              {snippet.title}
                            </h4>
                          </div>
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}