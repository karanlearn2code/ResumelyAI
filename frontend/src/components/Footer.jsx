import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2 font-display font-bold text-ink">
          <span className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white">
            <Sparkles size={14} />
          </span>
          ResumeAI
        </div>
        <p className="text-sm text-muted max-w-md">
          An academic NTCC project exploring resume analysis, ATS scoring, and
          AI-assisted career guidance. Scores are estimates for learning
          purposes, not a guarantee of any real employer's hiring decision.
        </p>
        <p className="text-sm text-muted">© {new Date().getFullYear()} ResumeAI</p>
      </div>
    </footer>
  );
}
