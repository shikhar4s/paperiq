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
  Clock3,
  Layers3,
  Sparkles,
  Tags,
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
  DialogDescription,
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
  PieChart,
  Pie,
  Cell,
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

const ENTITY_COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9"];
const ENTITY_LABELS: Record<string, string> = {
  PERSON: "People",
  ORG: "Organizations",
  GPE: "Locations",
  LOC: "Places",
  DATE: "Dates",
  CARDINAL: "Numbers",
  MONEY: "Amounts",
  PERCENT: "Percentages",
  NORP: "Groups",
  PRODUCT: "Products",
  EVENT: "Events",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [cleanText, setCleanText] = useState("");
  const [results, setResults] = useState<ResultsState>({});
  const [isVizOpen, setIsVizOpen] = useState(false);

  const extractResult = results.extract;

  const keywordData = useMemo(() => {
    if (!extractResult?.keywords) return [];
    const documentText = (cleanText || rawText).toLowerCase();

    return extractResult.keywords
      .map((keyword, index) => {
        const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matches = documentText.match(new RegExp(escapedKeyword, "g"));
        return { keyword, count: matches?.length || 1, rank: index + 1 };
      })
      .sort((first, second) => second.count - first.count || first.rank - second.rank)
      .slice(0, 10);
  }, [extractResult?.keywords, cleanText, rawText]);

  const entityData = useMemo(() => {
    if (!extractResult?.entities) return [];
    const counts: Record<string, number> = {};

    extractResult.entities.forEach((ent: [string, string]) => {
      const type = ent?.[1] || "UNKNOWN";
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([type, count]) => ({ type, label: ENTITY_LABELS[type] || type, count }))
      .sort((first, second) => second.count - first.count);
  }, [extractResult?.entities]);

  const wordCount = (cleanText || rawText).trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));

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
            description="Explore document themes, entity patterns, and reading metrics"
            icon={<BarChart3 className="h-6 w-6" />}
            color="green"
            disabled={!results.extract}
            onProcess={() => setIsVizOpen(true)}
            output={null}
          />
        </div>

        {/* Visualization Popup */}
        <Dialog open={isVizOpen} onOpenChange={setIsVizOpen}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto border-0 bg-slate-50 p-0 sm:rounded-2xl">
            <DialogHeader className="border-b border-slate-200 bg-white px-6 py-6 text-left sm:px-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                <Sparkles className="h-4 w-4" />
                Document intelligence
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                Insights dashboard
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm text-slate-500">
                {uploadedFile?.name || "Your document"} · An interactive overview of key themes,
                recognized entities, and document complexity.
              </DialogDescription>
            </DialogHeader>

            {!extractResult ? (
              <p className="px-8 py-8 text-sm text-muted-foreground">
                Run the Insight Extraction module first.
              </p>
            ) : (
              <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Document words", value: wordCount.toLocaleString(), icon: FileText, color: "text-indigo-600", background: "bg-indigo-50" },
                    { label: "Reading time", value: `${readingMinutes} min`, icon: Clock3, color: "text-teal-600", background: "bg-teal-50" },
                    { label: "Key themes", value: extractResult.keywords?.length || 0, icon: Tags, color: "text-amber-600", background: "bg-amber-50" },
                    { label: "Entities found", value: extractResult.entities?.length || 0, icon: Layers3, color: "text-fuchsia-600", background: "bg-fuchsia-50" },
                  ].map(({ label, value, icon: Icon, color, background }) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className={`mb-3 inline-flex rounded-lg p-2 ${background}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
                      <p className="mt-1 text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900">Top document themes</h3>
                    <p className="mt-1 text-xs text-slate-500">Ranked by actual appearances throughout the document.</p>

                    {keywordData.length ? (
                      <div className="mt-5 h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={keywordData} layout="vertical" margin={{ top: 0, right: 18, left: 8, bottom: 0 }}>
                            <defs>
                              <linearGradient id="paperiqKeywordGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                            <YAxis type="category" dataKey="keyword" width={125} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
                            <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(value: number) => [`${value} mention${value === 1 ? "" : "s"}`, "Frequency"]} />
                            <Bar dataKey="count" fill="url(#paperiqKeywordGradient)" radius={[0, 5, 5, 0]} maxBarSize={22} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-12 text-center text-sm text-slate-500">No themes were detected in this document.</p>
                    )}
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900">Entity distribution</h3>
                    <p className="mt-1 text-xs text-slate-500">How recognized information is categorized.</p>

                    {entityData.length ? (
                      <>
                        <div className="mt-2 h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={entityData} dataKey="count" nameKey="label" innerRadius={52} outerRadius={76} paddingAngle={3} stroke="none">
                                {entityData.map((item, index) => (
                                  <Cell key={item.type} fill={ENTITY_COLORS[index % ENTITY_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {entityData.slice(0, 6).map((item, index) => (
                            <div key={item.type} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 text-slate-600">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ENTITY_COLORS[index % ENTITY_COLORS.length] }} />
                                {item.label}
                              </span>
                              <span className="font-semibold text-slate-900">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="py-12 text-center text-sm text-slate-500">No named entities were detected.</p>
                    )}
                  </section>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">Extracted entities</h3>
                  <p className="mt-1 text-xs text-slate-500">People, organizations, places, and other notable references.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {extractResult.entities?.length ? extractResult.entities.slice(0, 24).map(([name, type], index) => (
                      <span key={`${name}-${type}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {name}
                        <span className="text-slate-400">{ENTITY_LABELS[type] || type}</span>
                      </span>
                    )) : (
                      <span className="text-sm text-slate-500">Run insight extraction to discover document entities.</span>
                    )}
                  </div>
                </section>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Dashboard;
