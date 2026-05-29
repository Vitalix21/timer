console.warn("🚨 MAIN.TS УСПІШНО ЗАПУСТИВСЯ!");
import "./index.css";
import playSvg from "../assets/play.svg"
import { initTheme, timer, updateTimerDisplay } from "./theme/theme";
import { renderMainUi } from "./screens/mainScreen.ts";
import { renderSettingsScreen } from "./screens/settingsScreen.ts";


type Screen = 'main' | 'settings';
let currentScreen: Screen = 'main';
function navigate(screen: Screen) {
    currentScreen = screen;

    if (screen === 'main') {
        renderMainUi(navigate);
    } else {
        renderSettingsScreen(navigate);
    }
}

// Ініціалізація
initTheme();
navigate('main');

// Підписка на таймер
timer.onTickCallback(() => {
    if (currentScreen === 'main') {
        updateTimerDisplay();
    }
});

timer.onCompleteCallback(async () => {
    // Якщо юзер зараз дивиться на головний екран — оновлюємо його
    if (currentScreen === 'main') {
        // Оновлюємо цифри та стрілочки
        await updateTimerDisplay();

        // 🔴 ФІКС: Шукаємо елемент іконки на сторінці перед тим, як міняти src
        const icon = document.querySelector<HTMLImageElement>('#play-pause-icon');
        if (icon) {
            icon.src =  playSvg;
        }
    }
});
// Слухаємо команди напряму від Service Worker-а
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "TIMER_FINISHED") {

        // 1. Миттєво оновлюємо іконку на Play
        const icon = document.querySelector<HTMLImageElement>('#play-pause-icon');
        if (icon) {
            icon.src = playSvg;
        }

        // 2. Оновлюємо цифри
        if (currentScreen === 'main') {
            updateTimerDisplay();
        }

        // 3. МАГІЯ: Автоматично закриваємо попап!
        // Юзер одразу побачить круглий віджет на сторінці браузера.
        window.close();
    }
});


