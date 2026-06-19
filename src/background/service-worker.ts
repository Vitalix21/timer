console.log("Service Worker is running");

interface TimerState {
    totalTime: number;
    currentTime: number;
    isRunning: boolean;
    endTime: number | null;
}

// 2. Оновлюємо Type Guard: додаємо перевірку для endTime
function isTimerState(obj: unknown): obj is TimerState {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    return (
        'totalTime' in obj && typeof obj.totalTime === 'number' &&
        'currentTime' in obj && typeof obj.currentTime === 'number' &&
        'isRunning' in obj && typeof obj.isRunning === 'boolean' &&
        'endTime' in obj && (typeof obj.endTime === 'number' || obj.endTime === null)
    );
}

// 3. Ініціалізація: додаємо дефолтний endTime
chrome.runtime.onInstalled.addListener(() => {
    console.log('extension was installed');

    const initialState: TimerState = {
        totalTime: 20 * 60,
        currentTime: 20 * 60,
        isRunning: false,
        endTime: null, // Поки таймер стоїть, часу закінчення немає
    };

    chrome.storage.local.set({ timerState: initialState,alertSound:true,autoRestart:true });
    console.log("timer state loaded");
});

// 4. Логіка запуску: математика замість інтервалів
function startTimer() {
    console.log("Trying to start timer...");

    chrome.storage.local.get(["timerState"], (result) => {
        const state = result.timerState;

        if (!isTimerState(state)) {
            console.error("Дані в пам'яті пошкоджені або відсутні!");
            return;
        }

        if (state.isRunning) {
            console.log("Timer is already running");
            return;
        }

        // Обчислюємо точний час завершення в майбутньому (Date.now() повертає мілісекунди)
        // currentTime у нас в секундах, тому множимо на 1000
        const now = Date.now();
        const futureEndTime = now + (state.currentTime * 1000);

        // Оновлюємо стан
        state.isRunning = true;
        state.endTime = futureEndTime;

        // Зберігаємо в базу
        chrome.storage.local.set({ timerState: state });
        console.log("Timer started. End time set to:", new Date(futureEndTime).toLocaleTimeString());

        // Створюємо будильник на ТОЧНИЙ час у майбутньому
        chrome.alarms.create("timerEnd", {
            when: futureEndTime // 'when' замість 'periodInMinutes'
        });
    });
}
// 4.1 Логіка паузи
function pauseTimer() {
    console.log("Trying to pause timer...");

    chrome.storage.local.get(["timerState"], (result) => {
        const state = result.timerState;

        if (!isTimerState(state)) {
            console.error("Дані в пам'яті пошкоджені або відсутні!");
            return;
        }

        // Якщо таймер і так стоїть — нічого не робимо
        if (!state.isRunning || state.endTime === null) {
            console.log("Timer is not running, nothing to pause.");
            return;
        }

        // МАТЕМАТИКА ПАУЗИ: рахуємо, скільки мілісекунд залишилося до фінішу
        const now = Date.now();
        const timeLeftMs = state.endTime - now;

        // Переводимо мілісекунди назад у секунди (з округленням).
        // Захист: якщо час якимось дивом пішов у мінус, ставимо 0.
        state.currentTime = timeLeftMs > 0 ? Math.round(timeLeftMs / 1000) : 0;

        // Оновлюємо статус
        state.isRunning = false;
        state.endTime = null;

        // Зберігаємо цей "залишок" у базу
        chrome.storage.local.set({ timerState: state });

        // НАЙГОЛОВНІШЕ: вбиваємо системний будильник, щоб він не задзвонив
        chrome.alarms.clear("timerEnd");

        console.log(`Timer paused. ${state.currentTime} seconds left.`);
    });
}

// 4.2 Логіка скидання (Reset) - дуже корисна кнопка для таймера
function resetTimer() {
    console.log("Trying to reset timer...");

    chrome.storage.local.get(["timerState"], (result) => {
        const state = result.timerState;

        if (!isTimerState(state)) return;

        // Повертаємо поточний час до стартового (наприклад, знову 20 хв)
        state.currentTime = state.totalTime;
        state.isRunning = false;
        state.endTime = null;

        // Зберігаємо
        chrome.storage.local.set({ timerState: state });

        // Знищуємо будильник
        chrome.alarms.clear("timerEnd");

        console.log("Timer reset to default.");
    });
}
// 6. Диспетчер повідомлень (Слухаємо команди від popup.ts)
// 6. Диспетчер повідомлень
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {

    if (request.action === "GET_STATE") {
        chrome.storage.local.get(["timerState"], (result) => {
            sendResponse(result.timerState);
        });
        return true;
    }

    if (request.action === "START_TIMER") {
        startTimer();
        // Даємо мікро-затримку, щоб база встигла оновитися перед тим, як UI запитає новий статус
        setTimeout(() => sendResponse({success: true}), 50);
        return true;
    }

    if (request.action === "PAUSE_TIMER") {
        pauseTimer();
        setTimeout(() => sendResponse({success: true}), 50);
        return true;
    }

    if (request.action === "RESET_TIMER") {
        resetTimer();
        setTimeout(() => sendResponse({success: true}), 50);
        return true;
    }

    if (request.action === "SET_DURATION") {
        const newTotalSeconds = request.minutes * 60;

        chrome.storage.local.get(["timerState"], (result) => {
            const state = result.timerState;
            if (!isTimerState(state)) return;

            state.totalTime = newTotalSeconds;
            state.currentTime = newTotalSeconds;
            state.isRunning = false;
            state.endTime = null;

            // 🔴 ФІКС: Викликаємо sendResponse ТІЛЬКИ після успішного збереження
            chrome.storage.local.set({ timerState: state }, () => {
                sendResponse({ success: true });
            });
            chrome.alarms.clear("timerEnd");
        });

        // 🔴 ФІКС: Обов'язково повертаємо true для асинхронної відповіді
        return true;
    }

});
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "timerEnd") {
        console.log("⏰ ЧАС ВИЙШОВ!");

        // ФІКС 1: Дістаємо і стан таймера, і стан тоглу авторестарту
        chrome.storage.local.get(["timerState", "autoRestart"], (result) => {
            const state = result.timerState;
            // Якщо тогла в базі ще немає, вважаємо його вимкненим для безпеки
            const isAutoRestart = result.autoRestart === true;

            if (!isTimerState(state)) return;

            if (isAutoRestart) {
                console.log("🔄 Авторестарт увімкнено! Запускаємо нове коло.");
                // Скидаємо поточний час на старт, але залишаємо таймер увімкненим
                state.currentTime = state.totalTime;
                state.isRunning = true;

                // Рахуємо новий час завершення (від зараз + загальний час у мілісекундах)
                const newEndTime = Date.now() + (state.totalTime * 1000);
                state.endTime = newEndTime;

                // ФІКС 2: Створюємо НОВИЙ будильник на наступний період
                chrome.alarms.create("timerEnd", { when: newEndTime });

                chrome.storage.local.set({ timerState: state });
            } else {
                console.log("⏹ Авторестарт вимкнено. Просто зупиняємо.");
                // Твоя стара логіка повної зупинки
                state.currentTime = state.totalTime;
                state.isRunning = false;
                state.endTime = null;
                chrome.storage.local.set({ timerState: state });
            }

            chrome.runtime.sendMessage({
                action: "TIMER_FINISHED",
                autoRestarted: isAutoRestart,
                newState: state
            }).catch(() => {});

            // 💡 ФУНКЦІЯ ПЛАНУ "Б" (виклик системного сповіщення)
            const triggerFallback = () => {
                const uniqueId = "timer-end-" + Date.now();
                chrome.notifications.create(uniqueId, {
                    type: "basic",
                    iconUrl: "eye-timer-png.png",
                    title: "Time's Up!",
                    message: isAutoRestart ? "Час вийшов! Наступне коло вже почалося 🔄" : "Час зробити перерву! ☕",
                    priority: 2
                });
            };

            // 🔴 ФІКС: Питаємо активну вкладку, чи може вона показати UI
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                // Якщо вікно згорнуто або немає активної вкладки - одразу План Б
                if (tabs.length === 0 || !tabs[0].id) {
                    triggerFallback();
                    return;
                }

                const activeTab = tabs[0];

                // Якщо це гарантовано заборонена сторінка Google - одразу План Б
                if (activeTab.url && (activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("edge://") || activeTab.url.includes("chrome.google.com/webstore"))) {
                    triggerFallback();
                    return;
                }

                // Інакше пробуємо достукатися до content script (План А)
                // 🔴 ФІКС: Питаємо активну вкладку, чи може вона показати UI
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0) {
                        triggerFallback();
                        return;
                    }

                    const activeTab = tabs[0];

                    // ФІКС TS2769: Явно перевіряємо, чи є id. Тепер TS знає, що далі id - це точно number
                    if (activeTab.id === undefined) {
                        triggerFallback();
                        return;
                    }

                    if (activeTab.url && (activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("edge://") || activeTab.url.includes("chrome.google.com/webstore"))) {
                        triggerFallback();
                        return;
                    }

                    // ФІКС response: типізуємо як unknown і додаємо _ (underscore), щоб ESLint не сварився
                    chrome.tabs.sendMessage(activeTab.id, {
                        action: "SHOW_BREAK_SCREEN",
                        autoRestarted: isAutoRestart
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    }, (_response: unknown) => {
                        if (chrome.runtime.lastError) {
                            console.warn("Content script недоступний, використовуємо Fallback:", chrome.runtime.lastError.message);
                            triggerFallback();
                        } else {
                            console.log("Content script успішно показав UI!");
                        }
                    });
                });
            });

        });
    }
});

// Для тесту можеш розкоментувати виклик,
// startTimer();