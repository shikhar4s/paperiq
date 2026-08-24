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
    <section className="paperiq-glass relative overflow-hidden rounded-sm p-5 sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border border-[#e7dfcf]" />
      <div className="relative mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b6583b]">
            <CloudUpload className="h-4 w-4" />
            Desk No. 01 / Intake
          </div>
          <h3 className="paperiq-serif text-2xl tracking-tight text-[#20372d]">Place a document on the desk.</h3>
          <p className="mt-1 text-sm text-[#687168]">A research paper, report, resume, or another curious read.</p>
        </div>
        <span className="paperiq-stamp inline-flex rotate-2 items-center gap-1.5 text-[#3d6754]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Private file
        </span>
      </div>

        {!uploadedFile ? (
          <div
            className={`relative overflow-hidden rounded-sm border-2 border-dashed px-5 py-10 text-center transition-all duration-300 sm:py-12 ${
              isDragging
                ? "border-[#315e4c] bg-[#eaf0e9]"
                : "border-[#d8d1c1] bg-[#faf8f2] hover:border-[#bf6a4f] hover:bg-[#fffdf8]"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 rotate-[-5deg] items-center justify-center border border-[#e3d3be] bg-[#f5e8d5] shadow-[4px_4px_0_#e8ddcc] [animation:paperiq-float_5s_ease-in-out_infinite]">
                <CloudUpload className="h-7 w-7 text-[#a4583f]" />
              </div>
              <div>
                <p className="paperiq-serif mb-1 text-lg text-[#20372d]">
                  Drop your next good read here.
                </p>
                <p className="text-sm text-[#697268]">
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
                Choose a document
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-sm border border-[#a8beac] bg-[#eef3eb] p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#dce9db]">
                <FileText className="h-5 w-5 text-[#315e4c]" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-[#20372d]">{uploadedFile.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#315e4c]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready to analyze · {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile} aria-label="Remove uploaded document" className="shrink-0 rounded-sm text-[#697268] hover:bg-[#dce9db] hover:text-[#20372d]">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
    </section>
  );
};

export default FileUploadCard;
