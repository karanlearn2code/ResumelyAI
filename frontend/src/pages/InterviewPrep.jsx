import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import InterviewQuestion from "../components/InterviewQuestion.jsx";
import { EmptyState } from "../components/Loader.jsx";
import { useAnalysis } from "../hooks/useAnalysis.jsx";

const CATEGORY_META = {
  Technical: { title: "Technical Questions", description: "Based on the tools and skills found in your resume." },
  Project: { title: "Project Questions", description: "Based on the projects and experience described in your resume." },
  HR: { title: "HR Questions", description: "General questions asked in most interviews." },
};

export default function InterviewPrep() {
  const navigate = useNavigate();
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <EmptyState
          title="No interview questions yet"
          subtitle="Analyze a resume first to generate interview questions tailored to it and the job description."
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

  const grouped = { Technical: [], Project: [], HR: [] };
  result.interview_questions.forEach((q) => {
    const cat = q.category?.value || q.category;
    if (grouped[cat]) grouped[cat].push(q);
  });

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-12">
      <h1 className="text-3xl font-display font-bold text-ink mb-2">Interview Preparation</h1>
      <p className="text-muted mb-8">
        Questions generated from your resume, the job description, and your target field. Tap a question to see what it's testing.
      </p>

      <div className="space-y-10">
        {Object.entries(grouped).map(([cat, questions]) => {
          if (questions.length === 0) return null;
          const meta = CATEGORY_META[cat];
          return (
            <section key={cat}>
              <h2 className="font-display font-bold text-lg text-ink mb-1">{meta.title}</h2>
              <p className="text-sm text-muted mb-4">{meta.description}</p>
              <div className="space-y-2.5">
                {questions.map((q, i) => (
                  <InterviewQuestion key={i} question={q.question} whatIsTested={q.what_is_tested} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
