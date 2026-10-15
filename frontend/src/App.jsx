import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { warmUpServer } from "./services/api";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { AnalysisProvider } from "./hooks/useAnalysis.jsx";
import Home from "./pages/Home.jsx";
import ResumeAnalyzer from "./pages/ResumeAnalyzer.jsx";
import Results from "./pages/Results.jsx";
import CareerImprovement from "./pages/CareerImprovement.jsx";
import InterviewPrep from "./pages/InterviewPrep.jsx";

export default function App() {
  useEffect(() => {
    warmUpServer();
  }, []);

  return (
    <AnalysisProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyzer" element={<ResumeAnalyzer />} />
            <Route path="/results" element={<Results />} />
            <Route path="/career" element={<CareerImprovement />} />
            <Route path="/interview" element={<InterviewPrep />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AnalysisProvider>
  );
}
