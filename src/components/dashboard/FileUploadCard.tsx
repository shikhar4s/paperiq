import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2, CloudUpload, FileText, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadCardProps {
  onFileUpload: (file: File | null) => void;
  uploadedFile: File | null;
}

const FileUploadCard = ({ onFileUpload, uploadedFile }: FileUploadCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const validTypes = [".pdf", ".docx", ".txt"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast.error("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="paperiq-glass relative overflow-hidden rounded-[28px] p-5 sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            <CloudUpload className="h-4 w-4" />
            Document upload
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-white">Start with a document</h3>
          <p className="mt-1 text-sm text-slate-400">Drop in a paper, report, resume, or anything worth understanding.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Private workspace
        </span>
      </div>

        {!uploadedFile ? (
          <div
            className={`relative overflow-hidden rounded-2xl border border-dashed px-5 py-10 text-center transition-all duration-300 sm:py-12 ${
              isDragging
                ? "border-violet-400/75 bg-violet-500/10"
                : "border-white/15 bg-white/[0.025] hover:border-violet-400/45 hover:bg-white/[0.04]"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-400/20 bg-violet-500/10 shadow-lg shadow-violet-500/10 [animation:paperiq-float_4s_ease-in-out_infinite]">
                <CloudUpload className="h-7 w-7 text-violet-300" />
              </div>
              <div>
                <p className="mb-1 font-medium text-white">
                  Drag your document here
                </p>
                <p className="text-sm text-slate-400">
                  PDF, DOCX, or TXT · Up to 10 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="paperiq-primary-button mt-1 w-full px-6 sm:w-auto"
              >
                Browse documents
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                <FileText className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{uploadedFile.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready to analyze · {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile} aria-label="Remove uploaded document" className="shrink-0 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
    </section>
  );
};

export default FileUploadCard;
