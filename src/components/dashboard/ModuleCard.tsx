import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "amber" | "green";
  disabled?: boolean;
  onProcess: () => Promise<void>;
  output?: any; // To receive results from the parent
}

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-600",
  purple: "bg-purple-500/10 text-purple-600",
  amber: "bg-amber-500/10 text-amber-600",
  green: "bg-green-500/10 text-green-600",
};

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
                  <span key={index} className="px-2 py-1 bg-amber-500/10 text-amber-700 text-xs font-medium rounded-full">
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
                {outputData.entities.map((entity: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-purple-500/10 text-purple-700 text-xs font-medium rounded-full">
                    {entity}
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
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{outputData.summary}</p>
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
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleProcess}
          disabled={disabled || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Run Module"
          )}
        </Button>

        {/* ✅ Use the new renderOutput function */}
        {output && (
          <div className="mt-4 p-4 bg-secondary rounded-lg max-h-60 overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-2">Output:</h4>
            {renderOutput(output)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleCard;