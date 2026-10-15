import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ScoreGauge } from "../components/ScoreCard.jsx";
import { BadgeRow } from "../components/KeywordBadges.jsx";
import { EmptyState } from "../components/Loader.jsx";
import { useAnalysis } from "../hooks/useAnalysis.jsx";

export default function CareerImprovement() {
  const navigate = useNavigate();
  const { result, targetField, customField } = useAnalysis();

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <EmptyState
          title="No career analysis yet"
          subtitle="Analyze a resume first to see field-specific readiness and recommendations here."
          action={
            <button
              onClick={() => navigate("/analyzer")}
              className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-base"
            >
              Go to Resume Analyzer <ArrowRight size={16} />
            </button>
          }
        />
      </div>
    );
  }

  const fieldLabel = targetField === "Other" && customField ? customField : targetField;

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-12">
      <h1 className="text-3xl font-display font-bold text-ink mb-2">Career Improvement</h1>
      <p className="text-muted mb-8">Your readiness for the {fieldLabel} field, based on this resume and job description.</p>

      <div className="grid md:grid-cols-[auto,1fr] gap-8 items-start mb-10">
        <ScoreGauge label={`${fieldLabel} Readiness`} value={result.field_readiness_score} suffix="%" />
        <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
          <h2 className="font-semibold text-ink mb-4">Recommended Improvements</h2>
          <ul className="space-y-3">
            {result.career_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-card p-6 mb-10">
        <h2 className="font-semibold text-ink mb-4">Recommended Skills to Build</h2>
        <BadgeRow items={result.recommended_skills} variant="partial" emptyLabel="You already cover the core skills for this field." />
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-brand-600" /> Skills You Already Have
        </h2>
        <BadgeRow items={result.current_skills} variant="matched" emptyLabel="No skills detected in resume text." />
      </div>
    </div>
  );
}
