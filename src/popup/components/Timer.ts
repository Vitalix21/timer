interface TimerState {
    totalTime: number;
    currentTime: number;
    isRunning: boolean;
    endTime:number | null;
}

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

export class Timer {
    private onTick?: () => void;
    private syncInterval: number | null = null;
    private onComplete?: () => void;


    constructor() {
        this.startSync();
        this.listenForCompletion();
    }

    private listenForCompletion() {
        // Підписуємося на оновлення бази даних
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.timerState) {
                // Отримуємо новий стан після збереження
                const newState = changes.timerState.newValue;

                // Перевіряємо Type Guard'ом
                if (!isTimerState(newState)) return;

                // ЛОГІКА ФІНІШУ:
                // Якщо таймер не працює, і час дорівнює нулю — це означає,
                // що Service Worker щойно завершив відлік.
                if (!newState.isRunning && newState.currentTime <= 0) {
                    if (this.onComplete) {
                        this.onComplete(); // Смикаємо наш колбек!
                    }
                }
            }
        });
    }

    private startSync() {
        this.syncInterval = window.setInterval(() => {
            if(this.onTick){
                this.onTick();
            }
        },1000)
    }

    async getState(): Promise<unknown>{
        return new Promise((resolve)=>{
            chrome.runtime.sendMessage({action:"GET_STATE"}, (state) => {
                // Запобіжник від зависання:
                if (chrome.runtime.lastError) {
                    console.error("SW Error:", chrome.runtime.lastError.message);
                    resolve(null); // Віддаємо null, щоб Promise розблокувався
                    return;
                }
                resolve(state);
            })
        })
    }

    stopSync() {
        if(this.syncInterval){
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async formatTime(): Promise<string> {
        const state = await this.getState();

        if (!isTimerState(state)) {
            console.error('Invalid state from Service Worker');
            return '0:00'; // Fallback
        }

        if (state.isRunning && state.endTime) {
            const now = Date.now();
            const timeLeftMs = state.endTime - now;
            const timeLeftSec = Math.max(0, Math.round(timeLeftMs / 1000));

            const m = Math.floor(timeLeftSec / 60);
            const s = timeLeftSec % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        }

        // Інакше — показуємо currentTime (коли на паузі)
        const m = Math.floor(state.currentTime / 60);
        const s = state.currentTime % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ✅ Запуск таймера (відправляємо команду Service Worker)
    // ✅ Запуск таймера (чекаємо відповіді)
    start(): Promise<void> {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'START_TIMER' }, () => resolve());
        });
    }

    // ✅ Пауза
    stop(): Promise<void> {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'PAUSE_TIMER' }, () => resolve());
        });
    }

    // ✅ Toggle (start/stop)
    async toggle(): Promise<void> {
        const state = await this.getState();
        if (!isTimerState(state)) return;

        if (state.isRunning) {
            await this.stop();
        } else {
            await this.start();
        }
    }

    // ✅ Reset
    reset(): Promise<void> {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'RESET_TIMER' }, () => resolve());
        });
    }

    setDuration(minutes: number): Promise<void> {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'SET_DURATION', minutes }, () => {
                resolve();
            });
        });
    }

    // ✅ Getters (async тому що запитують Service Worker)
    async getCurrentTime(): Promise<number> {
        const state = await this.getState();

        // Якщо таймер працює — рахуємо від endTime
        if(!isTimerState(state)) {
            return 0;
        }

        if (state.isRunning && state.endTime) {
            const now = Date.now();
            const timeLeftMs = state.endTime - now;
            return Math.max(0, Math.round(timeLeftMs / 1000));
        }

        return state.currentTime;
    }

    async getTotalTime(): Promise<number> {
        const state = await this.getState();
        if(!isTimerState(state)) {
            return 20 * 60;
        }
        return state.totalTime;
    }

    async getIsRunning(): Promise<boolean> {
        const state = await this.getState();
        if(!isTimerState(state)) {
            return false;
        }
        return state.isRunning;
    }

    // ✅ Callbacks
    onTickCallback(callback: () => void) {
        this.onTick = callback;
    }

    onCompleteCallback(callback: () => void) {
        this.onComplete = callback;
        // Не використовується, бо Service Worker керує завершенням через chrome.alarms
    }
}

