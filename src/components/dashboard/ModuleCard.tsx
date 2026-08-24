import { useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: "blue" | "purple" | "amber" | "green";
  disabled?: boolean;
  onProcess: () => Promise<void> | void;
  output?: any; // To receive results from the parent
}

const colorClasses = {
  blue: { icon: "border-sky-400/20 bg-sky-400/10 text-sky-300", glow: "from-sky-400/10", dot: "bg-sky-400" },
  purple: { icon: "border-violet-400/20 bg-violet-400/10 text-violet-300", glow: "from-violet-400/10", dot: "bg-violet-400" },
  amber: { icon: "border-amber-400/20 bg-amber-400/10 text-amber-300", glow: "from-amber-400/10", dot: "bg-amber-400" },
  green: { icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", glow: "from-emerald-400/10", dot: "bg-emerald-400" },
};

const formatInlineMarkdown = (text: string): ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${part}-${index}`} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );

const FormattedSummary = ({ summary }: { summary: string }) => (
  <div className="space-y-3 text-sm leading-6 text-muted-foreground">
    {summary.split("\n").map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || /^[-*_]{3,}$/.test(trimmed)) return null;

      const heading = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (heading) {
        return (
          <h6 key={`heading-${index}`} className="pt-2 text-sm font-semibold text-foreground">
            {formatInlineMarkdown(heading[1])}
          </h6>
        );
      }

      const bullet = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
      if (bullet) {
        return (
          <div key={`bullet-${index}`} className="flex gap-2 pl-1">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{formatInlineMarkdown(bullet[1])}</span>
          </div>
        );
      }

      return <p key={`paragraph-${index}`}>{formatInlineMarkdown(trimmed)}</p>;
    })}
  </div>
);

const ModuleCard = ({ title, description, icon, color, disabled, onProcess, output }: ModuleCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await onProcess();
    } catch (error) {
      console.error(`Error processing ${title}:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Helper function to render output nicely
  const renderOutput = (outputData: any) => {
    if (!outputData) return null;

    // --- Handle API Errors ---
    if (typeof outputData === 'string' && outputData.toLowerCase().includes('error')) {
      return <p className="text-sm text-destructive">{outputData}</p>;
    }
    if (outputData.error) {
      return <p className="text-sm text-destructive">{outputData.error}</p>;
    }

    // --- Ingestion Output ---
    if (outputData.text) {
      return (
        <div>
          <h5 className="font-semibold text-sm mb-2 text-foreground">Extracted Text:</h5>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{outputData.text}</p>
        </div>
      );
    }
    
    // --- Preprocessing Output ---
    if (outputData.clean_text) {
        return (
          <div>
            <h5 className="font-semibold text-sm mb-2 text-foreground">Cleaned Text:</h5>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{outputData.clean_text}</p>
          </div>
        );
      }

    // --- Insight Extraction Output ---
    if (outputData.entities || outputData.keywords) {
      return (
        <div className="space-y-4">
          {outputData.keywords && outputData.keywords.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm mb-2 text-foreground">Keywords:</h5>
              <div className="flex flex-wrap gap-2">
                {outputData.keywords.map((keyword: string, index: number) => (
                  <span key={index} className="rounded-full border border-amber-400/15 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          {outputData.entities && outputData.entities.length > 0 && (
             <div>
              <h5 className="font-semibold text-sm mb-2 text-foreground">Entities:</h5>
              <div className="flex flex-wrap gap-2">
                {outputData.entities.map((entity: string | [string, string], index: number) => (
                  <span key={index} className="rounded-full border border-violet-400/15 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-200">
                    {Array.isArray(entity) ? entity[0] : entity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // --- Summarization Output ---
    if (outputData.summary) {
        return (
            <div>
              <h5 className="font-semibold text-sm mb-2 text-foreground">Summary:</h5>
              <FormattedSummary summary={outputData.summary} />
            </div>
          );
    }

    // --- Fallback for unknown formats ---
    return (
      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
        {JSON.stringify(outputData, null, 2)}
      </pre>
    );
  };

  return (
    <Card className="paperiq-glass group relative overflow-hidden rounded-[24px] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl hover:shadow-black/20">
      <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${colorClasses[color].glow} to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100`} />
      <CardHeader className="relative pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${colorClasses[color].icon}`}>{icon}</div>
          {output ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${disabled ? "bg-slate-600" : colorClasses[color].dot}`} />
              {disabled ? "Waiting" : "Ready"}
            </span>
          )}
          </div>
        <CardTitle className="text-lg font-semibold tracking-tight text-white">{title}</CardTitle>
        <CardDescription className="pt-1 text-sm leading-6 text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-4 pt-1">
        <Button
          onClick={handleProcess}
          disabled={disabled || isProcessing}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.055] text-sm font-medium text-white shadow-none transition-all hover:border-violet-400/35 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {disabled ? <LockKeyhole className="mr-2 h-3.5 w-3.5" /> : null}
              {output ? "Run again" : disabled ? "Complete previous step" : "Run analysis"}
              {!disabled ? <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /> : null}
            </>
          )}
        </Button>

        {/* ✅ Use the new renderOutput function */}
        {output && (
          <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-white/[0.07] bg-black/20 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-violet-300">Analysis result</h4>
            {renderOutput(output)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
