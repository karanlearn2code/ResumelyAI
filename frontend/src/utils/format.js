export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const TARGET_FIELDS = [
  "Data Analyst",
  "Data Scientist",
  "Python Developer",
  "Web Developer",
  "Software Developer",
  "Other",
];

export function scoreTone(score) {
  if (score >= 75) return { text: "text-brand-600", bar: "bg-brand-500", ring: "#0F6D66" };
  if (score >= 50) return { text: "text-amber-600", bar: "bg-amber-500", ring: "#D97706" };
  return { text: "text-signal-600", bar: "bg-signal-500", ring: "#E4572E" };
}
