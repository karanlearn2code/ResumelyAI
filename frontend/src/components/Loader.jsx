import { Loader2, AlertTriangle, Inbox } from "lucide-react";

export function AnalyzingLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <Loader2 size={34} className="text-brand-500 animate-spin" />
      <div>
        <p className="font-semibold text-ink">Analyzing your resume...</p>
        <p className="text-sm text-muted mt-1">
          Extracting text, matching keywords, and preparing your report.
          The first request after a quiet period can take up to a minute.
        </p>
      </div>
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-signal-500/10 border border-signal-500/30 text-signal-600 rounded-xl px-4 py-3.5">
      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-signal-600/70 hover:text-signal-600 text-sm font-semibold">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-canvas border border-border flex items-center justify-center text-muted">
        <Inbox size={24} />
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {subtitle && <p className="text-sm text-muted mt-1 max-w-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
