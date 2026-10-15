import { scoreTone } from "../utils/format";

export function ScoreGauge({ label, value, suffix = "" }) {
  const tone = scoreTone(value);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card p-5 flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#E4E7EC" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={tone.ring}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold text-ink">
            {value}
            <span className="text-sm text-muted">{suffix}</span>
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-muted text-center">{label}</p>
    </div>
  );
}

export function ProgressRow({ label, value }) {
  const tone = scoreTone(value);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className={`text-sm font-semibold ${tone.text}`}>{value}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-canvas overflow-hidden">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
