// Fonction pour arrondir l'heure à la demi-heure supérieure la plus proche
export const roundUpToNextHalfHour = (date: Date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;  // Si les minutes sont < 30, arrondir à 30, sinon à 0 (prochaine heure)
    const newDate = new Date(date);

    // Arrondir l'heure
    if (roundedMinutes === 0 && minutes > 0) {
        // Si c'est une nouvelle heure (ex: 22h59 => 23h00)
        newDate.setHours(newDate.getHours() + 1);
    }

    // Mettre les minutes arrondies
    newDate.setMinutes(roundedMinutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    return newDate;
};

// Fonction pour formater une date en format compatible avec datetime-local
export const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');  // Pour ajouter des zéros si nécessaire
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);  // Les mois commencent à 0, donc on ajoute 1
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Fonction pour formater un timestamp au format datetime-local
export default function formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const year = String(date.getFullYear()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Exemple d'utilisation dans le cas où tu as besoin de l'heure actuelle arrondie
export const now = new Date();  // Heure locale
export const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);  // Heure locale, une heure plus tard

export const roundedNow = roundUpToNextHalfHour(now);  // Arrondi à la demi-heure supérieure la plus proche
export const roundedOneHourLater = roundUpToNextHalfHour(oneHourLater);  // Arrondi +1h à la demi-heure supérieure
