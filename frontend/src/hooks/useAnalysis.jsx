import { createContext, useContext, useState, useCallback } from "react";
import { analyzeResume as analyzeResumeApi, clearSession } from "../services/api";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [file, setFile] = useState(null);
  const [targetField, setTargetField] = useState("Data Analyst");
  const [customField, setCustomField] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = useCallback(async () => {
    setError(null);

    if (!file) {
      setError("Please upload a valid PDF resume before continuing.");
      return false;
    }
    if (!jobDescription || jobDescription.trim().length < 20) {
      setError("Please paste a job description (at least a couple of sentences).");
      return false;
    }
    if (targetField === "Other" && !customField.trim()) {
      setError("Please specify your target career field.");
      return false;
    }

    setIsLoading(true);
    try {
      const data = await analyzeResumeApi({ file, jobDescription, targetField, customField });
      setResult(data);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing your resume.");
      setIsLoading(false);
      return false;
    }
  }, [file, jobDescription, targetField, customField]);

  const reset = useCallback(async () => {
    setFile(null);
    setJobDescription("");
    setResult(null);
    setError(null);
    await clearSession();
  }, []);

  const value = {
    file,
    setFile,
    targetField,
    setTargetField,
    customField,
    setCustomField,
    jobDescription,
    setJobDescription,
    result,
    isLoading,
    error,
    setError,
    runAnalysis,
    reset,
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return ctx;
}
