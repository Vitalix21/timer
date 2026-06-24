import { timer, UI } from "../theme/theme";
import settingsIconUrl from "../../assets/settings-icon.svg";
import doneIcon from "../../assets/done.svg";
import eyeIcon from "../../assets/eye-icon.svg";
import noSoundIcon from "../../assets/no-Sound-icon.svg";
import xRestartIcon from "../../assets/x.svg";
import autoRestartOn from "../../assets/auto-restart-on.svg";
import soundOn from "../../assets/sound-on.svg";
import moveToMainUIIcon from "../../assets/move-to-main-UI-icon.svg";

export async function renderSettingsScreen(
  onNavigate: (screen: "main") => void,
): Promise<void> {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  const storage = await chrome.storage.local.get({
    workInterval: "20",
    alertSound: "on",
    autoRestart: "on",
  });
  const savedInterval = String(storage.workInterval);
  const isSoundOn = storage.alertSound;
  const isRestartOn = storage.autoRestart;

  app.innerHTML = `
   <div class="${UI.uiWrapper} flex flex-col h-[500px] overflow-hidden">
     <!-- Header -->
     <div class="w-full flex items-center justify-between px-6 mt-[25px] shrink-0 mb-[30px]">
       <h1 class="text-xl ml-[20px]" style="font-weight: 500; color: var(--text-primary);">Settings</h1>
       <img src="${settingsIconUrl}" alt="" class="settings-icon w-[32px] h-[35px] mr-[20px] mt-[-20px]">
     </div>
     
     <!-- Containers -->
     <div class="flex flex-1 w-full justify-center gap-[20px] px-2">
     
       <!-- Work Interval Card -->
       <div class="w-[131px] h-[232px] rounded-[25px] flex flex-col items-center p-2 shrink-0 shadow-sm" style="background: var(--settings-card-bg);">
           
           <div class="flex justify-between items-center gap-[10px] mb-2">
             <p class="m-0" style="font-weight: 600; font-size: 13px; color: var(--text-primary);">Work Interval</p>
             <img src="${eyeIcon}" class="alert-icon h-[18px] w-[18px] opacity-80" alt="">
           </div>
           
           <div class="flex flex-col gap-[8px]">
             ${generateIntervalButton("20", savedInterval)}
             ${generateIntervalButton("30", savedInterval)}
             ${generateIntervalButton("45", savedInterval)}
             ${generateIntervalButton("60", savedInterval)}
           </div>
           
       </div> 
    
       <!-- Alerts Card -->
       <div class="flex justify-center">
        <div class="w-[131px] h-[232px] rounded-[25px] flex flex-col items-center p-2 shrink-0 shadow-sm" style="background: var(--settings-card-bg);">
         <p class="text-[10px] text-center mt-[15px] mb-[15px]" style="font-weight: 600; font-size:13px; color: var(--text-primary);">Optimization</p>
           
           <!-- Sound Toggle (ввімкнений) -->
           <div class="flex flex-row items-end justify-center gap-[5px]">
      <div class ="flex justify-center w-full">
            <div class="flex flex-col items-center">
             <p class="m-0" style="font-weight: 500; font-size: 13px; margin-right:5px; color: var(--text-primary);margin-bottom:22px;">Sound</p>
             
             <img id="sound-icon" src="${isSoundOn ? soundOn : noSoundIcon}" class="alert-icon w-[24px] h-[24px] mb-[5px]"> 
             
             <div id="toggle-sound" class="w-[52px] h-[19px] rounded-[25px] cursor-pointer relative" 
                  data-state="${isSoundOn ? "on" : "off"}" 
                  style="background: ${isSoundOn ? "var(--toggle-alerts-on-bg)" : "var(--toggle-alerts-off-bg)"}; transition: background 0.3s;">
              <div class="w-[17px] h-[17px] rounded-full absolute" 
                   style="background: var(--toggle-alerts-thumb); top: 1px; left: ${isSoundOn ? "34px" : "1px"}; transition: left 0.3s;"></div>
              </div>
            </div>
         </div>
         
         <div class="flex flex-col items-center w-full">
             <p class="m-0" style="font-weight: 500; margin-left: 10px ; font-size: 13px; color: var(--text-primary);">Auto-restart</p>
             
             <img id="restart-icon" src="${isRestartOn ? autoRestartOn : xRestartIcon}" class="alert-icon w-[24px] h-[24px] mb-[5px]">
          
             <div id="toggle-restart" class="w-[52px] h-[19px] rounded-[25px] cursor-pointer relative" 
                  data-state="${isRestartOn ? "on" : "off"}" 
                  style="background: ${isRestartOn ? "var(--toggle-restart-on-bg)" : "var(--toggle-restart-off-bg)"}; transition: background 0.3s;">
               <div class="w-[17px] h-[17px] rounded-full absolute" 
                    style="background: var(--toggle-alerts-thumb); top: 1px; left: ${isRestartOn ? "34px" : "1px"}; transition: left 0.3s;"></div>
             </div>
         </div>     
</div>
</div>
     
     </div> 
</div>
      
     
     <!-- CountDown Button -->
     <div class="flex justify-center items-center" style="margin-top: auto; margin-bottom: -15px;">
       <button id="back-btn" class="rounded-full w-[90px] h-[90px] cursor-pointer border-none flex flex-col items-center justify-center" style="background: var(--move-to-bg);">
         <img src="${moveToMainUIIcon}" class="w-[25px] h-[15px] mb-1">
         <p class="m-0" style="font-weight: 600; font-size: 10px; color: #FFFFFF;">Timer</p>
       </button>
     </div>
     
   </div>
`;
  setupWorkIntervalButtons();
  setupToggleSwitches();

  const backBtn = document.querySelector<HTMLButtonElement>("#back-btn");
  if (backBtn) {
    backBtn.onclick = () => onNavigate("main");
  }
}

function generateIntervalButton(value: string, selected: string): string {
  const isSelected = value === selected;
  const checkmark = isSelected
    ? `<img src="${doneIcon}" class="checkmark w-[20px] h-[20px] absolute right-[10px]"/>`
    : "";
  const bgStyle = isSelected
    ? "background: var(--interval-selected-bg);"
    : "background: var(--interval-default-bg);";

  return `
        <button class="work-interval-btn w-[120px] h-[35px] flex items-center justify-center relative rounded-full cursor-pointer border-none" data-value="${value}" style="${bgStyle}">
        <span class="text-[#000000]" style="font-weight: 600;">${value}:00</span>
        ${checkmark}
        </button>
    `;
}

function setupWorkIntervalButtons() {
  const btns =
    document.querySelectorAll<HTMLButtonElement>(".work-interval-btn");

  btns.forEach((btn) => {
    // 🔴 ФІКС: Додали async
    btn.onclick = async () => {
      const value = parseInt(btn.dataset.value || "20");
      await chrome.storage.local.set({ workInterval: value.toString() });

      // 🔴 ФІКС: Чекаємо запису в базу
      await timer.setDuration(value);

      // Оновлюємо UI кнопок
      btns.forEach((b) => {
        b.style.background = "var(--interval-default-bg)";
        const existingCheckmark = b.querySelector("img.checkmark");
        if (existingCheckmark) existingCheckmark.remove();
      });

      btn.style.background = "var(--interval-selected-bg)";
      const checkmark = document.createElement("img");
      // Переконайся, що doneIcon імпортовано зверху файлу!
      checkmark.src = doneIcon;
      checkmark.className = "checkmark w-[20px] h-[20px] absolute right-[10px]";
      btn.appendChild(checkmark);
    };
  });
}

function setupToggleSwitches() {
  const soundToggle = document.querySelector<HTMLDivElement>("#toggle-sound");
  const restartToggle =
    document.querySelector<HTMLDivElement>("#toggle-restart");

  const soundIcon = document.querySelector<HTMLImageElement>("#sound-icon");
  const restartIcon = document.querySelector<HTMLImageElement>("#restart-icon");

  // ✅ Sound Toggle
  if (soundToggle) {
    soundToggle.addEventListener("click", async () => {
      const thumb = soundToggle.querySelector<HTMLDivElement>("div");

      if (!thumb) return;

      const isCurrentlyOn = soundToggle.getAttribute("data-state") === "on";
      const nextState = !isCurrentlyOn;
      await chrome.storage.local.set({ alertSound: nextState });

      soundToggle.setAttribute("data-state", nextState ? "on" : "off");
      soundToggle.style.background = nextState
        ? "var(--toggle-alerts-on-bg)"
        : "var(--toggle-alerts-off-bg)";
      thumb.style.left = nextState ? "34px" : "1px";
      if (soundIcon) soundIcon.src = nextState ? soundOn : noSoundIcon;
    });
  }

  if (restartToggle) {
    restartToggle.addEventListener("click", async () => {
      const thumb = restartToggle.querySelector<HTMLDivElement>("div");
      if (!thumb) return;

      const isCurrentlyOn = restartToggle.getAttribute("data-state") === "on";
      const nextState = !isCurrentlyOn;

      await chrome.storage.local.set({ autoRestart: nextState });

      restartToggle.setAttribute("data-state", nextState ? "on" : "off");
      restartToggle.style.background = nextState
        ? "var(--toggle-restart-on-bg)"
        : "var(--toggle-restart-off-bg)";
      thumb.style.left = nextState ? "34px" : "1px";
      if (restartIcon)
        restartIcon.src = nextState ? autoRestartOn : xRestartIcon;
    });
  }
}
