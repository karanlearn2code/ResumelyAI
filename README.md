# ResumeAI — AI Resume Analyzer & Career Improvement

An AI-powered resume analyzer built as an NTCC project. Upload a resume (PDF),
paste a job description, pick a target career field, and get:

- An ATS compatibility score with a formatting / keywords / structure / readability / skills breakdown
- A job match score and keyword comparison (matched / missing / partially matched)
- A skill gap analysis with priority levels
- Concrete resume rewrite suggestions (summary, projects, experience bullets)
- A field-specific career improvement plan
- AI-generated interview questions (Technical / Project / HR)
- A downloadable text report

The app uses a **free AI API** (Google Gemini free tier, or Groq) and also
ships with a **mock/demo mode**, so it can be demonstrated with no key at all.
Switch engines with one environment variable (`AI_PROVIDER`).

---

## 1. Project Structure

```
resumeai/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   └── analyze.py           # /api/analyze, /api/report, /api/session
│   ├── services/
│   │   ├── pdf_extractor.py     # PDF -> text (pdfplumber)
│   │   ├── mock_engine.py       # deterministic demo-mode analysis
│   │   ├── ai_service.py        # Gemini / Groq / mock provider switch
│   │   └── report_generator.py  # builds the downloadable .txt report
│   ├── models/
│   │   └── schemas.py           # Pydantic contract for the AI response
│   └── utils/
│       └── validators.py        # friendly error messages for bad input
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── main.jsx / App.jsx
        ├── components/          # Navbar, UploadBox, ScoreCard, etc.
        ├── pages/                # Home, ResumeAnalyzer, Results, CareerImprovement, InterviewPrep
        ├── services/api.js       # calls the FastAPI backend
        ├── hooks/useAnalysis.jsx # shared state (React Context)
        └── utils/format.js
```

---

## 2. Requirements

- Python 3.10+
- Node.js 18+ and npm

---

## 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env if needed
```

Run it:

```bash
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`.
Check `http://localhost:8000/api/health` to confirm it's running and see
whether mock mode is on.

---

## 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env            # points the frontend at the backend URL
npm run dev
```

Open `http://localhost:5173`.

---

## 5. Environment Variables

**backend/.env** (on Render: Dashboard -> Environment)

| Variable | Description | Default |
|---|---|---|
| `AI_PROVIDER` | `gemini`, `groq` or `mock` (demo mode, no key). | `mock` |
| `GEMINI_API_KEY` | Free key from https://aistudio.google.com/apikey | (empty) |
| `GEMINI_MODEL` | Gemini model name. | `gemini-2.5-flash` |
| `GROQ_API_KEY` | Free key from https://console.groq.com/keys | (empty) |
| `GROQ_MODEL` | Groq model name. | `llama-3.3-70b-versatile` |
| `FALLBACK_TO_MOCK` | `true` = show a labelled demo analysis if the free quota runs out. | `false` |
| `MAX_FILE_SIZE_MB` | Max resume upload size. | `5` |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs allowed by CORS. | `http://localhost:5173` |
| `ALLOWED_ORIGIN_REGEX` | Optional regex, e.g. to allow Vercel preview URLs. | (empty) |

**frontend/.env** (on Vercel: Project Settings -> Environment Variables)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Public URL of the backend, no trailing slash. | `http://localhost:8000` |

---

## 6. Getting a Free AI Key

**Option A - Google Gemini (recommended)**
1. Open https://aistudio.google.com/apikey and sign in with a Google account.
2. Click **Create API key**. No credit card or billing is needed for the free tier.
3. In `backend/.env` set:
   ```
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key_here
   ```

**Option B - Groq**
1. Create a free key at https://console.groq.com/keys.
2. Set `AI_PROVIDER=groq` and `GROQ_API_KEY=your_key_here`.

Restart the backend after changing `.env`. Free tiers have rate limits, so if
the quota is hit the user sees a friendly "try again in a minute" message
(or a labelled demo result if `FALLBACK_TO_MOCK=true`). Note that Google may
use free-tier requests to improve its products, so avoid testing with
real personal data you are not comfortable sharing.

---

## 7. How the AI Integration Stays Modular

- `backend/services/ai_service.py` is the *only* place that decides which
  engine runs (`AI_PROVIDER`).
- Both paths return data validated against the same `AnalysisResult` Pydantic
  model in `backend/models/schemas.py`, so the frontend never has to guess
  the shape of the response.
- To add another provider, write one `_call_xxx()` function in
  `ai_service.py` and register it in `PROVIDERS` - nothing else changes.

---

## 8. Deployment: Render (backend) + Vercel (frontend)

Deploy the backend first, because the frontend needs its URL.

### Step 1 - Push to GitHub
Push the whole `resumeai/` folder to a GitHub repository. Make sure no
`.env` file is committed (`.gitignore` already excludes it).

### Step 2 - Backend on Render
1. Render dashboard -> **New -> Web Service** -> connect your repo.
   (Or **New -> Blueprint** to use the included `render.yaml`.)
2. Settings if filling in manually:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance type:** Free
3. Add environment variables: `AI_PROVIDER=gemini`, `GEMINI_API_KEY=...`,
   `PYTHON_VERSION=3.11.9`, `FALLBACK_TO_MOCK=true`, and
   `ALLOWED_ORIGINS=http://localhost:5173` for now.
4. Deploy, then open `https://YOUR-SERVICE.onrender.com/api/health`.
   You should see `{"status":"ok","ai_provider":"gemini",...}`.

### Step 3 - Frontend on Vercel
1. Vercel dashboard -> **Add New -> Project** -> import the same repo.
2. Set **Root Directory** to `frontend`. Framework preset: **Vite**
   (build `npm run build`, output `dist`).
3. Add environment variable `VITE_API_BASE_URL` =
   `https://YOUR-SERVICE.onrender.com` (no trailing slash).
4. Deploy. `frontend/vercel.json` makes page refreshes work on routes
   like `/analyzer`.

### Step 4 - Connect them (CORS)
Back in Render, set `ALLOWED_ORIGINS` to your Vercel URL, for example
`https://resumeai.vercel.app` (add several URLs separated by commas), and
let it redeploy. Without this step the browser blocks requests.

### Good to know about the free tiers
- Render's free service sleeps after ~15 minutes idle; the first request
  can take up to a minute. The site pings the backend on load to wake it
  early. Open the site once before a live demo.
- Render's free disk is temporary. That fits this app, which does not
  store resumes permanently (analysis results are kept in memory only
  until the user clicks "Clear & Start Over").
- Vite bakes `VITE_API_BASE_URL` in at build time, so redeploy the
  frontend after changing it.

---

## 9. Notes on AI Behavior

The AI layer (mock or real) is instructed to:

- Never invent skills, experience, numbers, or certifications not present in
  the resume text.
- Only mark a skill as "current" if it is literally found in the resume.
- Only flag a keyword as "missing" if the job description actually requires it.
- Treat the ATS score as an estimate, not a guarantee of how any real
  employer's applicant tracking system will score the resume.

This is enforced in two places: the system prompt sent to the real AI model,
and the rule-based logic of the mock engine, which only ever reports what it
can literally find via keyword matching in the uploaded text.
