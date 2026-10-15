import { useNavigate } from "react-router-dom";
import { Download, ArrowRight, RefreshCcw } from "lucide-react";
import { ScoreGauge, ProgressRow } from "../components/ScoreCard.jsx";
import { BadgeRow, PriorityPill } from "../components/KeywordBadges.jsx";
import ImprovementCard from "../components/ImprovementCard.jsx";
import { EmptyState } from "../components/Loader.jsx";
import { useAnalysis } from "../hooks/useAnalysis.jsx";
import { downloadReport } from "../services/api";

export default function Results() {
  const navigate = useNavigate();
  const { result, reset } = useAnalysis();

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <EmptyState
          title="No analysis yet"
          subtitle="Upload a resume and a job description on the Resume Analyzer page to see your results here."
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

  const handleReset = async () => {
    await reset();
    navigate("/analyzer");
  };

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Resume Analysis</h1>
          {result.is_mock && (
            <p className="text-xs font-semibold text-amber-700 bg-amber-50 inline-block px-2.5 py-1 rounded-full mt-2">
              Demo mode — showing a mock analysis (no live AI call was made)
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadReport}
            className="inline-flex items-center gap-2 border border-border text-ink font-semibold px-4 py-2.5 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-base text-sm"
          >
            <Download size={16} /> Download Report
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-muted font-semibold px-4 py-2.5 rounded-xl hover:bg-canvas transition-base text-sm"
          >
            <RefreshCcw size={16} /> Clear & Start Over
          </button>
        </div>
      </div>

      {/* Top score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <ScoreGauge label="ATS Score" value={result.ats_score} suffix="/100" />
        <ScoreGauge label="Job Match" value={result.job_match_score} suffix="%" />
        <ScoreGauge label="Keyword Match" value={result.keyword_match_score} suffix="%" />
        <ScoreGauge label="Skills Match" value={result.skills_match_score} suffix="%" />
      </div>

      {/* ATS Compatibility */}
      <section className="bg-surface rounded-2xl border border-border shadow-card p-6 mb-8">
        <h2 className="font-display font-bold text-lg text-ink mb-5">ATS Compatibility</h2>
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-4 mb-5">
          <ProgressRow label="Formatting" value={result.ats_feedback.formatting} />
          <ProgressRow label="Keywords" value={result.ats_feedback.keywords} />
          <ProgressRow label="Resume Structure" value={result.ats_feedback.structure} />
          <ProgressRow label="Readability" value={result.ats_feedback.readability} />
          <ProgressRow label="Relevant Skills" value={result.ats_feedback.skills} />
        </div>
        <p className="text-sm text-muted leading-relaxed border-t border-border pt-4">
          {result.ats_feedback.explanation}
        </p>
      </section>

      {/* Keyword Matching */}
      <section className="bg-surface rounded-2xl border border-border shadow-card p-6 mb-8">
        <h2 className="font-display font-bold text-lg text-ink mb-5">Keyword Matching</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-semibold text-ink mb-3">Matched Keywords</p>
            <BadgeRow items={result.matched_keywords} variant="matched" emptyLabel="No direct matches found" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-3">Missing Keywords</p>
            <BadgeRow items={result.missing_keywords} variant="missing" emptyLabel="No major gaps found" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-3">Partially Matched</p>
            <BadgeRow items={result.partial_keywords} variant="partial" emptyLabel="None" />
          </div>
        </div>
      </section>

      {/* Skill Gap Analysis */}
      <section className="bg-surface rounded-2xl border border-border shadow-card p-6 mb-8">
        <h2 className="font-display font-bold text-lg text-ink mb-5">Skill Gap Analysis</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm font-semibold text-ink mb-3">Your Current Skills</p>
            <BadgeRow items={result.current_skills} variant="neutral" emptyLabel="No clear skills detected in resume text" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-3">Skills Required For This Job</p>
            <BadgeRow items={result.required_skills} variant="neutral" emptyLabel="No specific skills detected in job description" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Skills You Should Improve</p>
          {result.skill_gaps.length === 0 ? (
            <p className="text-sm text-muted italic">No major gaps — great alignment with this role.</p>
          ) : (
            <div className="space-y-2">
              {result.skill_gaps.map((g) => (
                <div
                  key={g.skill}
                  className="flex items-center justify-between bg-canvas rounded-xl px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink">{g.skill}</span>
                  <PriorityPill priority={g.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Resume Improvements */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-ink mb-5">Resume Improvements</h2>
        <div className="space-y-5">
          <ImprovementCard
            title="Professional Summary"
            before={result.summary_current || "No summary section was detected in this resume."}
            after={result.summary_improvement || "Add a 2-3 sentence summary highlighting the skills you already have."}
          />
          {result.project_improvements.map((p, i) => (
            <ImprovementCard
              key={i}
              title={p.title || "Project Description"}
              before={p.before}
              after={p.after}
            />
          ))}
          {result.experience_improvements.map((e, i) => (
            <ImprovementCard
              key={i}
              title={`Experience Bullet Point ${i + 1}`}
              before={e.before}
              after={e.after}
              beforeLabel="Before"
              afterLabel="AI Suggested"
            />
          ))}
        </div>
      </section>

      {/* Next steps */}
      <section className="grid md:grid-cols-2 gap-5">
        <button
          onClick={() => navigate("/career")}
          className="text-left bg-ink text-white rounded-2xl p-6 hover:bg-brand-700 transition-base"
        >
          <p className="font-display font-bold text-lg mb-1">Career Improvement Plan</p>
          <p className="text-sm text-white/80">See your field readiness score and recommended next steps.</p>
        </button>
        <button
          onClick={() => navigate("/interview")}
          className="text-left bg-surface border border-border rounded-2xl p-6 hover:border-brand-300 hover:bg-brand-50 transition-base"
        >
          <p className="font-display font-bold text-lg text-ink mb-1">Interview Preparation</p>
          <p className="text-sm text-muted">Practice with questions generated from your resume and this job.</p>
        </button>
      </section>
    </div>
  );
}
