import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X, Star, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SnippetFilters({
  searchQuery,
  setSearchQuery,
  language,
  setLanguage,
  status,
  setStatus,
  selectedCategories,
  setSelectedCategories,
  selectedTags,
  setSelectedTags,
  selectedCases,
  setSelectedCases,
  showFavoritesOnly,
  setShowFavoritesOnly,
  categories = [],
  tags = [],
  cases = [],
  onReset,
  compact = false,
}) {
  const hasActiveFilters = 
    language !== 'all' || 
    status !== 'published' || 
    selectedCategories.length > 0 || 
    selectedTags.length > 0 || 
    selectedCases.length > 0 ||
    showFavoritesOnly;

  const activeFilterCount = [
    language !== 'all',
    status !== 'published',
    selectedCategories.length > 0,
    selectedTags.length > 0,
    selectedCases.length > 0,
    showFavoritesOnly,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Snippets durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-input border-border text-base"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Language */}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-28 h-10 text-sm bg-card border-border">
            <SelectValue placeholder="Sprache" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36 h-10 text-sm bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="published">Veröffentlicht</SelectItem>
            <SelectItem value="draft">Entwurf</SelectItem>
            <SelectItem value="archived">Archiviert</SelectItem>
          </SelectContent>
        </Select>

        {/* Favorites Toggle */}
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-10 gap-2 px-4",
            showFavoritesOnly && "bg-amber-500 hover:bg-amber-600 text-white"
          )}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
          Favoriten
        </Button>

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-2 px-4">
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs bg-primary/20 text-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              {/* Categories */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2.5 block">Kategorien</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                          }
                        }}
                      />
                      <label 
                        htmlFor={`cat-${cat.id}`} 
                        className="text-sm text-foreground/80 cursor-pointer flex items-center gap-2"
                      >
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cases */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2.5 block">Fehlerbilder</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {cases.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`case-${c.id}`}
                        checked={selectedCases.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCases([...selectedCases, c.id]);
                          } else {
                            setSelectedCases(selectedCases.filter(id => id !== c.id));
                          }
                        }}
                      />
                      <label htmlFor={`case-${c.id}`} className="text-sm text-foreground/80 cursor-pointer">
                        {c.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2.5 block">Tags</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {tags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs",
                        selectedTags.includes(tag.id) && "bg-primary"
                      )}
                      onClick={() => {
                        if (selectedTags.includes(tag.id)) {
                          setSelectedTags(selectedTags.filter(id => id !== tag.id));
                        } else {
                          setSelectedTags([...selectedTags, tag.id]);
                        }
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground hover:text-foreground px-4"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {(selectedCategories.length > 0 || selectedTags.length > 0 || selectedCases.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {selectedCategories.map(id => {
            const cat = categories.find(c => c.id === id);
            return cat ? (
              <Badge 
                key={id} 
                variant="secondary" 
                className="text-xs gap-1.5 pr-1.5 h-7"
                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
              >
                {cat.name}
                <button 
                  onClick={() => setSelectedCategories(selectedCategories.filter(cid => cid !== id))}
                  className="ml-1 hover:bg-black/10 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
          {selectedCases.map(id => {
            const c = cases.find(cs => cs.id === id);
            return c ? (
              <Badge key={id} variant="secondary" className="text-xs gap-1.5 pr-1.5 h-7 bg-primary/15 text-primary">
                {c.name}
                <button 
                  onClick={() => setSelectedCases(selectedCases.filter(cid => cid !== id))}
                  className="ml-1 hover:bg-black/10 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
          {selectedTags.map(id => {
            const tag = tags.find(t => t.id === id);
            return tag ? (
              <Badge key={id} variant="outline" className="text-xs gap-1.5 pr-1.5 h-7">
                {tag.name}
                <button 
                  onClick={() => setSelectedTags(selectedTags.filter(tid => tid !== id))}
                  className="ml-1 hover:bg-black/10 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}