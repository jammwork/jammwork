export const pastelColors = [
	"#FFB6C1",
	"#87CEEB",
	"#98FB98",
	"#DDA0DD",
	"#F0E68C",
	"#E6E6FA",
];

export function getRandomPastelColor() {
	return pastelColors[Math.floor(Math.random() * pastelColors.length)];
}
