/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          // Core palette - industrial, serious, powerful
          bg: '#08090a',
          'bg-elevated': '#0d0e10',
          surface: '#131416',
          'surface-hover': '#1a1c1f',
          border: '#232528',
          'border-active': '#3a3d42',
          
          // Accent - molten orange (forge fire)
          accent: '#f97316',
          'accent-hover': '#ea580c',
          'accent-muted': '#c2410c',
          'accent-glow': 'rgba(249, 115, 22, 0.15)',
          
          // Text
          text: '#e8e9eb',
          'text-secondary': '#9ca3af',
          'text-muted': '#6b7280',
          
          // Status
          success: '#10b981',
          'success-muted': '#059669',
          warning: '#f59e0b',
          'warning-muted': '#d97706',
          error: '#ef4444',
          'error-muted': '#dc2626',
          info: '#3b82f6',
          'info-muted': '#2563eb',
          
          // Special
          promoted: '#8b5cf6',
          workspace: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(249, 115, 22, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'forge': '0 0 0 1px rgba(249, 115, 22, 0.1), 0 4px 12px rgba(0, 0, 0, 0.5)',
        'forge-lg': '0 0 0 1px rgba(249, 115, 22, 0.15), 0 8px 24px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
