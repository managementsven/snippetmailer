import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, Eye, Edit, Trash2, MoreVertical, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function SnippetCard({
  snippet,
  categories = [],
  tags = [],
  cases = [],
  isFavorite,
  onToggleFavorite,
  onView,
  onEdit,
  onDelete,
  compact = false,
}) {
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name;
  const getTagName = (id) => tags.find(t => t.id === id)?.name;
  const getCaseName = (id) => cases.find(c => c.id === id)?.name;

  const snippetCategories = (snippet.categories || [])
    .map(id => getCategoryName(id))
    .filter(Boolean);
  
  const snippetTags = (snippet.tags || [])
    .map(id => getTagName(id))
    .filter(Boolean);
  
  const snippetCases = (snippet.cases || [])
    .map(id => getCaseName(id))
    .filter(Boolean);

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-lg transition-all duration-200 group border-border bg-card rounded-2xl">
        <div className="flex items-start gap-4">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground line-clamp-1">
                {snippet.title}
              </h3>
              
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-colors",
                    isFavorite ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
                  )}
                  onClick={onToggleFavorite}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {onView && (
                      <DropdownMenuItem onClick={onView}>
                        <Eye className="h-4 w-4 mr-2" />
                        Vorschau
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archivieren
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="uppercase tracking-wide font-medium">
                {snippet.language?.toUpperCase()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(snippet.updated_date), 'dd.MM.yyyy')}
              </span>
              {snippet.version && (
                <>
                  <span>•</span>
                  <span>v{snippet.version}</span>
                </>
              )}
            </div>

            {/* Tags & Categories */}
            {(snippetCategories.length > 0 || snippetTags.length > 0 || snippetCases.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {snippetCategories.map((cat, idx) => (
                  <Badge key={`cat-${idx}`} variant="secondary" className="text-xs px-2 py-0 h-5">
                    {cat}
                  </Badge>
                ))}
                {snippetTags.map((tag, idx) => (
                  <Badge key={`tag-${idx}`} variant="outline" className="text-xs px-2 py-0 h-5">
                    {tag}
                  </Badge>
                ))}
                {snippetCases.map((caseName, idx) => (
                  <Badge key={`case-${idx}`} className="text-xs px-2 py-0 h-5 bg-primary/10 text-primary border-primary/20">
                    {caseName}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Grid Card View
  return (
    <Card className="p-5 hover:shadow-xl transition-all duration-200 group border-border bg-card rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-foreground line-clamp-2 leading-tight">
          {snippet.title}
        </h3>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 transition-colors flex-shrink-0",
            isFavorite ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
          )}
          onClick={onToggleFavorite}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>
      </div>

      {/* Content Preview */}
      <div className="flex-1 mb-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {snippet.content?.substring(0, 150)}...
        </p>
      </div>

      {/* Tags & Categories */}
      {(snippetCategories.length > 0 || snippetTags.length > 0 || snippetCases.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {snippetCategories.slice(0, 2).map((cat, idx) => (
            <Badge key={`cat-${idx}`} variant="secondary" className="text-xs px-2 py-0.5 h-5">
              {cat}
            </Badge>
          ))}
          {snippetTags.slice(0, 2).map((tag, idx) => (
            <Badge key={`tag-${idx}`} variant="outline" className="text-xs px-2 py-0.5 h-5">
              {tag}
            </Badge>
          ))}
          {snippetCases.slice(0, 1).map((caseName, idx) => (
            <Badge key={`case-${idx}`} className="text-xs px-2 py-0.5 h-5 bg-primary/10 text-primary border-primary/20">
              {caseName}
            </Badge>
          ))}
          {(snippetCategories.length + snippetTags.length + snippetCases.length > 5) && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
              +{snippetCategories.length + snippetTags.length + snippetCases.length - 5}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="uppercase tracking-wide font-medium">
            {snippet.language?.toUpperCase()}
          </span>
          {snippet.version && (
            <>
              <span>•</span>
              <span>v{snippet.version}</span>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onView && (
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                Vorschau
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archivieren
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}