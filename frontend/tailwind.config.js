/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F7F9',
        surface: '#FFFFFF',
        ink: '#17202A',
        muted: '#5B6573',
        line: '#DDE1E7',
        progress: {
          DEFAULT: '#0F766E',
          hover: '#0D655E',
          light: '#F0FDFA',
          subtle: '#CCFBF1',
        },
        changed: {
          DEFAULT: '#B45309',
          hover: '#92400E',
          light: '#FFFBEB',
          subtle: '#FEF3C7',
        },
        // Alias brand to teal progress for compatibility
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0F766E',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        btn: '6px',
        panel: '10px',
      }
    },
  },
  plugins: [],
}
