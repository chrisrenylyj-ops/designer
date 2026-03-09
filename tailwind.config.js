/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        body: '#f6f7f8',
        border: '#e2e8f0',
        muted: '#64748b',
        'muted-bg': '#f1f5f9',
        'card-bg': '#f8fafc',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
