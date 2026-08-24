import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText,
  LogOut,
  Database,
  Settings,
  Lightbulb,
  FileSearch,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import FileUploadCard from "@/components/dashboard/FileUploadCard";
import ModuleCard from "@/components/dashboard/ModuleCard";
import {
  ingestFile,
  preprocessText,
  extractInsights,
  summarizeFile,
  logoutUser,
} from "@/api/paperiqApi";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ResultsState {
  ingestion?: any;
  preprocess?: any;
  extract?: {
    keywords?: string[];
    entities?: [string, string][];
  };
  summarize?: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [cleanText, setCleanText] = useState("");
  const [results, setResults] = useState<ResultsState>({});
  const [isVizOpen, setIsVizOpen] = useState(false);

  const extractResult = results.extract;

  // -------------------------------
  // ✅ FIXED KEYWORD SPLITTING LOGIC
  // -------------------------------
  const keywordData = useMemo(() => {
    if (!extractResult?.keywords) return [];

    const splitWords: string[] = [];

    extractResult.keywords.forEach((kw) => {
      const parts = kw.split(" ");
      parts.forEach((word) => {
        const w = word.trim().toLowerCase();
        if (w.length > 0) splitWords.push(w);
      });
    });

    const counts: Record<string, number> = {};
    splitWords.forEach((w) => {
      counts[w] = (counts[w] || 0) + 1;
    });

    return Object.entries(counts).map(([keyword, count]) => ({
      keyword,
      count,
    }));
  }, [extractResult]);

  // -------------------------------
  // Entity chart data
  // -------------------------------
  const entityData = useMemo(() => {
    if (!extractResult?.entities) return [];
    const counts: Record<string, number> = {};

    extractResult.entities.forEach((ent: [string, string]) => {
      const type = ent?.[1] || "UNKNOWN";
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
    }));
  }, [extractResult]);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setRawText("");
    setCleanText("");
    setResults({});
    toast.success(`File "${file.name}" uploaded successfully`);
  };

  const handleIngest = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Session expired, please log in again.");
      navigate("/login");
      return;
    }

    if (!uploadedFile) {
      toast.error("Please upload a file first.");
      return;
    }

    try {
      const res = await ingestFile(uploadedFile);
      setRawText(res.text);
      setResults((prev) => ({ ...prev, ingestion: res }));
      toast.success("Ingestion complete!");
    } catch (err) {
      console.error(err);
      toast.error("Error in ingestion module");
    }
  };

  const handlePreprocess = async () => {
    if (!rawText) {
      toast.error("Ingestion must be run first to generate raw text.");
      return;
    }
    try {
      const res = await preprocessText(rawText);
      setCleanText(res.clean_text);
      setResults((prev) => ({ ...prev, preprocess: res }));
      toast.success("Preprocessing complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Error in preprocessing module");
    }
  };

  const handleExtract = async () => {
    if (!cleanText) {
      toast.error("Preprocessing must be run first to generate clean text.");
      return;
    }
    try {
      const res = await extractInsights(cleanText);
      setResults((prev) => ({ ...prev, extract: res }));
      toast.success("Insight extraction complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Error in extraction module");
    }
  };

  const handleSummarize = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first.");
      return;
    }
    try {
      const res = await summarizeFile(uploadedFile);
      setResults((prev) => ({ ...prev, summarize: res }));
      toast.success("Summarization complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Error in summarization module");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">PaperIQ</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Upload and process your documents with AI-powered modules
          </p>
        </div>

        <div className="mb-8">
          <FileUploadCard onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <ModuleCard
            title="Ingestion Module"
            description="Extract and structure content from your documents"
            icon={<Database className="h-6 w-6" />}
            color="blue"
            disabled={!uploadedFile}
            onProcess={handleIngest}
            output={results.ingestion}
          />

          <ModuleCard
            title="Preprocessing Module"
            description="Clean and prepare data for analysis"
            icon={<Settings className="h-6 w-6" />}
            color="purple"
            disabled={!rawText}
            onProcess={handlePreprocess}
            output={results.preprocess}
          />

          <ModuleCard
            title="Insight Extraction"
            description="Extract key insights and patterns from your data"
            icon={<Lightbulb className="h-6 w-6" />}
            color="amber"
            disabled={!cleanText}
            onProcess={handleExtract}
            output={results.extract}
          />

          <ModuleCard
            title="Summarization Module"
            description="Generate concise summaries of your documents"
            icon={<FileSearch className="h-6 w-6" />}
            color="green"
            disabled={!uploadedFile}
            onProcess={handleSummarize}
            output={results.summarize}
          />

          {/* Visualization Module */}
          <ModuleCard
            title="Visualization Module"
            description="Visualize extracted keywords & entities"
            icon={<BarChart3 className="h-6 w-6" />}
            color="green"
            disabled={!results.extract}
            onProcess={() => setIsVizOpen(true)}
            output={null}
          />
        </div>

        {/* Visualization Popup */}
        <Dialog open={isVizOpen} onOpenChange={setIsVizOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Insights Visualization</DialogTitle>
            </DialogHeader>

            {!extractResult ? (
              <p className="text-sm text-muted-foreground">
                Run the Insight Extraction module first.
              </p>
            ) : (
              <div className="space-y-10">
                {/* -------------------- */}
                {/* TOP 10 KEYWORDS CLEAN */}
                {/* -------------------- */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Top 10 Keywords</h3>

                  <div className="h-96 border p-4 rounded-md bg-white">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={keywordData
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 10)
                          .map((item, index) => ({
                            ...item,
                            index: index + 1,
                          }))}
                        margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="index"
                          tick={{ fontSize: 12 }}
                          label={{ value: "Rank", position: "insideBottom", offset: -5 }}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                          formatter={(value, name, props: any) => {
                            const keyword = props?.payload?.keyword;
                            return [`Count: ${value}`, `Keyword: ${keyword}`];
                          }}
                        />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    Hover over bars to see actual keywords.
                  </div>
                </div>

                {/* -------------------- */}
                {/* ENTITY CHART */}
                {/* -------------------- */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Entities by Type</h3>

                  <div className="h-80 border p-4 rounded-md bg-white">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={entityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Dashboard;
