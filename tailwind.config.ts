import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        surface: {
          50: '#FAFBFC',
          100: '#F4F5F7',
          200: '#E9EBEF',
          300: '#DFE1E6',
          400: '#C1C7D0',
          500: '#A5ADBA',
        },
        ink: {
          DEFAULT: '#1A1F36',
          muted: '#525F7F',
          light: '#8792A2',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 8px 24px -4px rgba(0, 0, 0, 0.12)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 16px 48px -8px rgba(0, 0, 0, 0.16)',
        'glow': '0 0 24px -4px rgba(99, 102, 241, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at top, var(--tw-gradient-stops))',
        'premium-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'subtle-gradient': 'linear-gradient(180deg, #FAFBFC 0%, #F4F5F7 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
