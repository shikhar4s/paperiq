import type { ReactNode } from "react";
import { BookOpenText, FileSearch, ScanText, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

const AuthShell = ({ eyebrow, title, description, children, footer }: AuthShellProps) => (
  <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090d19] px-4 py-10 sm:px-6">
    <div aria-hidden="true" className="paperiq-grid pointer-events-none absolute inset-0 opacity-35" />
    <div aria-hidden="true" className="pointer-events-none absolute left-[-10rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-[110px]" />
    <div aria-hidden="true" className="pointer-events-none absolute bottom-[-14rem] right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[120px]" />

    <div className="relative w-full max-w-[520px] [animation:paperiq-reveal_600ms_ease-out_both]">
      <div aria-hidden="true" className="absolute -left-44 top-28 hidden w-52 -rotate-6 rounded-2xl border border-white/10 bg-[#11182b]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl xl:block">
        <ScanText className="h-5 w-5 text-cyan-300" />
        <p className="mt-8 text-lg font-semibold text-white">Extract every useful detail.</p>
        <div className="mt-5 h-px bg-white/10" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">01 / Read</p>
      </div>

      <div aria-hidden="true" className="absolute -right-48 bottom-28 hidden w-56 rotate-[5deg] rounded-2xl border border-violet-400/15 bg-[#15152d]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl xl:block">
        <FileSearch className="h-5 w-5 text-violet-300" />
        <p className="mt-8 text-lg font-semibold text-white">Understand the whole document.</p>
        <div className="mt-5 h-px bg-white/10" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">02 / Discover</p>
      </div>

      <div className="mb-7 flex items-center justify-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
          <BookOpenText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold leading-none tracking-tight text-white">PaperIQ</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">Document intelligence</p>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101625]/90 px-6 py-8 shadow-2xl shadow-black/35 backdrop-blur-xl sm:px-10 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/80 to-transparent" />
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {eyebrow}
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.055em] text-white sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <div className="mt-8">{children}</div>

        <div className="mt-7 border-t border-white/[0.08] pt-6 text-center text-sm text-slate-400">
          {footer}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
        Your documents remain private and secure
      </div>
    </div>
  </main>
);

export default AuthShell;
