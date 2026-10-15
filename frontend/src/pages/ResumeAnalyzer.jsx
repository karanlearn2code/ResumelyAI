import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import UploadBox from "../components/UploadBox.jsx";
import { AnalyzingLoader, ErrorBanner } from "../components/Loader.jsx";
import { useAnalysis } from "../hooks/useAnalysis.jsx";
import { TARGET_FIELDS } from "../utils/format";

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const {
    file,
    setFile,
    targetField,
    setTargetField,
    customField,
    setCustomField,
    jobDescription,
    setJobDescription,
    isLoading,
    error,
    setError,
    runAnalysis,
  } = useAnalysis();

  const [localError, setLocalError] = useState(null);

  const handleAnalyze = async () => {
    const ok = await runAnalysis();
    if (ok) navigate("/results");
  };

  const activeError = localError || error;

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-ink">Resume Analyzer</h1>
        <p className="text-muted mt-2">Upload your resume and a job description to get a detailed match analysis.</p>
      </div>

      {activeError && (
        <div className="mb-6">
          <ErrorBanner
            message={activeError}
            onDismiss={() => {
              setLocalError(null);
              setError(null);
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface rounded-2xl border border-border shadow-card">
          <AnalyzingLoader />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
              <h2 className="font-semibold text-ink mb-4">Upload Resume</h2>
              <UploadBox
                file={file}
                onFileSelected={setFile}
                onError={(msg) => setLocalError(msg)}
              />
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
              <h2 className="font-semibold text-ink mb-4">Target Career Field</h2>
              <div className="relative">
                <select
                  value={targetField}
                  onChange={(e) => setTargetField(e.target.value)}
                  className="w-full appearance-none border border-border rounded-xl px-4 py-3 text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  {TARGET_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
              {targetField === "Other" && (
                <input
                  type="text"
                  value={customField}
                  onChange={(e) => setCustomField(e.target.value)}
                  placeholder="Enter your target field"
                  className="mt-3 w-full border border-border rounded-xl px-4 py-3 text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-ink">Job Description</h2>
                <span className="text-xs text-muted">{jobDescription.length} characters</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={12}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              className="w-full inline-flex items-center justify-center gap-2 bg-ink text-white font-semibold py-4 rounded-xl hover:bg-brand-700 transition-base text-base"
            >
              Analyze Resume <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
