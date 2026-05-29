import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist", "node_modules"],
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["src/**/*.ts"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            },
        },
        rules: {
            // Твої запити
            "@typescript-eslint/no-explicit-any": "error", // Повна заборона any (замість warn)
            "@typescript-eslint/consistent-type-assertions": ["error", {
                assertionStyle: "never", // Заборона використання 'as' та '<Type>'
            }],

            // "Круті" правила для професійного коду
            "prefer-const": "error", // Якщо змінна не перепризначається — тільки const
            "no-var": "error", // Забудь про var назавжди
            "eqeqeq": ["error", "always"], // Тільки суворе порівняння === замість ==
            "@typescript-eslint/no-non-null-assertion": "error", // Заборона оператора '!' (змушує перевіряти на null/undefined)
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"], // Перевага interface перед type [cite: 2026-02-08]
            "no-console": ["warn", { allow: ["warn", "error"] }], // Консоль тільки для важливих речей
            "no-debugger": "error", // Не забувай дебаггер у коді перед деплоєм
        },
    },
);