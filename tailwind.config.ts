import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chosen for >=4.5:1 contrast with white button text (WCAG AA).
        brand: {
          DEFAULT: '#1d4ed8',
          dark: '#1e40af',
        },
      },
    },
  },
  plugins: [],
};

export default config;
