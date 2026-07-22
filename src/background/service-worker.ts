import { isTimerState, type TimerState } from '@/shared/types.ts'
chrome.runtime.onInstalled.addListener(() => {
	const initialState: TimerState = {
		totalTime: 20 * 60,
		currentTime: 20 * 60,
		isRunning: false,
		endTime: null,
	}

	chrome.storage.local.set({
		timerState: initialState,
		alertSound: true,
		autoRestart: true,
	})
})

function startTimer(onDone: () => void) {
	chrome.storage.local.get(['timerState'], result => {
		const state = result.timerState

		if (!isTimerState(state)) {
			onDone()
			return
		}

		const now = Date.now()
		const futureEndTime = now + state.currentTime * 1000

		state.isRunning = true
		state.endTime = futureEndTime

		chrome.storage.local.set({ timerState: state })
		chrome.alarms.create('timerEnd', {
			when: futureEndTime,
		})
		onDone()
	})
}

function pauseTimer(onDone: () => void) {
	chrome.storage.local.get(['timerState'], result => {
		const state = result.timerState

		if (!isTimerState(state) || !state.isRunning || state.endTime === null) {
			onDone()
			return
		}

		const now = Date.now()
		const timeLeftMs = state.endTime - now

		state.currentTime = timeLeftMs > 0 ? Math.round(timeLeftMs / 1000) : 0
		state.isRunning = false
		state.endTime = null
		chrome.storage.local.set({ timerState: state })
		chrome.alarms.clear('timerEnd')
		onDone()
	})
}

function resetTimer(onDone: () => void) {
	chrome.storage.local.get(['timerState'], result => {
		const state = result.timerState

		if (!isTimerState(state)) {
			onDone()
			return
		}

		state.currentTime = state.totalTime
		state.isRunning = false
		state.endTime = null
		chrome.storage.local.set({ timerState: state })
		chrome.alarms.clear('timerEnd')
		onDone()
	})
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	if (request.action === 'GET_STATE') {
		chrome.storage.local.get(['timerState'], result => {
			sendResponse(result.timerState)
		})
		return true
	}

	if (request.action === 'START_TIMER') {
		startTimer(() => {
			sendResponse({ success: true })
		})
		return true
	}

	if (request.action === 'PAUSE_TIMER') {
		pauseTimer(() => {
			sendResponse({ success: true })
		})
		return true
	}

	if (request.action === 'RESET_TIMER') {
		resetTimer(() => {
			sendResponse({ success: true })
		})
		return true
	}

	if (request.action === 'SET_DURATION') {
		const newTotalSeconds = request.minutes * 60

		chrome.storage.local.get(['timerState'], result => {
			const state = result.timerState
			if (!isTimerState(state)) return

			state.totalTime = newTotalSeconds
			state.currentTime = newTotalSeconds
			state.isRunning = false
			state.endTime = null
			chrome.storage.local.set({ timerState: state }, () => {
				sendResponse({ success: true })
			})
			chrome.alarms.clear('timerEnd')
		})

		return true
	}
})

chrome.alarms.onAlarm.addListener(alarm => {
	if (alarm.name === 'timerEnd') {
		chrome.storage.local.get(
			{ timerState: null, autoRestart: true },
			result => {
				const state = result.timerState
				const isAutoRestart = result.autoRestart === true

				if (!isTimerState(state)) return

				if (isAutoRestart) {
					state.currentTime = state.totalTime
					state.isRunning = true
					const newEndTime = Date.now() + state.totalTime * 1000
					state.endTime = newEndTime

					chrome.alarms.create('timerEnd', { when: newEndTime })
					chrome.storage.local.set({ timerState: state })
				} else {
					state.currentTime = state.totalTime
					state.isRunning = false
					state.endTime = null
					chrome.storage.local.set({ timerState: state })
				}

				chrome.runtime
					.sendMessage({
						action: 'TIMER_FINISHED',
						autoRestarted: isAutoRestart,
						newState: state,
					})
					.catch(() => {})

				const triggerFallback = () => {
					const uniqueId = 'timer-end-' + Date.now()
					chrome.notifications.create(uniqueId, {
						type: 'basic',
						iconUrl: chrome.runtime.getURL('eye-timer-png.png'),
						title: "Time's Up!",
						message: isAutoRestart
							? 'Час вийшов! Наступне коло вже почалося 🔄'
							: 'Час зробити перерву! ☕',
						priority: 2,
					})
				}

				function isRestrictedUrl(url?: string): boolean {
					if (!url) return true
					return (
						url.startsWith('chrome://') ||
						url.startsWith('chrome-extension://') ||
						url.startsWith('edge://') ||
						url.startsWith('about:')
					)
				}

				chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
					const activeTab = tabs[0]

					if (!activeTab?.id || isRestrictedUrl(activeTab.url)) {
						triggerFallback()
						return
					}

					chrome.tabs.sendMessage(
						activeTab.id,
						{
							action: 'SHOW_BREAK_SCREEN',
							autoRestarted: isAutoRestart,
						},
						() => {
							if (chrome.runtime.lastError) {
								triggerFallback()
							}
						},
					)
				})
			},
		)
	}
})
