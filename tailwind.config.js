/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/sections/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			'mui-primary': {
  				lighter: 'var(--mui-primary-lighter)',
  				light: 'var(--mui-primary-light)',
  				main: 'var(--mui-primary-main)',
  				dark: 'var(--mui-primary-dark)',
  				darker: 'var(--mui-primary-darker)',
  				contrast: 'var(--mui-primary-contrast)',
  				DEFAULT: 'var(--mui-primary-main)'
  			},
  			'mui-secondary': {
  				lighter: 'var(--mui-secondary-lighter)',
  				light: 'var(--mui-secondary-light)',
  				main: 'var(--mui-secondary-main)',
  				dark: 'var(--mui-secondary-dark)',
  				darker: 'var(--mui-secondary-darker)',
  				contrast: 'var(--mui-secondary-contrast)',
  				DEFAULT: 'var(--mui-secondary-main)'
  			},
  			'mui-info': {
  				lighter: 'var(--mui-info-lighter)',
  				light: 'var(--mui-info-light)',
  				main: 'var(--mui-info-main)',
  				dark: 'var(--mui-info-dark)',
  				darker: 'var(--mui-info-darker)',
  				contrast: 'var(--mui-info-contrast)',
  				DEFAULT: 'var(--mui-info-main)'
  			},
  			'mui-success': {
  				lighter: 'var(--mui-success-lighter)',
  				light: 'var(--mui-success-light)',
  				main: 'var(--mui-success-main)',
  				dark: 'var(--mui-success-dark)',
  				darker: 'var(--mui-success-darker)',
  				contrast: 'var(--mui-success-contrast)',
  				DEFAULT: 'var(--mui-success-main)'
  			},
  			'mui-warning': {
  				lighter: 'var(--mui-warning-lighter)',
  				light: 'var(--mui-warning-light)',
  				main: 'var(--mui-warning-main)',
  				dark: 'var(--mui-warning-dark)',
  				darker: 'var(--mui-warning-darker)',
  				contrast: 'var(--mui-warning-contrast)',
  				DEFAULT: 'var(--mui-warning-main)'
  			},
  			'mui-error': {
  				lighter: 'var(--mui-error-lighter)',
  				light: 'var(--mui-error-light)',
  				main: 'var(--mui-error-main)',
  				dark: 'var(--mui-error-dark)',
  				darker: 'var(--mui-error-darker)',
  				contrast: 'var(--mui-error-contrast)',
  				DEFAULT: 'var(--mui-error-main)'
  			},
  			'mui-grey': {
  				'50': 'var(--mui-grey-50)',
  				'100': 'var(--mui-grey-100)',
  				'200': 'var(--mui-grey-200)',
  				'300': 'var(--mui-grey-300)',
  				'400': 'var(--mui-grey-400)',
  				'500': 'var(--mui-grey-500)',
  				'600': 'var(--mui-grey-600)',
  				'700': 'var(--mui-grey-700)',
  				'800': 'var(--mui-grey-800)',
  				'900': 'var(--mui-grey-900)'
  			},
  			'mui-background': {
  				paper: 'var(--mui-background-paper)',
  				default: 'var(--mui-background-default)',
  				neutral: 'var(--mui-background-neutral)'
  			},
  			'mui-text': {
  				primary: 'var(--mui-text-primary)',
  				secondary: 'var(--mui-text-secondary)',
  				disabled: 'var(--mui-text-disabled)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

