export function generateTicks(currentSeconds: number, totalSeconds: number):string {
    let html ='';
    const radius = 110;
    const tickLength = 15;
    const tickColor = "#929BA7"
    const totalTicks = 60;
    const passedTicks = Math.floor((totalSeconds - currentSeconds) / (totalSeconds / totalTicks));

    for(let i = 0; i < totalTicks; i++) {
        const angle = (i * 6 - 90) * (Math.PI / 180);

        // Риска тьмяна якщо час пройшов
        const isDimmed = i < passedTicks;
        const opacity = isDimmed ? 0.3 : 1;


        // Координати лінії
        const x1 = radius + (radius - 8) * Math.cos(angle);
        const y1 = radius + (radius - 8) * Math.sin(angle);
        const x2 = radius + (radius - 8 - tickLength) * Math.cos(angle);
        const y2 = radius + (radius - 8 - tickLength) * Math.sin(angle);

        html += `
            <line 
                x1="${x1}" y1="${y1}" 
                x2="${x2}" y2="${y2}" 
                stroke="${tickColor}" 
                stroke-width="2" 
                opacity="${opacity}" 
                stroke-linecap="round"
            />
        `;
    }
    return html;
}