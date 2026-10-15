import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function InterviewQuestion({ question, whatIsTested }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-medium text-ink">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && whatIsTested && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
            What the interviewer is testing
          </p>
          <p className="text-sm text-muted">{whatIsTested}</p>
        </div>
      )}
    </div>
  );
}
