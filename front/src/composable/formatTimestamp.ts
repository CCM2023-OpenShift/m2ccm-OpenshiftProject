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

// Format une date pour l'affichage dans l'historique des réservations
export const formatDateForDisplay = (isoString: string): string => {
    const date = new Date(isoString);

    // Options pour le formattage de la date
    const dateOptions: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        year: "numeric"
    };

    // Options pour le formattage de l'heure
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit"
    };

    // Formatter la date et l'heure
    const formattedDate = date.toLocaleDateString("fr-FR", dateOptions);
    const formattedTime = date.toLocaleTimeString("fr-FR", timeOptions);

    return `${formattedDate} à ${formattedTime}`;
};

export const formatBookingTimeRange = (startTime: string, endTime: string): string => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Options pour le formatage de la date et de l'heure
    const dateOptions: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        year: "numeric"
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit"
    };

    // Formater les dates et heures en français
    const formattedStartDate = startDate.toLocaleDateString("fr-FR", dateOptions);
    const formattedStartTime = startDate.toLocaleTimeString("fr-FR", timeOptions);
    const formattedEndTime = endDate.toLocaleTimeString("fr-FR", timeOptions);

    // Si la réservation commence et se termine le même jour
    if (startDate.toDateString() === endDate.toDateString()) {
        return `${formattedStartDate} de ${formattedStartTime} à ${formattedEndTime}`;
    } else {
        // Pour les réservations sur plusieurs jours
        const formattedEndDate = endDate.toLocaleDateString("fr-FR", dateOptions);
        return `Du ${formattedStartDate} à ${formattedStartTime} au ${formattedEndDate} à ${formattedEndTime}`;
    }
};

// Exemple d'utilisation dans le cas où tu as besoin de l'heure actuelle arrondie
export const now = new Date();  // Heure locale
export const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);  // Heure locale, une heure plus tard

export const roundedNow = roundUpToNextHalfHour(now);  // Arrondi à la demi-heure supérieure la plus proche
export const roundedOneHourLater = roundUpToNextHalfHour(oneHourLater);  // Arrondi +1h à la demi-heure supérieure
