/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#bccffd',
          300: '#90adfb',
          400: '#6081f7',
          500: '#3d57f2',
          600: '#2637e7',
          700: '#1e2bcc',
          800: '#1e27a5',
          900: '#1f2782',
        },
        surface: {
          DEFAULT: '#0f1117',
          card:    '#161923',
          border:  '#1f2535',
          muted:   '#8b9ab5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
