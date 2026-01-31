/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		// Override base font families (not extend)
		fontFamily: {
			sans: ['Inter', 'sans-serif'],
			mono: ['JetBrains Mono', 'monospace']
		},
		extend: {
			colors: {
				background: '#F9FAFB',
				surface: '#FFFFFF',
				foreground: '#2D3142',
				primary: '#E07A5F',
				secondary: '#81B29A',
				muted: '#9CA3AF',
				'muted-foreground': '#6B7280',
				border: '#E5E7EB',
				koa: {
					base: '#2D3142',
					eye: '#E07A5F',
					warn: '#E07A5F',
					danger: '#E07A5F',
					accent: '#81B29A'
				}
			},
			boxShadow: {
				brutal: '3px 3px 0px 0px rgba(0,0,0,0.15)',
				'brutal-lg': '5px 5px 0px 0px rgba(0,0,0,0.15)',
				'brutal-hover': '4px 4px 0px 0px rgba(0,0,0,0.20)',
				'brutal-active': '0px 0px 0px 0px rgba(0,0,0,0.15)'
			},
			borderRadius: {
				DEFAULT: '2px',
				md: '4px',
				lg: '6px'
			}
		}
	},
	plugins: []
};
