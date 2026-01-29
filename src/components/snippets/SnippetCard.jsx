import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GripVertical, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function SnippetCard({
  snippet,
  categories = [],
  tags = [],
  cases = [],
  isFavorite = false,
  onToggleFavorite,
  onView,
  onEdit,
  onDelete,
  draggable = false,
  compact = false,
  showActions = true,
  dragHandleProps,
  isDragging = false,
}) {
  const snippetCategories = categories.filter(c => snippet.categories?.includes(c.id));
  const snippetTags = tags.filter(t => snippet.tags?.includes(t.id));
  const snippetCases = cases.filter(c => snippet.cases?.includes(c.id));

  const statusColors = {
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    archived: "bg-slate-100 text-slate-500 border-slate-200",
  };

  const languageLabels = {
    de: "DE",
    en: "EN",
  };

  return (
    <Card className={cn(
      "group relative transition-all duration-200",
      isDragging ? "shadow-xl ring-2 ring-indigo-500/20 rotate-1" : "hover:shadow-md",
      compact ? "p-3" : "p-4",
      snippet.status === 'archived' && "opacity-60"
    )}>
      <div className="flex gap-3">
        {draggable && (
          <div 
            {...dragHandleProps}
            className="flex-shrink-0 flex items-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "font-semibold text-slate-900 truncate",
                  compact ? "text-sm" : "text-base"
                )}>
                  {snippet.title}
                </h3>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {languageLabels[snippet.language]}
                </Badge>
              </div>
              
              {/* Status & Meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border", statusColors[snippet.status])}>
                  {snippet.status === 'draft' ? 'Entwurf' : snippet.status === 'published' ? 'Veröffentlicht' : 'Archiviert'}
                </Badge>
                {!compact && snippet.version > 1 && (
                  <span className="text-[10px] text-slate-400">v{snippet.version}</span>
                )}
              </div>
            </div>

            {/* Favorite */}
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 flex-shrink-0",
                  isFavorite ? "text-amber-500" : "text-slate-300 opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(snippet);
                }}
              >
                <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </Button>
            )}
          </div>

          {/* Content Preview */}
          {!compact && (
            <div className="text-sm text-slate-600 line-clamp-2 mb-3 prose prose-sm prose-slate max-w-none">
              <ReactMarkdown>
                {snippet.content?.slice(0, 150) + (snippet.content?.length > 150 ? '...' : '')}
              </ReactMarkdown>
            </div>
          )}

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {snippetCategories.slice(0, 2).map(cat => (
              <Badge 
                key={cat.id} 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 h-5"
                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
              >
                {cat.name}
              </Badge>
            ))}
            {snippetCases.slice(0, 2).map(c => (
              <Badge 
                key={c.id} 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-700"
              >
                {c.name}
              </Badge>
            ))}
            {snippetTags.slice(0, 2).map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 h-5"
              >
                {tag.name}
              </Badge>
            ))}
            {(snippetCategories.length + snippetCases.length + snippetTags.length) > 6 && (
              <span className="text-[10px] text-slate-400">
                +{snippetCategories.length + snippetCases.length + snippetTags.length - 6}
              </span>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
              {onView && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onView(snippet)}>
                  <Eye className="h-3 w-3 mr-1" />
                  Ansehen
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEdit(snippet)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Bearbeiten
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(snippet)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Löschen
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}