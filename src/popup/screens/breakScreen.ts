console.log("🔥 ВІДЖЕТ УСПІШНО ВПОРСНУТО НА СТОРІНКУ!");

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log("📞 ВІДЖЕТ ОТРИМАВ КОМАНДУ:", request.action);

    if(request.action === "SHOW_BREAK_SCREEN") {
        chrome.storage.local.get(['theme',"alertSound"], (result) => {
            const isWhite = result.theme === "light" || result.theme === undefined;
            showBreakScreen(isWhite);
            if(result.alertSound === true){
                try{
                    const audioUrl = chrome.runtime.getURL("alarm.mp3");
                    const audio = new Audio(audioUrl);
                    audio.volume = 0.7;
                    audio.play().catch(err =>console.error("audio was blocked by browser policy",err));
                } catch(e){
                    console.error("error initialization",e);
                }
            }
            sendResponse({success:true});
        });
    }
    return true;
});

function showBreakScreen(isLightMode: boolean) {
    if(document.getElementById("e-timer-break-overlay")) return;

    // Твої кольори
    const colors = isLightMode ? {
        bg: "#D9D9D9",
        text: "#0F172A",
        subText: "#64748B",
        ringStart: "#646465", // Яскравий колір таймера
        ringEnd: "#475569",   // Тьмяний колір (те, що залишається після згасання)
        btnBg: "#0F172A"
    } : {
        bg: "#1E293B",
        text: "#F1F5F9",
        subText: "#88AACB",
        ringStart: "#817B51",
        ringEnd: "#CBD5E1",
        btnBg: "#7D7272"
    };

    const overlay = document.createElement("div");
    overlay.id = "e-timer-break-overlay";

    overlay.style.cssText = `
        position:fixed;
        top:0; left:0; width:100vw; height:100vh;
        background:rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        z-index:9999;
        display:flex;
        justify-content: center;
        align-items: center;
    `;

    overlay.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Roboto:wght@500;700&display=swap');
        </style>
        <div id="e-timer-ring-container" style="
            position: relative;
            width:300px; height:300px;
            border-radius:50%;
            background: conic-gradient(${colors.ringEnd} 0%, ${colors.ringStart} 0);
            display:flex; justify-content: center; align-items: center;
            box-shadow:0 10px 25px rgba(0,0,0,0.5);
        ">
            <div style="
                position: absolute;
                width: 276px; height: 276px;
                background: ${colors.bg};
                border-radius: 50%;
            "></div>

            <div style="z-index: 10; display:flex; flex-direction:column; align-items:center; text-align:center;">
                <h2 style="margin:0 0 10px 0; font-size:24px; color:${colors.text}; font-family: 'Roboto', sans-serif;">Time's Up!</h2>
                <p style="margin: 0 0 20px 0; color: ${colors.subText}; font-family: 'Inter', sans-serif;">Take a break.</p>
                
                <button id="e-timer-close-btn" style="
                    margin-top: 30px;
                    padding: 10px 20px;
                    border-radius: 20px;
                    border: none;
                    background: ${colors.btnBg};
                    color: ${colors.bg};
                    font-weight: bold;
                    cursor: pointer;
                    font-family: 'Roboto', sans-serif;
                ">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 🔴 ЛОГІКА ТАЙМЕРА (щосекундне "відкушування")
    const ringContainer = document.getElementById("e-timer-ring-container");
    let timeLeft = 20;
    const totalTime = 20;

    const interval = setInterval(() => {
        timeLeft--;

        if (ringContainer) {
            // Рахуємо відсоток
            const percentage = ((totalTime - timeLeft) / totalTime) * 100;

            // Оновлюємо градієнт: яскравий колір йде до percentage, далі починається тьмяний
            ringContainer.style.background = `conic-gradient(${colors.ringEnd} ${percentage}%, ${colors.ringStart} 0)`;
        }

        if (timeLeft <= 0) {
            clearInterval(interval);
        }
    }, 1000);

    // Очищення
    const cleanup = () => {
        overlay.remove();
        clearInterval(interval); // Вбиваємо інтервал, якщо юзер закрив раніше
        chrome.runtime.sendMessage({ action: "RESET_TIMER" }).catch(() => {});
    };

    const closeButton = document.getElementById("e-timer-close-btn");
    if(closeButton) {
        closeButton.onclick = cleanup;
    }

    setTimeout(() => {
        if (document.getElementById("e-timer-break-overlay")) cleanup();
    }, 20000);
}