import { toggleTheme } from "../theme/theme";

export function setupToggle() {
    const toggle = document.querySelector<HTMLDivElement>("#toggle-switch");

    if (!toggle) return;

    toggle.onclick = () => {
        toggleTheme();

    };
}