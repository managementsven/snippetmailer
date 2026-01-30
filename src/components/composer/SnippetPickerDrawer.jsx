import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Snippet Picker als Drawer - kompakt, mit Filter und Suche
 */
export default function SnippetPickerDrawer({
  open,
  onOpenChange,
  snippets = [],
  categories = [],
  tags = [],
  cases = [],
  onAddSnippet,
  language = 'de',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');

  const filteredSnippets = useMemo(() => {
    let result = snippets.filter(s => s.status === 'published' && s.language === language);

    if (selectedCategory !== 'all') {
      result = result.filter(s => s.categories?.includes(selectedCategory));
    }

    if (selectedTag !== 'all') {
      result = result.filter(s => s.tags?.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title?.toLowerCase().includes(q) ||
        s.content?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [snippets, language, selectedCategory, selectedTag, searchQuery]);

  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '';
  const getTagName = (id) => tags.find(t => t.id === id)?.name || '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[400px] sm:w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle>Snippet hinzufügen</SheetTitle>
          <SheetDescription>
            Wähle ein Snippet aus der Bibliothek
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border space-y-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Tags</SelectItem>
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Snippet List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-2">
            {filteredSnippets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Keine Snippets gefunden
              </div>
            ) : (
              filteredSnippets.map(snippet => (
                <div
                  key={snippet.id}
                  className={cn(
                    "p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors group cursor-pointer"
                  )}
                  onClick={() => {
                    onAddSnippet(snippet);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm text-foreground flex-1">
                      {snippet.title}
                    </h4>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSnippet(snippet);
                        onOpenChange(false);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {snippet.content?.substring(0, 120)}...
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {snippet.categories?.map(catId => {
                      const name = getCategoryName(catId);
                      return name ? (
                        <Badge key={catId} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {name}
                        </Badge>
                      ) : null;
                    })}
                    {snippet.tags?.slice(0, 2).map(tagId => {
                      const name = getTagName(tagId);
                      return name ? (
                        <Badge key={tagId} variant="outline" className="text-[10px] px-1.5 py-0">
                          {name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            {filteredSnippets.length} Snippet{filteredSnippets.length !== 1 ? 's' : ''} gefunden
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}