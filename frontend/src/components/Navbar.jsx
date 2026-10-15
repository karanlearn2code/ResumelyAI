import { NavLink, useNavigate } from "react-router-dom";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/analyzer", label: "Resume Analyzer" },
  { to: "/career", label: "Career Improvement" },
  { to: "/interview", label: "Interview Prep" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-base px-1 py-2 border-b-2 ${
      isActive
        ? "text-ink border-brand-500"
        : "text-muted border-transparent hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-border">
      <nav className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-display font-bold text-lg text-ink"
        >
          <span className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white">
            <Sparkles size={16} strokeWidth={2.5} />
          </span>
          ResumeAI
        </button>

        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:block">
          <button
            onClick={() => navigate("/analyzer")}
            className="bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-base"
          >
            Analyze Resume
          </button>
        </div>

        <button
          className="md:hidden text-ink"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-surface px-5 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `py-2.5 text-sm font-medium ${isActive ? "text-brand-600" : "text-muted"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              navigate("/analyzer");
            }}
            className="mt-2 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
          >
            Analyze Resume
          </button>
        </div>
      )}
    </header>
  );
}
