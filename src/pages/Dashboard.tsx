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
    <div className="relative min-h-screen overflow-hidden bg-[#f7f4ec]">
      <div aria-hidden="true" className="paperiq-grid pointer-events-none fixed inset-0 opacity-40" />
      <div aria-hidden="true" className="pointer-events-none fixed -right-44 top-36 h-[31rem] w-[31rem] rounded-full border border-[#ddd6c7] opacity-60" />
      <div aria-hidden="true" className="pointer-events-none fixed -right-32 top-48 h-[25rem] w-[25rem] rounded-full border border-[#ddd6c7] opacity-50" />

      <header className="sticky top-0 z-30 border-b border-[#d8d1c1] bg-[#f7f4ec]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#e97853] shadow-[3px_3px_0_#d9d2c4]">
              <FileStack className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="paperiq-serif text-2xl leading-none text-[#20372d]">PaperIQ</h1>
              <p className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.19em] text-[#837b6f] sm:block">Research atelier</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="paperiq-stamp hidden items-center gap-2 text-[#315e4c] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#527a60]" />
              Desk open
            </span>
            <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#d8d1c1] bg-[#fcfaf4] text-[#465a4f] sm:flex">
              <UserRound className="h-4 w-4" />
            </span>
            <Button variant="ghost" onClick={handleLogout} className="h-9 rounded-sm border border-[#d8d1c1] px-3 text-[#465a4f] hover:bg-[#ece7db] hover:text-[#20372d]">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-6 sm:pt-12 lg:px-8">
        <section className="relative mb-9 overflow-hidden rounded-sm border border-[#b8c7b4] bg-[#e9eee4] px-6 py-9 shadow-[6px_6px_0_#ddd7ca] sm:px-10 sm:py-12">
          <div aria-hidden="true" className="paperiq-serif pointer-events-none absolute -right-5 -top-16 text-[16rem] leading-none text-[#d7dfd2] sm:right-7">01</div>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-28 bg-[#e97853]" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <span className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b6583b]">
                <Sparkles className="h-3.5 w-3.5" />
                The daily brief / research desk
              </span>
              <h2 className="paperiq-serif text-5xl leading-[0.98] tracking-[-0.055em] text-[#20372d] sm:text-6xl lg:text-7xl">
                A little more clarity,<br /><span className="italic text-[#b6583b]">{userName}.</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[#627064] sm:text-[15px]">
                Bring us the pages. We will find the important threads, connect the notes, and give you the whole story.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-sm border border-[#d8d1c1] bg-[#fbf9f3] px-4 py-3 shadow-[3px_3px_0_#d9d2c4]">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#fae9df] text-[#b6583b]">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#263b31]">{completedSteps}/4 notes complete</p>
                <p className="mt-0.5 text-xs text-[#777264]">{uploadedFile ? "The desk is at work" : "Your first page awaits"}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <FileUploadCard onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />

          <section className="paperiq-glass rounded-sm p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b6583b]">Field checklist / No. 02</p>
                <h3 className="paperiq-serif mt-2 text-2xl text-[#20372d]">The reading ritual.</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#827969]" />
            </div>

            <div className="space-y-3">
              {[
                { label: "Upload your document", complete: Boolean(uploadedFile) },
                { label: "Extract and clean the text", complete: Boolean(results.preprocess) },
                { label: "Discover themes and entities", complete: Boolean(results.extract) },
                { label: "Generate a complete summary", complete: Boolean(results.summarize) },
              ].map(({ label, complete }, index) => (
                <div key={label} className="flex items-center gap-3 rounded-sm border border-[#e5dfd2] bg-[#fbf9f3] px-3 py-3">
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#527a60]" />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#c7c0b2] text-[9px] text-[#817a6e]">{index + 1}</span>
                  )}
                  <span className={`text-sm ${complete ? "text-[#315e4c]" : "text-[#777264]"}`}>{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b6583b]">Tools from the field / No. 03</p>
            <h3 className="paperiq-serif text-3xl tracking-[-0.035em] text-[#20372d]">Your reading instruments.</h3>
          </div>
          <p className="text-xs text-[#777264]">Follow the margin notes, or skip ahead to the short version.</p>
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
  );
};

export default Dashboard;
