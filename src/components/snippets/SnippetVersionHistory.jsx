import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { History, RotateCcw, Eye, ChevronRight, User, Calendar, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function SnippetVersionHistory({
  open,
  onOpenChange,
  versions = [],
  currentSnippet,
  onRestore,
  isLoading = false,
}) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'preview'

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            Versionsverlauf: {currentSnippet?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-4 min-h-0">
          {/* Version List */}
          <div className="w-80 flex-shrink-0">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {/* Current Version */}
                <div
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-pointer transition-all",
                    !selectedVersion 
                      ? "border-indigo-500 bg-indigo-50" 
                      : "border-transparent hover:border-slate-200 bg-white"
                  )}
                  onClick={() => setSelectedVersion(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-emerald-500">Aktuell</Badge>
                    <span className="text-xs text-slate-500">v{currentSnippet?.version || 1}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {currentSnippet?.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    <span className="truncate">{currentSnippet?.last_modified_by || currentSnippet?.created_by}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {currentSnippet?.updated_date 
                        ? format(new Date(currentSnippet.updated_date), "dd.MM.yyyy HH:mm", { locale: de })
                        : '-'
                      }
                    </span>
                  </div>
                </div>

                {/* Previous Versions */}
                {sortedVersions.map((version) => (
                  <div
                    key={version.id}
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all",
                      selectedVersion?.id === version.id 
                        ? "border-indigo-500 bg-indigo-50" 
                        : "border-transparent hover:border-slate-200 bg-white"
                    )}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">
                        Version {version.version_number}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {version.title}
                    </p>
                    {version.change_note && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        "{version.change_note}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <User className="h-3 w-3" />
                      <span className="truncate">{version.changed_by}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(version.created_date), "dd.MM.yyyy HH:mm", { locale: de })}
                      </span>
                    </div>
                  </div>
                ))}

                {sortedVersions.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Keine früheren Versionen</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preview */}
          <div className="flex-1 border rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-700">
                  {selectedVersion 
                    ? `Version ${selectedVersion.version_number}` 
                    : 'Aktuelle Version'
                  }
                </span>
              </div>
              {selectedVersion && (
                <Button
                  size="sm"
                  onClick={() => onRestore(selectedVersion)}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Wiederherstellen
                </Button>
              )}
            </div>
            <ScrollArea className="h-[440px]">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedVersion?.title || currentSnippet?.title}
                </h2>
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>
                    {selectedVersion?.content || currentSnippet?.content}
                  </ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}