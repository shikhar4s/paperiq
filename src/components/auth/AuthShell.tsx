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
  <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ec] px-4 py-10 sm:px-6">
    <div aria-hidden="true" className="paperiq-grid pointer-events-none absolute inset-0 opacity-35" />
    <div aria-hidden="true" className="pointer-events-none absolute left-[-12rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full border border-[#d8d1c1]" />
    <div aria-hidden="true" className="pointer-events-none absolute bottom-[-14rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full border border-[#d8d1c1]" />

    <div className="relative w-full max-w-[520px] [animation:paperiq-reveal_600ms_ease-out_both]">
      <div aria-hidden="true" className="absolute -left-44 top-28 hidden w-52 -rotate-6 border border-[#d8d1c1] bg-[#edf1e9] p-5 shadow-[5px_5px_0_#ddd6c9] xl:block">
        <ScanText className="h-5 w-5 text-[#315e4c]" />
        <p className="paperiq-serif mt-8 text-lg text-[#20372d]">Extract every useful detail.</p>
        <div className="mt-5 h-px bg-[#cdd6ca]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#777264]">01 / Read</p>
      </div>

      <div aria-hidden="true" className="absolute -right-48 bottom-28 hidden w-56 rotate-[5deg] border border-[#e0c8bd] bg-[#fffaf4] p-5 shadow-[5px_5px_0_#e6ddd0] xl:block">
        <FileSearch className="h-5 w-5 text-[#b6583b]" />
        <p className="paperiq-serif mt-8 text-lg text-[#20372d]">Understand the whole document.</p>
        <div className="mt-5 h-px bg-[#ead8d0]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#777264]">02 / Discover</p>
      </div>

      <div className="mb-7 flex items-center justify-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-[#173b31] text-[#fffaf0] shadow-[3px_3px_0_#e97853]">
          <BookOpenText className="h-5 w-5" />
        </span>
        <div>
          <p className="paperiq-serif text-2xl leading-none text-[#173b31]">PaperIQ</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#837b6f]">Document intelligence</p>
        </div>
      </div>

      <section className="relative border border-[#d8d1c1] bg-[#fffdf8] px-6 py-8 shadow-[8px_8px_0_#e3ddd0] sm:px-10 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#173b31] via-[#173b31] to-[#e97853]" />
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b6583b]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e97853]" />
            {eyebrow}
          </span>
          <h1 className="paperiq-serif mt-4 text-4xl leading-tight tracking-[-0.045em] text-[#20372d] sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-[#657066]">{description}</p>
        </div>

        <div className="mt-8">{children}</div>

        <div className="mt-7 border-t border-[#e1dacd] pt-6 text-center text-sm text-[#657066]">
          {footer}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#777264]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#315e4c]" />
        Your documents remain private and secure
      </div>
    </div>
  </main>
);

export default AuthShell;
