import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Copy, 
  FileDown, 
  Check, 
  Mail, 
  AlertCircle,
  FileText
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ComposerPreview({
  draft,
  snippets = [],
  onCopyPlainText,
  onCopyHtml,
  onDownloadEml,
  missingSnippets = [],
}) {
  const [copied, setCopied] = React.useState(false);

  const getSnippetById = (id) => snippets.find(s => s.id === id);

  const getEmailContent = () => {
    const parts = [];
    
    if (draft?.greeting) {
      parts.push(draft.greeting);
      parts.push('');
    }

    const sortedItems = [...(draft?.snippet_items || [])].sort((a, b) => a.order - b.order);
    
    sortedItems.forEach(item => {
      const snippet = getSnippetById(item.snippet_id);
      if (snippet) {
        const content = item.override_content || snippet.content;
        parts.push(content);
        parts.push('');
      }
    });

    if (draft?.signature) {
      parts.push(draft.signature);
    }

    return parts.join('\n');
  };

  const handleCopy = async (format = 'plain') => {
    try {
      const content = getEmailContent();
      
      if (format === 'plain') {
        // Convert markdown to plain text
        const plainText = content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
        
        await navigator.clipboard.writeText(plainText);
      } else {
        // For HTML, we'd need to convert markdown to HTML
        const plainText = content;
        await navigator.clipboard.writeText(plainText);
      }
      
      setCopied(true);
      toast.success('In Zwischenablage kopiert');
      setTimeout(() => setCopied(false), 2000);
      
      if (onCopyPlainText && format === 'plain') {
        onCopyPlainText();
      } else if (onCopyHtml && format === 'html') {
        onCopyHtml();
      }
    } catch (err) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const emailContent = getEmailContent();
  const hasContent = draft?.subject || emailContent.trim();

  return (
    <div className="h-full flex flex-col bg-[hsl(222,15%,12%)]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/30">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-Mail Vorschau</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy('plain')}
            disabled={!hasContent}
            className="gap-1.5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Kopieren
          </Button>
          {onDownloadEml && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadEml}
              disabled={!hasContent}
              className="gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              .eml
            </Button>
          )}
        </div>
      </div>

      {/* Missing Snippets Warning */}
      {missingSnippets.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600">
                Einige Snippets sind nicht mehr verfügbar
              </p>
              <ul className="mt-1 text-xs text-amber-600/80">
                {missingSnippets.map(id => (
                  <li key={id}>• ID: {id}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {hasContent ? (
            <div className="max-w-2xl mx-auto">
              {/* Email Header */}
              <div className="mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="font-medium">Betreff:</span>
                </div>
                <p className={cn(
                  "text-base font-medium",
                  draft?.subject ? "text-foreground" : "text-muted-foreground italic"
                )}>
                  {draft?.subject || 'Kein Betreff'}
                </p>
              </div>

              {/* Email Body */}
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                {draft?.greeting && (
                  <p className="text-foreground">{draft.greeting}</p>
                )}

                {(() => {
                  const sortedItems = [...(draft?.snippet_items || [])].sort((a, b) => a.order - b.order);
                  
                  return sortedItems.map(item => {
                    const snippet = getSnippetById(item.snippet_id);
                    if (!snippet) return null;
                    
                    const content = item.override_content || snippet.content;
                    return (
                      <div key={item.snippet_id} className="mb-4">
                        <ReactMarkdown>{content}</ReactMarkdown>
                      </div>
                    );
                  });
                })()}

                {draft?.signature && (
                  <div className="mt-6 pt-5 border-t border-border/50">
                    <p className="whitespace-pre-line text-muted-foreground/80 leading-relaxed">{draft.signature}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium text-foreground/70">Keine Vorschau verfügbar</p>
              <p className="text-xs mt-1.5 text-muted-foreground/60">Füge Snippets hinzu, um die E-Mail zu sehen</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}