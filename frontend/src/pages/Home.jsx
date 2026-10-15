import { useNavigate } from "react-router-dom";
import { ArrowRight, Target, Puzzle, TrendingUp, Upload, FileText, Cpu, Sparkles } from "lucide-react";

const BENEFITS = [
  {
    icon: Target,
    title: "ATS Analysis",
    description: "Understand how ATS-friendly your resume is, broken down by formatting, structure, and keywords.",
  },
  {
    icon: Puzzle,
    title: "Job Matching",
    description: "Compare your resume against a specific job description and see exactly where it lines up.",
  },
  {
    icon: TrendingUp,
    title: "Career Improvement",
    description: "Discover missing skills and get concrete, field-specific steps to close the gap.",
  },
];

const STEPS = [
  { icon: Upload, title: "Upload Resume", description: "Drop in your PDF resume — nothing leaves your session unless you analyze it." },
  { icon: FileText, title: "Add Job Description", description: "Paste the job posting you're targeting so the analysis is specific to that role." },
  { icon: Cpu, title: "AI Analyzes", description: "Your resume and the job description are compared for keywords, skills, and structure." },
  { icon: Sparkles, title: "Get Recommendations", description: "Receive an ATS score, skill gaps, resume rewrites, and interview questions." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-ink leading-[1.1] tracking-tight">
            Turn Your Resume Into Your Career Advantage
          </h1>
          <p className="mt-5 text-lg text-muted max-w-lg leading-relaxed">
            Analyze your resume, match it with job descriptions, discover skill
            gaps, improve your resume, and prepare for interviews with AI.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/analyzer")}
              className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-5 py-3 rounded-xl hover:bg-brand-700 transition-base"
            >
              Analyze My Resume <ArrowRight size={17} />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-border text-ink font-semibold px-5 py-3 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-base"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative">
          <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold text-ink text-sm">Resume Analysis</p>
              <span className="text-xs font-semibold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full">Complete</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "ATS Score", value: 78 },
                { label: "Job Match", value: 74 },
              ].map((s) => (
                <div key={s.label} className="bg-canvas rounded-xl p-3.5">
                  <p className="text-2xl font-display font-bold text-ink">{s.value}%</p>
                  <p className="text-xs text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { label: "Keywords", value: 68 },
                { label: "Skills", value: 72 },
                { label: "Structure", value: 90 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink font-medium">{row.label}</span>
                    <span className="text-muted">{row.value}%</span>
                  </div>
                  <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 hidden md:block bg-surface border border-border rounded-xl shadow-card px-4 py-3">
            <p className="text-xs text-muted">Missing keyword</p>
            <p className="text-sm font-semibold text-signal-600">Power BI</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 grid md:grid-cols-3 gap-6">
        {BENEFITS.map((b) => (
          <div key={b.title} className="bg-surface rounded-2xl border border-border shadow-card p-6">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <b.icon size={20} />
            </div>
            <h3 className="font-semibold text-ink mb-1.5">{b.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{b.description}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 md:px-8 py-14">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-ink mb-10 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="w-11 h-11 rounded-xl bg-ink text-white flex items-center justify-center mb-4">
                <s.icon size={19} />
              </div>
              <h3 className="font-semibold text-ink mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.description}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-5 left-[calc(100%-12px)] w-6 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
