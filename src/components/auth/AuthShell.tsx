import type { ReactNode } from "react";
import { ArrowUpRight, FileStack, ScanText, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

const previewFeatures = [
  { icon: ScanText, title: "Understand every page", detail: "Extract meaning, entities, and key themes." },
  { icon: WandSparkles, title: "Summaries that make sense", detail: "Complete answers shaped around your document." },
  { icon: ShieldCheck, title: "Your research, organized", detail: "A private workspace for intelligent analysis." },
];

const AuthShell = ({ eyebrow, title, description, children, footer }: AuthShellProps) => (
  <main className="relative min-h-screen overflow-hidden bg-[#090d19]">
    <div aria-hidden="true" className="paperiq-grid pointer-events-none absolute inset-0 opacity-70" />
    <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-violet-600/20 blur-[120px] [animation:paperiq-pulse-glow_8s_ease-in-out_infinite]" />
    <div aria-hidden="true" className="pointer-events-none absolute bottom-[-14rem] right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[130px]" />

    <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.04fr_0.96fr]">
      <section className="hidden flex-col justify-between border-r border-white/[0.07] px-12 py-11 lg:flex xl:px-20">
        <div className="inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <FileStack className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">PaperIQ</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Document intelligence</p>
          </div>
        </div>

        <div className="max-w-xl [animation:paperiq-reveal_650ms_ease-out_both]">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            AI that reads between the lines
          </span>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.06em] text-white xl:text-6xl">
            Your documents,
            <br />
            <span className="paperiq-gradient-text">finally understood.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-slate-400">
            Turn dense PDFs and research papers into clear summaries, useful insights, and beautiful visualizations.
          </p>

          <div className="mt-10 space-y-3">
            {previewFeatures.map(({ icon: Icon, title: featureTitle, detail }) => (
              <div key={featureTitle} className="paperiq-glass flex items-center gap-4 rounded-2xl px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-violet-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{featureTitle}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{detail}</p>
                </div>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-slate-500" />
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs tracking-wide text-slate-500">Built for researchers, builders, and curious minds.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[430px] [animation:paperiq-reveal_650ms_ease-out_120ms_both]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600">
              <FileStack className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-white">PaperIQ</span>
          </div>

          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.19em] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {eyebrow}
          </span>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>

          <div className="mt-9">{children}</div>

          <div className="mt-8 border-t border-white/[0.08] pt-7 text-center text-sm text-slate-400">
            {footer}
          </div>
        </div>
      </section>
    </div>
  </main>
);

export default AuthShell;
