const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// One id per browser tab session - lets the backend remember the last
// analysis for this user so "Download Report" doesn't resend everything.
function getSessionId() {
  let id = sessionStorage.getItem("resumeai_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("resumeai_session_id", id);
  }
  return id;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function parseErrorResponse(response) {
  try {
    const data = await response.json();
    return data.detail || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export async function analyzeResume({ file, jobDescription, targetField, customField }) {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("job_description", jobDescription);
  formData.append("target_field", targetField);
  if (customField) formData.append("custom_field", customField);
  formData.append("session_id", getSessionId());

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    throw new ApiError(
      "Could not reach the ResumeAI server. Make sure the backend is running.",
      0
    );
  }

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new ApiError(message, response.status);
  }

  return response.json();
}

// Render's free tier puts the backend to sleep when idle. Pinging the health
// endpoint as soon as the site opens wakes it up while the user is still
// reading the page, so the first analysis doesn't hit a cold start.
export function warmUpServer() {
  fetch(`${API_BASE_URL}/api/health`).catch(() => {});
}

export async function downloadReport() {
  const sessionId = getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/report/${sessionId}`);
  if (!response.ok) {
    throw new ApiError("No analysis is available to download yet.", response.status);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resumeai_report.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function clearSession() {
  const sessionId = getSessionId();
  sessionStorage.removeItem("resumeai_session_id");
  try {
    await fetch(`${API_BASE_URL}/api/session/${sessionId}`, { method: "DELETE" });
  } catch {
    // best-effort cleanup only
  }
}

export { ApiError };
