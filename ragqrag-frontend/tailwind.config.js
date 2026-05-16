/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        'primary-hover': '#2563EB',
        secondary: '#10B981',
        background: '#FFFFFF',
        card: '#F8FAFC',
        'text-main': '#1F2937',
        'text-muted': '#6B7280',
        accent: '#8B5CF6',
        success: '#059669',
        warning: '#F59E0B',
        error: '#EF4444',
        overlay: 'rgba(0,0,0,0.1)',
        // Additional bright colors for enhanced palette
        'bright-blue': '#06B6D4',
        'bright-green': '#22C55E',
        'bright-purple': '#A855F7',
        'bright-orange': '#FB923C',
        'bright-pink': '#EC4899',
        'bright-indigo': '#6366F1',
        'bright-yellow': '#FACC15',
        'light-gray': '#F9FAFB',
        'medium-gray': '#E5E7EB',
      },
      boxShadow: {
        soft: '0 10px 25px rgba(59, 130, 246, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
        'colorful': '0 8px 32px rgba(59, 130, 246, 0.15)',
        'bright': '0 4px 20px rgba(139, 92, 246, 0.15)',
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '22px',
        '3xl': '24px',
        '4xl': '26px',
        '5xl': '28px',
        '6xl': '32px',
      },
    },
  },
  plugins: [],
};


