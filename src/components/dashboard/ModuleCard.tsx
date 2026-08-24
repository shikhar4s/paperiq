import { useState, type ReactNode } from "react";
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
  blue: { icon: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300", dot: "bg-cyan-400", number: "01" },
  purple: { icon: "border-violet-400/20 bg-violet-500/10 text-violet-300", dot: "bg-violet-400", number: "02" },
  amber: { icon: "border-amber-400/20 bg-amber-400/10 text-amber-300", dot: "bg-amber-400", number: "03" },
  green: { icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-400", number: "04" },
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
                  <span key={index} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
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
                  <span key={index} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
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
    <article className="group relative border-b border-white/[0.07] bg-[#111827]/70 transition-colors duration-200 last:border-b-0 hover:bg-[#151e31]">
      <div className="grid gap-4 px-4 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:px-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${colorClasses[color].icon}`}>{icon}</div>

        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Step {colorClasses[color].number}</span>
            {output ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${disabled ? "bg-[#c6c0b5]" : colorClasses[color].dot}`} />
                {disabled ? "Waiting" : "Ready"}
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{description}</p>
        </div>

        <Button
          onClick={handleProcess}
          disabled={disabled || isProcessing}
          className="h-10 w-full shrink-0 rounded-full border border-white/10 bg-white/[0.045] px-4 text-xs font-semibold text-slate-200 shadow-none transition-all hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {disabled ? <LockKeyhole className="mr-2 h-3.5 w-3.5" /> : null}
              {output ? "Run again" : disabled ? "Locked" : "Run module"}
              {!disabled ? <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /> : null}
            </>
          )}
        </Button>
      </div>

      {output ? (
        <div className="mx-4 mb-5 max-h-80 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/15 p-4 sm:ml-[5.25rem] sm:mr-5">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.17em] text-violet-300">Module output</h4>
          {renderOutput(output)}
        </div>
      ) : null}
    </article>
  );
};

export default ModuleCard;
