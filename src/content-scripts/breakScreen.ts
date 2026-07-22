chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	if (request.action !== 'SHOW_BREAK_SCREEN') return

	const autoRestarted: boolean = request.autoRestarted === true

	chrome.storage.local.get(['theme', 'alertSound'], result => {
		const isLightMode = result.theme === 'light' || result.theme === undefined

		showBreakScreen(isLightMode, autoRestarted)

		if (result.alertSound === true) {
			playAlarm()
		}

		sendResponse({ success: true })
	})

	return true
})

function playAlarm(): void {
	try {
		const audio = new Audio(chrome.runtime.getURL('alarm.mp3'))
		audio.volume = 0.7
		audio
			.play()
			.catch(err => console.error('[EyeTimer] Audio blocked by browser:', err))
	} catch (e) {
		console.error('[EyeTimer] Audio init failed:', e)
	}
}

interface Colors {
	bg: string
	text: string
	subText: string
	ringStart: string
	ringEnd: string
	btnBg: string
}

function getColors(isLightMode: boolean): Colors {
	return isLightMode
		? {
				bg: '#D9D9D9',
				text: '#0F172A',
				subText: '#64748B',
				ringStart: '#646465',
				ringEnd: '#475569',
				btnBg: '#0F172A',
			}
		: {
				bg: '#1E293B',
				text: '#F1F5F9',
				subText: '#88AACB',
				ringStart: '#817B51',
				ringEnd: '#CBD5E1',
				btnBg: '#7D7272',
			}
}

const BREAK_DURATION_SEC = 20

function showBreakScreen(isLightMode: boolean, autoRestarted: boolean): void {
	if (document.getElementById('e-timer-break-overlay')) return

	const colors = getColors(isLightMode)

	const overlay = document.createElement('div')
	overlay.id = 'e-timer-break-overlay'
	overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(5px);
        z-index: 2147483647;
        display: flex; justify-content: center; align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `

	const ring = document.createElement('div')
	ring.id = 'e-timer-ring'
	ring.style.cssText = `
        position: relative; width: 300px; height: 300px; border-radius: 50%;
        background: conic-gradient(${colors.ringEnd} 0%, ${colors.ringStart} 0);
        display: flex; justify-content: center; align-items: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    `

	const innerCircle = document.createElement('div')
	innerCircle.style.cssText = `
        position: absolute; width: 276px; height: 276px;
        background: ${colors.bg}; border-radius: 50%;
    `

	const content = document.createElement('div')
	content.style.cssText = `
        z-index: 10;
        display: flex; flex-direction: column;
        align-items: center; text-align: center;
    `
	content.innerHTML = `
        <h2 style="margin: 0 0 10px; font-size: 24px; font-weight: 700; color: ${colors.text};">
            Time's Up!
        </h2>
        <p style="margin: 0; color: ${colors.subText}; font-size: 14px;">
            ${autoRestarted ? 'Next session already started.' : 'Look 20 feet away for 20 seconds.'}
        </p>
        <button id="e-timer-close-btn" style="
            margin-top: 30px; padding: 10px 24px;
            border-radius: 20px; border: none;
            background: ${colors.btnBg}; color: ${colors.bg};
            font-weight: 700; font-size: 14px; cursor: pointer;
        ">Close</button>
    `

	ring.append(innerCircle, content)
	overlay.appendChild(ring)
	document.body.appendChild(overlay)

	let timeLeft = BREAK_DURATION_SEC

	const interval = setInterval(() => {
		timeLeft--
		const pct = ((BREAK_DURATION_SEC - timeLeft) / BREAK_DURATION_SEC) * 100
		ring.style.background = `conic-gradient(${colors.ringEnd} ${pct}%, ${colors.ringStart} 0)`
		if (timeLeft <= 0) clearInterval(interval)
	}, 1000)

	let cleaned = false

	const cleanup = () => {
		if (cleaned) return
		cleaned = true
		overlay.remove()
		clearInterval(interval)
	}

	document
		.getElementById('e-timer-close-btn')
		?.addEventListener('click', cleanup)
	setTimeout(cleanup, BREAK_DURATION_SEC * 1000)
}
