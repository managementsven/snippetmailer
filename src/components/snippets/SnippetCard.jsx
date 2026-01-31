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
import { Star, Eye, Edit, Trash2, MoreVertical, Calendar, FileText } from "lucide-react";
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
      <Card className="px-6 py-5 hover:shadow-2xl transition-all duration-300 group border-subtle bg-card rounded-2xl card-hover">
        <div className="flex items-start gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground line-clamp-1 tracking-tight mb-2">
                  {snippet.title}
                </h3>
                
                {/* Metadata Row */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground/70">
                  <span className="uppercase tracking-wider font-medium text-xs">
                    {snippet.language?.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(snippet.updated_date), 'dd.MM.yyyy')}
                  </span>
                  {snippet.version && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-xs font-mono">v{snippet.version}</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Actions - Visible on Hover */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9",
                    isFavorite ? "text-amber-400" : "text-muted-foreground hover:text-amber-400"
                  )}
                  onClick={onToggleFavorite}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {onView && (
                      <DropdownMenuItem onClick={onView} className="gap-2">
                        <Eye className="h-4 w-4" />
                        Vorschau
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive gap-2">
                          <Trash2 className="h-4 w-4" />
                          Archivieren
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tags & Categories */}
            {(snippetCategories.length > 0 || snippetTags.length > 0 || snippetCases.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {snippetCategories.map((cat, idx) => (
                  <Badge key={`cat-${idx}`} variant="secondary" className="text-xs px-2.5 py-1 font-medium">
                    {cat}
                  </Badge>
                ))}
                {snippetTags.map((tag, idx) => (
                  <Badge key={`tag-${idx}`} variant="outline" className="text-xs px-2.5 py-1 font-medium">
                    {tag}
                  </Badge>
                ))}
                {snippetCases.map((caseName, idx) => (
                  <Badge key={`case-${idx}`} className="text-xs px-2.5 py-1 font-medium bg-primary/15 text-primary border-primary/30">
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

  // Grid Card View - Enhanced Readability
  return (
    <Card className="p-7 hover:shadow-2xl transition-all duration-300 group border-subtle bg-card rounded-2xl flex flex-col h-full card-hover">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-foreground line-clamp-2 leading-tight tracking-tight mb-2">
              {snippet.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
              <span className="uppercase tracking-wider font-medium">
                {snippet.language?.toUpperCase()}
              </span>
              {snippet.version && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="font-mono">v{snippet.version}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isFavorite && "opacity-100 text-amber-400"
          )}
          onClick={onToggleFavorite}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>
      </div>

      {/* Content Preview - Enhanced Spacing */}
      <div className="flex-1 mb-5">
        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
          {snippet.content?.substring(0, 180)}
          {snippet.content?.length > 180 && "..."}
        </p>
      </div>

      {/* Tags & Categories */}
      {(snippetCategories.length > 0 || snippetTags.length > 0 || snippetCases.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-border/50">
          {snippetCategories.slice(0, 2).map((cat, idx) => (
            <Badge key={`cat-${idx}`} variant="secondary" className="text-xs px-2.5 py-1 font-medium">
              {cat}
            </Badge>
          ))}
          {snippetTags.slice(0, 2).map((tag, idx) => (
            <Badge key={`tag-${idx}`} variant="outline" className="text-xs px-2.5 py-1 font-medium">
              {tag}
            </Badge>
          ))}
          {snippetCases.slice(0, 1).map((caseName, idx) => (
            <Badge key={`case-${idx}`} className="text-xs px-2.5 py-1 font-medium bg-primary/15 text-primary border-primary/30">
              {caseName}
            </Badge>
          ))}
          {(snippetCategories.length + snippetTags.length + snippetCases.length > 5) && (
            <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium">
              +{snippetCategories.length + snippetTags.length + snippetCases.length - 5}
            </Badge>
          )}
        </div>
      )}

      {/* Footer - Minimal Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(new Date(snippet.updated_date), 'dd.MM.yyyy')}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onView && (
              <DropdownMenuItem onClick={onView} className="gap-2">
                <Eye className="h-4 w-4" />
                Vorschau
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Bearbeiten
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive gap-2">
                  <Trash2 className="h-4 w-4" />
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