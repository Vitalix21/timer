export function createSettingsButton(): string {
    return `
        <button class="cursor-pointer w-[70px] h-[70px] rounded-full mb-[10px] flex flex-col items-center justify-center border-none" style="background: var(--bg-button); transition: background 0.3s;">
            <img class="mb-1" src="../public/back-item.svg" alt="">
            <p style="font-weight: 600; font-size: 9px; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Settings</p>
        </button>
    `;
}