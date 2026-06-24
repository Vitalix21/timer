import { Timer } from "../components/Timer.ts";
import { generateTicks } from "../utils/generateTicks.ts";
import playIconUrl from "../../assets/play.svg";
import pauseIconUrl from "../../assets/pause.svg";

export const UI = {
  uiWrapper:
    "flex flex-col items-center justify-between py-8 h-full w-full bg-[var(--bg-primary)]",
  timerCircle:
    "w-[220px] h-[220px] bg-[var(--bg-timer)] rounded-full flex items-center justify-center flex-col shadow-2xl relative",
};

export function initTheme() {
  chrome.storage.local.get(["theme"], (result) => {
    const savedTheme: string =
      typeof result.theme === "string" ? result.theme : "light";

    document.documentElement.setAttribute("data-theme", savedTheme);
  });
}

export function isDarkMode() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // 1. Оновлюємо візуал у попапі миттєво
  document.documentElement.setAttribute("data-theme", newTheme);

  // 2. Зберігаємо в глобальний "Сейф" розширення (замість localStorage)
  chrome.storage.local.set({ theme: newTheme });
}

// ✅ Робимо async, щоб дочекатися статусу
export function setupPlayPause() {
  const playPauseBtn =
    document.querySelector<HTMLButtonElement>("#play-pause-btn");
  const icon = document.querySelector<HTMLImageElement>("#play-pause-icon");

  if (!playPauseBtn || !icon) return;

  playPauseBtn.onclick = async () => {
    await timer.toggle();
    const isRunning = await timer.getIsRunning();
    icon.src = isRunning ? pauseIconUrl : playIconUrl;
    await updateTimerDisplay();
  };
}

export function setupResetBtn() {
  const resetBtn = document.querySelector<HTMLButtonElement>("#reset-btn");
  if (!resetBtn) return;
  resetBtn.onclick = () => {
    timer.reset(); // Відправляємо команду бекенду

    const icon = document.querySelector<HTMLImageElement>("#play-pause-icon");
    if (icon) {
      icon.src = playIconUrl;
    }
  };
}

// ✅ Ініціалізація без аргументів
export const timer = new Timer();

// ✅ Оновлює ТІЛЬКИ час і стрілочки (додали async/await)
export async function updateTimerDisplay() {
  const timerDisplay =
    document.querySelector<HTMLSpanElement>("#timer-display");
  if (timerDisplay) {
    timerDisplay.textContent = await timer.formatTime();
  }
  await updateTicks();
}

// ✅ Оновлює SVG стрілочки (додали async/await)
export async function updateTicks() {
  const ticksSvg = document.querySelector<SVGElement>("#timer-ticks");
  if (!ticksSvg) return;

  const current = await timer.getCurrentTime();
  const total = await timer.getTotalTime();

  ticksSvg.innerHTML = generateTicks(current, total);
}
