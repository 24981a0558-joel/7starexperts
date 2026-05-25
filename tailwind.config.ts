// ─────────────────────────────────────────────────────────────────────────────
// TAILWIND CSS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Tailwind CSS is a utility-first CSS framework.
// Instead of writing custom CSS, you add classes like:
//   "flex items-center gap-4 bg-white rounded-xl p-6 shadow-sm"
//
// content: tells Tailwind which files to scan for class names
//   → it removes unused styles from production build (tiny CSS file!)
// ─────────────────────────────────────────────────────────────────────────────

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom brand colors for 7StarExperts
      colors: {
        // Royal dark navy — primary
        royal: {
          50:  '#eef1fb',
          100: '#d5dcf6',
          200: '#aab8ec',
          300: '#7f95e3',
          400: '#5471d9',
          500: '#2a4fc5',   // deep royal blue
          600: '#1e3b9b',
          700: '#152c79',
          800: '#0d1e56',
          900: '#060f33',
          950: '#030820',
        },
        // Gold accent
        gold: {
          100: '#fef9e7',
          200: '#fdf0bd',
          300: '#fce47a',
          400: '#fbd237',
          500: '#f0b429',   // rich gold
          600: '#d49a0f',
          700: '#a87a09',
        },
        // Surface colors
        surface: {
          dark:    '#0f172a',  // main dark bg
          darker:  '#070d1a',  // sidebar bg
          card:    '#1e293b',  // card bg
          border:  '#2d3f5e',  // border
          muted:   '#64748b',  // muted text
        },
      },
      // Custom font family
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
