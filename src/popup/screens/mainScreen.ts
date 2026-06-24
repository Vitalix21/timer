import playIconUrl from "../../assets/play.svg";
import pauseIconUrl from "../../assets/pause.svg";
import eyeIconUrl from "../../assets/eye-icon.svg";
import resetIconUrl from "../../assets/timer-reset.svg";
import backIconUrl from "../../assets/back-item.svg";
import {
  setupPlayPause,
  setupResetBtn,
  timer,
  UI,
  updateTicks,
} from "../theme/theme.ts";
import { setupToggle } from "../components/toggle.ts";

export async function renderMainUi(onNavigate: (screen: "settings") => void) {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  const isRunning = await timer.getIsRunning();

  const formattedTime = await timer.formatTime();

  const iconSrc = isRunning ? pauseIconUrl : playIconUrl;

  app.innerHTML = `
       <div class="${UI.uiWrapper}">
         <div class="text-center">
         <h1 class="text-xl text-[var(--text-primary)]" style="font-weight: 500">CountDown</h1>
         </div>
         
         <div class="${UI.timerCircle}">
         <svg id="timer-ticks" class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 220 220" style="z-index: 1;"></svg>
         <img class="mb-[10px]" src="${eyeIconUrl}" alt="eye icon">
            <span id="timer-display" class="text-[24px] font-black text-[var(--text-primary)]" style="font-weight: 900;">${formattedTime}</span>
            <p id="timer-text" class="mt-[-1px] leading-none font-medium text-[14px]" style="color: var(--text-secondary)">until next break</p>
            <div class="flex justify-between">   
            <button id="play-pause-btn" class="w-[42px] h-[30px] bg-[var(--bg-play-btn)] rounded-full border-none flex items-center justify-center mr-[20px] transition-all duration-200 hover:scale-105 active:scale-95">
                <img id="play-pause-icon" src="${iconSrc}" alt="">
            </button>
            <button id="reset-btn" class="w-[42px] h-[30px] bg-[var(--bg-play-btn)] rounded-full border-none flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95">
                <img src="${resetIconUrl}" alt="" class="w-[24px] h-[24px]">
            </button>
            </div>
         </div>
         
         <div class="w-[250px] h-[60px] justify-between flex items-center p-4 rounded-2xl bg-[var(--bg-toggle)]" style="border-radius: 12px">
         <span class="ml-[15px] text-[15px] font-bold text-[var(--text-primary)]" style="font-weight: 900">Dark Mode</span>
         
         <div id="toggle-switch" style="width: 44px;
             height: 24px;
             background: var(--bg-toggle-active);
             border-radius: 12px;
             position: relative;
             cursor: pointer;
             transition: background 0.3s;
             display: flex;
             align-items: center;
             padding: 2px;
             margin-right: 20px;
             ">
         <div id="toggle-thumb" style="width: 25px;
               height: 25px;
               background: white;
               border-radius: 50%;
               position: absolute;
               top:1px;
               left: var(--toggle-pos);
               box-shadow: 0 2px 4px rgba(0,0,0,0.2);
               transition: left 0.3s;"></div>
         </div>
         </div>
         <button id="settings-btn" class="cursor-pointer w-[70px] h-[70px] rounded-full mb-[10px]" style="background: var(--bg-button);">
        <img class="mb-[-10px] " src="${backIconUrl}" alt=""> 
        <p style="font-weight:600; font-size: 10px; color:#FFFFFF">Settings</p>
        </button>
       </div>
    `;
  setupPlayPause();
  setupToggle();
  setupResetBtn();

  // ✅ Початкове малювання стрілочок при відкритті попапу
  await updateTicks();

  const displayElement =
    document.querySelector<HTMLSpanElement>("#timer-display");

  if (displayElement) {
    timer.onTickCallback(async () => {
      // Оновлюємо цифри
      const newTime = await timer.formatTime();
      displayElement.innerText = newTime;

      // Оновлюємо рисочки щосекунди
      await updateTicks();
    });
  }

  const settingsBtn =
    document.querySelector<HTMLButtonElement>("#settings-btn");

  if (settingsBtn) {
    settingsBtn.onclick = () => onNavigate("settings");
  }
}
