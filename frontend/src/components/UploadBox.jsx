import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { formatFileSize } from "../utils/format";

const MAX_SIZE_MB = 5;

export default function UploadBox({ file, onFileSelected, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const validateAndSet = useCallback(
    (candidate) => {
      if (!candidate) return;
      if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) {
        onError("Unsupported file type. Please upload your resume as a PDF.");
        return;
      }
      if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
        onError(`File too large. Please upload a PDF under ${MAX_SIZE_MB}MB.`);
        return;
      }
      onFileSelected(candidate);
    },
    [onFileSelected, onError]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    validateAndSet(dropped);
  };

  if (file) {
    return (
      <div className="border border-border rounded-2xl bg-canvas p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
          <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
        </div>
        <button
          onClick={() => onFileSelected(null)}
          className="text-muted hover:text-signal-600 transition-base p-2 rounded-lg hover:bg-signal-500/10"
          aria-label="Remove file"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-base ${
        isDragging ? "border-brand-500 bg-brand-50" : "border-border bg-canvas hover:border-brand-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files?.[0])}
      />
      <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
        <UploadCloud size={22} />
      </div>
      <p className="font-semibold text-ink mb-1">Drop your resume here</p>
      <p className="text-sm text-muted mb-4">PDF only • Maximum 5MB</p>
      <span className="inline-block text-sm font-semibold text-brand-600 border border-brand-200 rounded-lg px-4 py-2 hover:bg-brand-50 transition-base">
        Browse Files
      </span>
    </div>
  );
}
