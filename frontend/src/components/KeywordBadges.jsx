import { Check, X, CircleDashed } from "lucide-react";

const VARIANTS = {
  matched: {
    icon: Check,
    className: "bg-brand-50 text-brand-700 border border-brand-100",
  },
  missing: {
    icon: X,
    className: "bg-signal-500/10 text-signal-600 border border-signal-500/20",
  },
  partial: {
    icon: CircleDashed,
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  neutral: {
    icon: null,
    className: "bg-canvas text-ink border border-border",
  },
};

export function BadgeRow({ items, variant = "neutral", emptyLabel = "None" }) {
  const { icon: Icon, className } = VARIANTS[variant];

  if (!items || items.length === 0) {
    return <p className="text-sm text-muted italic">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${className}`}
        >
          {Icon && <Icon size={13} strokeWidth={2.5} />}
          {item}
        </span>
      ))}
    </div>
  );
}

const PRIORITY_STYLES = {
  "High Priority": "bg-signal-500/10 text-signal-600",
  "Medium Priority": "bg-amber-50 text-amber-700",
  "Low Priority": "bg-canvas text-muted",
};

export function PriorityPill({ priority }) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
        PRIORITY_STYLES[priority] || PRIORITY_STYLES["Low Priority"]
      }`}
    >
      {priority}
    </span>
  );
}
