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
  CheckCircle2,
  UserRound,
  Zap,
  Home,
  History,
  LifeBuoy,
  Plus,
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

const ENTITY_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];
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
    <div className="relative min-h-screen bg-[#090d19]">
      <div aria-hidden="true" className="paperiq-grid pointer-events-none fixed inset-0 opacity-40" />
      <div className="relative min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="z-30 border-b border-white/[0.07] bg-[#0c1120] px-4 py-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-white/[0.07] lg:px-5 lg:py-7">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
                <FileStack className="h-5 w-5" />
              </span>
              <div>
                <h1 className="paperiq-serif text-2xl leading-none">PaperIQ</h1>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-slate-500">Document lab</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} aria-label="Sign out" className="h-9 w-9 rounded-full border border-white/10 p-0 text-slate-300 hover:bg-white/[0.07] hover:text-white lg:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <nav aria-label="Workspace navigation" className="mt-0 hidden space-y-1 lg:mt-12 lg:block">
            <button type="button" className="flex w-full items-center gap-3 rounded-xl bg-violet-500/15 px-3 py-2.5 text-left text-sm font-semibold text-violet-200">
              <Home className="h-4 w-4" /> Current analysis
            </button>
            <span className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-500">
              <History className="h-4 w-4" /> Recent documents
            </span>
          </nav>

          <div className="mt-auto hidden lg:block">
            <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span>Analysis progress</span><span>{completedSteps}/4</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-[width] duration-500" style={{ width: `${completedSteps * 25}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{uploadedFile ? "Your document is on the workbench." : "Upload a document to begin."}</p>
            </div>
            <div className="flex items-center gap-3 border-t border-white/[0.08] pt-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07]"><UserRound className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="text-[10px] text-slate-500">Research workspace</p>
              </div>
              <Button variant="ghost" onClick={handleLogout} aria-label="Sign out" className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-white/[0.07] hover:text-white">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="relative min-w-0 px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Workspace / New analysis
              </div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Document workbench</h2>
            </div>
            <Button type="button" onClick={() => document.getElementById("document-upload")?.click()} className="h-10 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-500/15 hover:from-violet-500 hover:to-indigo-500">
              <Plus className="mr-2 h-4 w-4" /> Add document
            </Button>
          </header>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="min-w-0 space-y-6">
              <FileUploadCard onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />

              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827]/85 shadow-2xl shadow-black/20">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] bg-white/[0.025] px-5 py-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-violet-300">Processing pipeline</p>
                    <h3 className="mt-1 text-base font-semibold text-white">Move from raw pages to clear answers</h3>
                  </div>
                  <span className="text-xs text-slate-500">Run each available module in order</span>
                </div>

                <ModuleCard
                  title="Ingestion"
                  description="Read every page and capture the original content without losing context."
                  icon={<Database className="h-5 w-5" />}
                  color="blue"
                  disabled={!uploadedFile}
                  onProcess={handleIngest}
                  output={results.ingestion}
                />
                <ModuleCard
                  title="Preprocessing"
                  description="Remove extraction noise while preserving meaningful names, dates, and details."
                  icon={<Settings className="h-5 w-5" />}
                  color="purple"
                  disabled={!rawText}
                  onProcess={handlePreprocess}
                  output={results.preprocess}
                />
                <ModuleCard
                  title="Insight extraction"
                  description="Reveal important themes, people, organizations, and recurring patterns."
                  icon={<Lightbulb className="h-5 w-5" />}
                  color="amber"
                  disabled={!cleanText}
                  onProcess={handleExtract}
                  output={results.extract}
                />
                <ModuleCard
                  title="Summarization"
                  description="Create a complete structured summary covering the entire document."
                  icon={<FileSearch className="h-5 w-5" />}
                  color="green"
                  disabled={!uploadedFile}
                  onProcess={handleSummarize}
                  output={results.summarize}
                />
              </section>
            </div>

            <aside className="space-y-5 2xl:sticky 2xl:top-8 2xl:self-start">
              <section className="rounded-2xl border border-white/[0.08] bg-[#111827]/85 p-5 shadow-xl shadow-black/10">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">Live status</p>
                    <h3 className="mt-1 text-base font-semibold text-white">Analysis map</h3>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-300"><Zap className="h-4 w-4" /></span>
                </div>

                <div className="relative space-y-0 before:absolute before:bottom-5 before:left-[0.72rem] before:top-5 before:w-px before:bg-white/10">
                  {[
                    { label: "Document added", complete: Boolean(uploadedFile) },
                    { label: "Text prepared", complete: Boolean(results.preprocess) },
                    { label: "Insights found", complete: Boolean(results.extract) },
                    { label: "Summary ready", complete: Boolean(results.summarize) },
                  ].map(({ label, complete }, index) => (
                    <div key={label} className="relative flex items-center gap-3 py-3">
                      {complete ? (
                        <CheckCircle2 className="z-10 h-6 w-6 shrink-0 bg-[#111827] text-emerald-400" />
                      ) : (
                        <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#111827] text-[9px] text-slate-500">{index + 1}</span>
                      )}
                      <span className={`text-xs font-medium ${complete ? "text-emerald-300" : "text-slate-500"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-[#201b48] via-[#171938] to-[#10283a] p-5 text-white shadow-xl shadow-violet-950/20">
                <div aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/20 blur-2xl" />
                <BarChart3 className="relative h-5 w-5 text-cyan-300" />
                <h3 className="relative mt-6 text-2xl font-semibold tracking-tight">See the document differently.</h3>
                <p className="relative mt-2 text-xs leading-5 text-slate-300">Open charts for key themes, entities, reading time, and document complexity.</p>
                <Button
                  type="button"
                  onClick={() => setIsVizOpen(true)}
                  disabled={!results.extract}
                  className="relative mt-5 h-10 w-full rounded-full bg-white text-xs font-semibold text-[#171938] hover:bg-slate-100 disabled:opacity-40"
                >
                  {results.extract ? "Open visual insights" : "Extract insights first"}
                </Button>
              </section>

              <div className="hidden items-center gap-2 px-1 text-[11px] text-slate-500 2xl:flex">
                <LifeBuoy className="h-3.5 w-3.5" /> Files up to 10 MB · PDF, DOCX, TXT
              </div>
            </aside>
          </div>

        {/* Visualization Popup */}
        <Dialog open={isVizOpen} onOpenChange={setIsVizOpen}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto border border-white/10 bg-[#0c1120] p-0 text-white shadow-2xl shadow-black/50 sm:rounded-[28px]">
            <DialogHeader className="border-b border-white/[0.08] bg-gradient-to-r from-violet-500/[0.09] to-cyan-500/[0.04] px-6 py-6 text-left sm:px-8">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
                <Sparkles className="h-4 w-4" />
                Research notes / visual edition
              </div>
              <DialogTitle className="text-3xl font-semibold tracking-tight text-white">
                The story between the lines.
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
                    { label: "Reading time", value: `${readingMinutes} min`, icon: Clock3, color: "text-cyan-300", background: "bg-cyan-400/10" },
                    { label: "Key themes", value: extractResult.keywords?.length || 0, icon: Tags, color: "text-amber-300", background: "bg-amber-400/10" },
                    { label: "Entities found", value: extractResult.entities?.length || 0, icon: Layers3, color: "text-fuchsia-300", background: "bg-fuchsia-400/10" },
                  ].map(({ label, value, icon: Icon, color, background }) => (
                    <div key={label} className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-4">
                      <div className={`mb-3 inline-flex rounded-lg p-2 ${background}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
                      <p className="mt-1 text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                  <section className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-5">
                    <h3 className="text-xl font-semibold text-white">Notes that kept coming up.</h3>
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
                            <Bar dataKey="count" fill="url(#paperiqKeywordGradient)" radius={[0, 2, 2, 0]} maxBarSize={22} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-12 text-center text-sm text-slate-400">No themes were detected in this document.</p>
                    )}
                  </section>

                  <section className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-5">
                    <h3 className="text-xl font-semibold text-white">Cast of characters.</h3>
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
                  <h3 className="text-xl font-semibold text-white">Names worth underlining.</h3>
                  <p className="mt-1 text-xs text-slate-400">People, organizations, places, and other notable references.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {extractResult.entities?.length ? extractResult.entities.slice(0, 24).map(([name, type], index) => (
                      <span key={`${name}-${type}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        {name}
                        <span className="text-slate-500">{ENTITY_LABELS[type] || type}</span>
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
    </div>
  );
};

export default Dashboard;
