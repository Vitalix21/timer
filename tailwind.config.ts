// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
    content: [
        "./src/popup/index.html",
        "./src/**/*.{ts,tsx}", // Скануємо лише TS/TSX файли
    ],
    theme: {
        extend: {
            fontFamily: {
              sans: ["Roboto", "components-sans-serif", "system-components"]
            },
            // Тут можна додати свої змінні, наприклад:
            colors: {
                "timer-bg": "#1e293b",
                "main-navy": "#020617",
            },
            boxShadow: {
                "soft": "0 10px 30px -10px rgba(0,0,0,0.1)",
            }
        },
    },
    plugins: [],
} satisfies Config