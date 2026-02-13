export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F5F2",
        card: "#FFFFFF",
        primary: "#6B8E7B",
        accent: "#EADFD0",
        textPrimary: "#2E2E2E",
        textMuted: "#6E6E6E",
      },
      borderRadius: {
        xl: "16px",
        '2xl': "20px"
      }
    },
  },
  plugins: [],
}
