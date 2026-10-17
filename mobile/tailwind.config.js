module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ifblue: "#0054c7",
        ink: "#182b42",
        muted: "#5e6c7b",
        surface: "#f5f7fa",
      },
    },
  },
  plugins: [],
};
