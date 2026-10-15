import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function ImprovementCard({ title, before, after, beforeLabel = "Current", afterLabel = "Suggested" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(after);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard may be unavailable - fail silently, button label just won't confirm
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
      {title && <h4 className="font-semibold text-ink mb-3">{title}</h4>}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">{beforeLabel}</p>
          <p className="text-sm text-ink bg-canvas rounded-xl p-3.5 leading-relaxed">{before}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">{afterLabel}</p>
          <p className="text-sm text-ink bg-brand-50 rounded-xl p-3.5 leading-relaxed">{after}</p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-base"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
