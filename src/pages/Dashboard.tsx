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
  FileStack,
  ArrowUpRight,
  CheckCircle2,
  UserRound,
  Zap,
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
  const completedSteps = [results.ingestion, results.preprocess, results.extract, results.summarize].filter(Boolean).length;
  const userName = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}").name?.split(" ")[0] || "there";
    } catch {
      return "there";
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
    setRawText("");
    setCleanText("");
    setResults({});
    if (file) {
      toast.success(`File "${file.name}" uploaded successfully`);
    }
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
    <div className="relative min-h-screen overflow-hidden bg-[#090d19]">
      <div aria-hidden="true" className="paperiq-grid pointer-events-none fixed inset-0 opacity-45" />
      <div aria-hidden="true" className="pointer-events-none fixed left-[-14rem] top-[-15rem] h-[38rem] w-[38rem] rounded-full bg-violet-600/10 blur-[140px]" />
      <div aria-hidden="true" className="pointer-events-none fixed bottom-[-18rem] right-[-14rem] h-[35rem] w-[35rem] rounded-full bg-cyan-500/[0.07] blur-[140px]" />

      <header className="sticky top-0 z-30 border-b border-white/[0.075] bg-[#090d19]/80 backdrop-filter backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
              <FileStack className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">PaperIQ</h1>
              <p className="hidden text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:block">Document intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI online
            </span>
            <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 sm:flex">
              <UserRound className="h-4 w-4" />
            </span>
            <Button variant="ghost" onClick={handleLogout} className="h-9 rounded-xl border border-white/[0.08] px-3 text-slate-300 hover:bg-white/[0.07] hover:text-white">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-6 sm:pt-12 lg:px-8">
        <section className="relative mb-8 overflow-hidden rounded-[30px] border border-white/[0.08] bg-gradient-to-br from-[#17142d] via-[#121429] to-[#101c27] px-6 py-8 sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute right-[-3rem] top-[-5rem] h-64 w-64 rounded-full bg-violet-500/15 blur-[80px]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-5rem] right-[18%] h-44 w-44 rounded-full bg-teal-400/10 blur-[65px]" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                <Sparkles className="h-3.5 w-3.5" />
                Your intelligent document workspace
              </span>
              <h2 className="text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
                Welcome back, <span className="paperiq-gradient-text">{userName}.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-[15px]">
                Upload a document, uncover its important ideas, and turn information overload into answers you can use.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.09] bg-black/20 px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{completedSteps}/4 steps complete</p>
                <p className="mt-0.5 text-xs text-slate-400">{uploadedFile ? "Analysis in progress" : "Upload a document to begin"}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <FileUploadCard onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />

          <section className="paperiq-glass rounded-[28px] p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Your workflow</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">From file to insight</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </div>

            <div className="space-y-3">
              {[
                { label: "Upload your document", complete: Boolean(uploadedFile) },
                { label: "Extract and clean the text", complete: Boolean(results.preprocess) },
                { label: "Discover themes and entities", complete: Boolean(results.extract) },
                { label: "Generate a complete summary", complete: Boolean(results.summarize) },
              ].map(({ label, complete }, index) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-3">
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-600 text-[9px] text-slate-400">{index + 1}</span>
                  )}
                  <span className={`text-sm ${complete ? "text-slate-200" : "text-slate-400"}`}>{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.17em] text-violet-300">Analysis toolkit</p>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Your processing modules</h3>
          </div>
          <p className="text-xs text-slate-400">Follow the workflow or jump straight to a summary.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ModuleCard
            title="Ingestion Module"
            description="Read every page and capture the original content without losing context."
            icon={<Database className="h-6 w-6" />}
            color="blue"
            disabled={!uploadedFile}
            onProcess={handleIngest}
            output={results.ingestion}
          />

          <ModuleCard
            title="Preprocessing Module"
            description="Remove extraction noise while preserving meaningful names, dates, and details."
            icon={<Settings className="h-6 w-6" />}
            color="purple"
            disabled={!rawText}
            onProcess={handlePreprocess}
            output={results.preprocess}
          />

          <ModuleCard
            title="Insight Extraction"
            description="Reveal important themes, people, organizations, and recurring patterns."
            icon={<Lightbulb className="h-6 w-6" />}
            color="amber"
            disabled={!cleanText}
            onProcess={handleExtract}
            output={results.extract}
          />

          <ModuleCard
            title="Summarization Module"
            description="Get a complete, structured AI summary that covers the entire document."
            icon={<FileSearch className="h-6 w-6" />}
            color="green"
            disabled={!uploadedFile}
            onProcess={handleSummarize}
            output={results.summarize}
          />

          {/* Visualization Module */}
          <ModuleCard
            title="Visualization Module"
            description="Explore beautiful charts, reading metrics, and your document’s key relationships."
            icon={<BarChart3 className="h-6 w-6" />}
            color="green"
            disabled={!results.extract}
            onProcess={() => setIsVizOpen(true)}
            output={null}
          />
        </div>

        {/* Visualization Popup */}
        <Dialog open={isVizOpen} onOpenChange={setIsVizOpen}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto border border-white/10 bg-[#0c1120] p-0 text-white shadow-2xl shadow-black/50 sm:rounded-[28px]">
            <DialogHeader className="border-b border-white/[0.08] bg-gradient-to-r from-violet-500/[0.09] to-cyan-500/[0.04] px-6 py-6 text-left sm:px-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                <Sparkles className="h-4 w-4" />
                Document intelligence
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
                Insights dashboard
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm text-slate-400">
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
                    { label: "Document words", value: wordCount.toLocaleString(), icon: FileText, color: "text-violet-300", background: "bg-violet-400/10" },
                    { label: "Reading time", value: `${readingMinutes} min`, icon: Clock3, color: "text-teal-300", background: "bg-teal-400/10" },
                    { label: "Key themes", value: extractResult.keywords?.length || 0, icon: Tags, color: "text-amber-300", background: "bg-amber-400/10" },
                    { label: "Entities found", value: extractResult.entities?.length || 0, icon: Layers3, color: "text-fuchsia-300", background: "bg-fuchsia-400/10" },
                  ].map(({ label, value, icon: Icon, color, background }) => (
                    <div key={label} className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-4">
                      <div className={`mb-3 inline-flex rounded-lg p-2 ${background}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
                      <p className="mt-1 text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                  <section className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-5">
                    <h3 className="text-sm font-semibold text-white">Top document themes</h3>
                    <p className="mt-1 text-xs text-slate-400">Ranked by actual appearances throughout the document.</p>

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
                            <CartesianGrid horizontal={false} stroke="#ffffff12" strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                            <YAxis type="category" dataKey="keyword" width={125} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#cbd5e1" }} />
                            <Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ borderRadius: "12px", border: "1px solid #ffffff18", backgroundColor: "#11182b", color: "#f8fafc" }} formatter={(value: number) => [`${value} mention${value === 1 ? "" : "s"}`, "Frequency"]} />
                            <Bar dataKey="count" fill="url(#paperiqKeywordGradient)" radius={[0, 5, 5, 0]} maxBarSize={22} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-12 text-center text-sm text-slate-400">No themes were detected in this document.</p>
                    )}
                  </section>

                  <section className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-5">
                    <h3 className="text-sm font-semibold text-white">Entity distribution</h3>
                    <p className="mt-1 text-xs text-slate-400">How recognized information is categorized.</p>

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
                              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #ffffff18", backgroundColor: "#11182b", color: "#f8fafc" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {entityData.slice(0, 6).map((item, index) => (
                            <div key={item.type} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 text-slate-300">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ENTITY_COLORS[index % ENTITY_COLORS.length] }} />
                                {item.label}
                              </span>
                              <span className="font-semibold text-white">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="py-12 text-center text-sm text-slate-400">No named entities were detected.</p>
                    )}
                  </section>
                </div>

                <section className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-5">
                  <h3 className="text-sm font-semibold text-white">Extracted entities</h3>
                  <p className="mt-1 text-xs text-slate-400">People, organizations, places, and other notable references.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {extractResult.entities?.length ? extractResult.entities.slice(0, 24).map(([name, type], index) => (
                      <span key={`${name}-${type}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {name}
                        <span className="text-slate-400">{ENTITY_LABELS[type] || type}</span>
                      </span>
                    )) : (
                      <span className="text-sm text-slate-400">Run insight extraction to discover document entities.</span>
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
