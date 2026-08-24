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

const ENTITY_COLORS = ["#315e4c", "#d97852", "#b9903f", "#52788a", "#9b7650", "#73885e"];
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
    <div className="relative min-h-screen bg-[#f7f4ec]">
      <div aria-hidden="true" className="paperiq-grid pointer-events-none fixed inset-0 opacity-40" />
      <div className="relative min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="z-30 border-b border-[#d8d1c1] bg-[#173b31] px-4 py-4 text-[#fffaf0] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-[#2e5147] lg:px-5 lg:py-7">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#e97853]">
                <FileStack className="h-5 w-5" />
              </span>
              <div>
                <h1 className="paperiq-serif text-2xl leading-none">PaperIQ</h1>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-[#bfcabe]">Document lab</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} aria-label="Sign out" className="h-9 w-9 rounded-full border border-[#fffaf0]/20 p-0 text-[#fffaf0] hover:bg-[#fffaf0]/10 hover:text-white lg:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <nav aria-label="Workspace navigation" className="mt-0 hidden space-y-1 lg:mt-12 lg:block">
            <button type="button" className="flex w-full items-center gap-3 rounded-sm bg-[#fffaf0] px-3 py-2.5 text-left text-sm font-semibold text-[#173b31]">
              <Home className="h-4 w-4" /> Current analysis
            </button>
            <span className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#bfcabe]">
              <History className="h-4 w-4" /> Recent documents
            </span>
          </nav>

          <div className="mt-auto hidden lg:block">
            <div className="mb-5 border border-[#fffaf0]/15 bg-[#fffaf0]/[0.06] p-4">
              <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#cad3c8]">
                <span>Analysis progress</span><span>{completedSteps}/4</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#fffaf0]/10">
                <div className="h-full bg-[#e97853] transition-[width] duration-500" style={{ width: `${completedSteps * 25}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#bfcabe]">{uploadedFile ? "Your document is on the workbench." : "Upload a document to begin."}</p>
            </div>
            <div className="flex items-center gap-3 border-t border-[#fffaf0]/15 pt-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fffaf0]/10"><UserRound className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="text-[10px] text-[#bfcabe]">Research workspace</p>
              </div>
              <Button variant="ghost" onClick={handleLogout} aria-label="Sign out" className="h-8 w-8 rounded-full p-0 text-[#bfcabe] hover:bg-[#fffaf0]/10 hover:text-white">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="relative min-w-0 px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#d8d1c1] pb-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b6583b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e97853]" /> Workspace / New analysis
              </div>
              <h2 className="paperiq-serif text-3xl tracking-[-0.04em] text-[#20372d] sm:text-4xl">Document workbench</h2>
            </div>
            <Button type="button" onClick={() => document.getElementById("document-upload")?.click()} className="h-10 rounded-full bg-[#173b31] px-4 text-xs font-semibold text-[#fffaf0] hover:bg-[#214b3f]">
              <Plus className="mr-2 h-4 w-4" /> Add document
            </Button>
          </header>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="min-w-0 space-y-6">
              <FileUploadCard onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />

              <section className="overflow-hidden border border-[#d8d1c1] bg-[#fffefa] shadow-[4px_4px_0_#e3ddd0]">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#d8d1c1] bg-[#f1eee5] px-5 py-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[#b6583b]">Processing pipeline</p>
                    <h3 className="mt-1 text-base font-semibold text-[#20372d]">Move from raw pages to clear answers</h3>
                  </div>
                  <span className="text-xs text-[#777264]">Run each available module in order</span>
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
              <section className="border border-[#d8d1c1] bg-[#fffefa] p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#b6583b]">Live status</p>
                    <h3 className="mt-1 text-base font-semibold text-[#20372d]">Analysis map</h3>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fae9df] text-[#b6583b]"><Zap className="h-4 w-4" /></span>
                </div>

                <div className="relative space-y-0 before:absolute before:bottom-5 before:left-[0.72rem] before:top-5 before:w-px before:bg-[#ded8ca]">
                  {[
                    { label: "Document added", complete: Boolean(uploadedFile) },
                    { label: "Text prepared", complete: Boolean(results.preprocess) },
                    { label: "Insights found", complete: Boolean(results.extract) },
                    { label: "Summary ready", complete: Boolean(results.summarize) },
                  ].map(({ label, complete }, index) => (
                    <div key={label} className="relative flex items-center gap-3 py-3">
                      {complete ? (
                        <CheckCircle2 className="z-10 h-6 w-6 shrink-0 bg-[#fffefa] text-[#527a60]" />
                      ) : (
                        <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c7c0b2] bg-[#fffefa] text-[9px] text-[#817a6e]">{index + 1}</span>
                      )}
                      <span className={`text-xs font-medium ${complete ? "text-[#315e4c]" : "text-[#777264]"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden border border-[#173b31] bg-[#173b31] p-5 text-[#fffaf0]">
                <BarChart3 className="h-5 w-5 text-[#e98b67]" />
                <h3 className="paperiq-serif mt-6 text-2xl">See the document differently.</h3>
                <p className="mt-2 text-xs leading-5 text-[#c7d0c5]">Open charts for key themes, entities, reading time, and document complexity.</p>
                <Button
                  type="button"
                  onClick={() => setIsVizOpen(true)}
                  disabled={!results.extract}
                  className="mt-5 h-10 w-full rounded-full bg-[#fffaf0] text-xs font-semibold text-[#173b31] hover:bg-white disabled:opacity-40"
                >
                  {results.extract ? "Open visual insights" : "Extract insights first"}
                </Button>
              </section>

              <div className="hidden items-center gap-2 px-1 text-[11px] text-[#777264] 2xl:flex">
                <LifeBuoy className="h-3.5 w-3.5" /> Files up to 10 MB · PDF, DOCX, TXT
              </div>
            </aside>
          </div>

        {/* Visualization Popup */}
        <Dialog open={isVizOpen} onOpenChange={setIsVizOpen}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto rounded-sm border border-[#d8d1c1] bg-[#faf8f2] p-0 text-[#20372d] shadow-[10px_10px_0_#dfd8cb] sm:rounded-sm">
            <DialogHeader className="border-b border-[#d8d1c1] bg-[#edf0e8] px-6 py-6 text-left sm:px-8">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b6583b]">
                <Sparkles className="h-4 w-4" />
                Research notes / visual edition
              </div>
              <DialogTitle className="paperiq-serif text-3xl tracking-tight text-[#20372d]">
                The story between the lines.
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm text-[#6f7166]">
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
                    { label: "Document words", value: wordCount.toLocaleString(), icon: FileText, color: "text-[#315e4c]", background: "bg-[#e8efe5]" },
                    { label: "Reading time", value: `${readingMinutes} min`, icon: Clock3, color: "text-[#52788a]", background: "bg-[#e7eff1]" },
                    { label: "Key themes", value: extractResult.keywords?.length || 0, icon: Tags, color: "text-[#986c24]", background: "bg-[#f8efd9]" },
                    { label: "Entities found", value: extractResult.entities?.length || 0, icon: Layers3, color: "text-[#b6583b]", background: "bg-[#fae9df]" },
                  ].map(({ label, value, icon: Icon, color, background }) => (
                    <div key={label} className="rounded-sm border border-[#ded8ca] bg-[#fffefa] p-4">
                      <div className={`mb-3 inline-flex rounded-sm p-2 ${background}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <p className="paperiq-serif text-3xl tracking-tight text-[#20372d]">{value}</p>
                      <p className="mt-1 text-xs text-[#777264]">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                  <section className="rounded-sm border border-[#ded8ca] bg-[#fffefa] p-5">
                    <h3 className="paperiq-serif text-xl text-[#20372d]">Notes that kept coming up.</h3>
                    <p className="mt-1 text-xs text-[#777264]">Ranked by actual appearances throughout the document.</p>

                    {keywordData.length ? (
                      <div className="mt-5 h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={keywordData} layout="vertical" margin={{ top: 0, right: 18, left: 8, bottom: 0 }}>
                            <defs>
                              <linearGradient id="paperiqKeywordGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#315e4c" />
                                <stop offset="100%" stopColor="#74937b" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid horizontal={false} stroke="#e5dfd2" strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#817a6e" }} />
                            <YAxis type="category" dataKey="keyword" width={125} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#465a4f" }} />
                            <Tooltip cursor={{ fill: "#f3efe5" }} contentStyle={{ borderRadius: "2px", border: "1px solid #d8d1c1", backgroundColor: "#fffefa", color: "#20372d" }} formatter={(value: number) => [`${value} mention${value === 1 ? "" : "s"}`, "Frequency"]} />
                            <Bar dataKey="count" fill="url(#paperiqKeywordGradient)" radius={[0, 2, 2, 0]} maxBarSize={22} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-12 text-center text-sm text-[#777264]">No themes were detected in this document.</p>
                    )}
                  </section>

                  <section className="rounded-sm border border-[#ded8ca] bg-[#fffefa] p-5">
                    <h3 className="paperiq-serif text-xl text-[#20372d]">Cast of characters.</h3>
                    <p className="mt-1 text-xs text-[#777264]">How recognized information is categorized.</p>

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
                              <Tooltip contentStyle={{ borderRadius: "2px", border: "1px solid #d8d1c1", backgroundColor: "#fffefa", color: "#20372d" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {entityData.slice(0, 6).map((item, index) => (
                            <div key={item.type} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 text-[#465a4f]">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ENTITY_COLORS[index % ENTITY_COLORS.length] }} />
                                {item.label}
                              </span>
                              <span className="font-semibold text-[#20372d]">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="py-12 text-center text-sm text-[#777264]">No named entities were detected.</p>
                    )}
                  </section>
                </div>

                <section className="rounded-sm border border-[#ded8ca] bg-[#fffefa] p-5">
                  <h3 className="paperiq-serif text-xl text-[#20372d]">Names worth underlining.</h3>
                  <p className="mt-1 text-xs text-[#777264]">People, organizations, places, and other notable references.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {extractResult.entities?.length ? extractResult.entities.slice(0, 24).map(([name, type], index) => (
                      <span key={`${name}-${type}-${index}`} className="inline-flex items-center gap-2 rounded-sm border border-[#ded8ca] bg-[#f8f5ec] px-3 py-1.5 text-xs text-[#465a4f]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#d97852]" />
                        {name}
                        <span className="text-[#817a6e]">{ENTITY_LABELS[type] || type}</span>
                      </span>
                    )) : (
                      <span className="text-sm text-[#777264]">Run insight extraction to discover document entities.</span>
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
