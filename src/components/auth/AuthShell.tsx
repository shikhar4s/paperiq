import type { ReactNode } from "react";
import { ArrowUpRight, BookOpenText, FileSearch, Highlighter, ScanText } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

const AuthShell = ({ eyebrow, title, description, children, footer }: AuthShellProps) => (
  <main className="relative min-h-screen overflow-hidden bg-[#f7f4ec]">
    <div aria-hidden="true" className="paperiq-grid pointer-events-none absolute inset-0 opacity-35" />

    <div className="relative mx-auto grid min-h-screen max-w-[1520px] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-[#d8d1c1] bg-[#173b31] px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div aria-hidden="true" className="absolute right-[-130px] top-[18%] h-[370px] w-[370px] rounded-full border border-[#f1eadc]/15" />
        <div aria-hidden="true" className="absolute right-[-83px] top-[24%] h-[275px] w-[275px] rounded-full border border-[#f1eadc]/10" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-[#e97853] text-[#fffaf0]">
              <BookOpenText className="h-5 w-5" />
            </span>
            <div>
              <p className="paperiq-serif text-2xl tracking-tight text-[#fffaf0]">PaperIQ</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#c6c6ac]">Research atelier</p>
            </div>
          </div>
          <span className="paperiq-stamp -rotate-6 text-[#d9cb92]">Issue No. 01</span>
        </div>

        <div className="relative max-w-[580px] [animation:paperiq-reveal_650ms_ease-out_both]">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-[#d9cb92]">A field guide to better thinking</p>
          <h1 className="paperiq-serif text-[70px] leading-[0.95] tracking-[-0.065em] text-[#fffaf0] xl:text-[88px]">
            Read less.
            <br />
            <span className="italic text-[#e98b67]">Know more.</span>
          </h1>
          <p className="mt-7 max-w-[440px] text-sm leading-7 text-[#d8dbce]">
            Give us your research papers, reports, and documents. We’ll find the ideas worth keeping.
          </p>

          <div className="relative mt-12 max-w-[440px] rotate-[-2deg] border border-[#ded8c9] bg-[#fffaf0] p-5 text-[#20372d] shadow-[10px_10px_0_rgba(0,0,0,0.18)] [animation:paperiq-float_6s_ease-in-out_infinite]">
            <div className="mb-4 flex items-center justify-between border-b border-[#ded8c9] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Research notes</span>
              <Highlighter className="h-4 w-4 text-[#e97853]" />
            </div>
            <p className="paperiq-serif text-lg italic">“The important details were there all along.”</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-[#59675c]">
              <span className="flex items-center gap-1.5"><ScanText className="h-3.5 w-3.5" /> Extract</span>
              <span className="flex items-center gap-1.5"><FileSearch className="h-3.5 w-3.5" /> Understand</span>
              <span className="ml-auto flex items-center gap-1"><ArrowUpRight className="h-3.5 w-3.5" /> Explore</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-[#fffaf0]/20 pt-5 text-[11px] uppercase tracking-[0.18em] text-[#d8dbce]">
          <span>Made for curious minds</span>
          <span>Est. 2026</span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[430px] [animation:paperiq-reveal_650ms_ease-out_120ms_both]">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center bg-[#173b31] text-[#fffaf0]">
              <BookOpenText className="h-5 w-5" />
            </span>
            <span className="paperiq-serif text-2xl text-[#173b31]">PaperIQ</span>
          </div>

          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#b6583b]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e97853]" />
            {eyebrow}
          </span>
          <h2 className="paperiq-serif mt-5 text-5xl leading-[1.04] tracking-[-0.05em] text-[#20372d]">{title}</h2>
          <p className="mt-3 max-w-[380px] text-sm leading-7 text-[#657066]">{description}</p>

          <div className="mt-9">{children}</div>

          <div className="mt-8 border-t border-[#ded8c9] pt-7 text-center text-sm text-[#657066]">
            {footer}
          </div>
        </div>
      </section>
    </div>
  </main>
);

export default AuthShell;
