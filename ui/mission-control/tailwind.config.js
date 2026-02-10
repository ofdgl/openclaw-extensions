/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Kamino dark theme
                kamino: {
                    900: '#0c0e14',
                    800: '#111827',
                    700: '#1f2937',
                    600: '#374151',
                    500: '#6b7280',
                    accent: '#3b82f6',
                    success: '#22c55e',
                    warning: '#eab308',
                    danger: '#ef4444',
                }
            }
        },
    },
    plugins: [],
}
