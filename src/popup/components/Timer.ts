import { isTimerState } from '@/shared/types.ts'

function formatSeconds(sec: number): string {
	const m = Math.floor(sec / 60)
	const s = sec % 60
	return `${m}:${s.toString().padStart(2, '0')}`
}

export class Timer {
	private onTick?: () => void
	private syncInterval: number | null = null
	private onComplete?: () => void

	private boundStorageListener = this.handleStorageChange.bind(this)

	constructor() {
		this.startSync()
		this.listenForCompletion()
	}

	private listenForCompletion() {
		chrome.storage.onChanged.addListener(this.boundStorageListener)
	}

	private handleStorageChange(
		changes: { [key: string]: chrome.storage.StorageChange },
		namespace: string,
	) {
		if (namespace === 'local' && changes.timerState) {
			const newState = changes.timerState.newValue

			if (!isTimerState(newState)) return
			if (!newState.isRunning && newState.currentTime <= 0) {
				this.onComplete?.()
			}
		}
	}

	private startSync() {
		this.syncInterval = window.setInterval(() => {
			this.onTick?.()
		}, 1000)
	}

	stopSync() {
		if (this.syncInterval !== null) {
			window.clearInterval(this.syncInterval)
		}
		chrome.storage.onChanged.removeListener(this.boundStorageListener)
	}

	async getState(): Promise<unknown> {
		return new Promise(resolve => {
			chrome.runtime.sendMessage({ action: 'GET_STATE' }, state => {
				if (chrome.runtime.lastError) {
					resolve(null) // Fallback замість reject
					return
				}
				resolve(state)
			})
		})
	}

	async formatTime(): Promise<string> {
		const state = await this.getState()

		if (!isTimerState(state)) {
			return '0:00'
		}

		if (state.isRunning && state.endTime) {
			const now = Date.now()
			const timeLeftMs = state.endTime - now
			const timeLeftSec = Math.max(0, Math.round(timeLeftMs / 1000))

			return formatSeconds(timeLeftSec)
		}

		return formatSeconds(state.currentTime)
	}

	start(): Promise<void> {
		return new Promise(resolve => {
			chrome.runtime.sendMessage({ action: 'START_TIMER' }, () => resolve())
		})
	}

	stop(): Promise<void> {
		return new Promise(resolve => {
			chrome.runtime.sendMessage({ action: 'PAUSE_TIMER' }, () => resolve())
		})
	}

	async toggle(currentState?: unknown): Promise<void> {
		const state = currentState ?? (await this.getState())

		if (!isTimerState(state)) return

		if (state.isRunning) {
			await this.stop()
		} else {
			await this.start()
		}
	}

	reset(): Promise<void> {
		return new Promise(resolve => {
			chrome.runtime.sendMessage({ action: 'RESET_TIMER' }, () => resolve())
		})
	}

	setDuration(minutes: number): Promise<void> {
		return new Promise(resolve => {
			chrome.runtime.sendMessage({ action: 'SET_DURATION', minutes }, () => {
				resolve()
			})
		})
	}

	async getCurrentTime(): Promise<number> {
		const state = await this.getState()

		if (!isTimerState(state)) {
			return 0
		}

		if (state.isRunning && state.endTime) {
			const now = Date.now()
			const timeLeftMs = state.endTime - now
			return Math.max(0, Math.round(timeLeftMs / 1000))
		}

		return state.currentTime
	}

	async getTotalTime(): Promise<number> {
		const state = await this.getState()
		if (!isTimerState(state)) {
			return 20 * 60
		}
		return state.totalTime
	}

	async getIsRunning(): Promise<boolean> {
		const state = await this.getState()
		if (!isTimerState(state)) {
			return false
		}
		return state.isRunning
	}

	onTickCallback(callback: () => void) {
		this.onTick = callback
	}

	onCompleteCallback(callback: () => void) {
		this.onComplete = callback
	}
}
