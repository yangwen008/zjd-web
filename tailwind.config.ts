import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1a2e23',
          green: '#2C4C3B',
          light: '#3d6b52',
          accent: '#4a8c6a',
          gold: '#c9a84c',
          silver: '#8a8a8a',
          bronze: '#a0785a',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
