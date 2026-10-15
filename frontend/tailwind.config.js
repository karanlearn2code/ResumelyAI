/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10131A",
        surface: "#FFFFFF",
        canvas: "#F6F7F9",
        border: "#E4E7EC",
        muted: "#6B7280",
        brand: {
          50: "#EAF5F3",
          100: "#CFE9E4",
          300: "#63A79C",
          500: "#0F6D66",
          600: "#0B544F",
          700: "#0B4F4A",
        },
        signal: {
          500: "#E4572E",
          600: "#C6441F",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,19,26,0.04), 0 8px 24px -12px rgba(16,19,26,0.12)",
      },
    },
  },
  plugins: [],
};
