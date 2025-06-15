import {useState, useEffect} from 'react';
import {Booking} from '../services/Booking';
import {Repeat, Calendar, AlertCircle, Check, ChevronLeft, X} from 'lucide-react';
import {RoomAvailabilityCalendar} from './RoomAvailabilityCalendar';

interface RecurringBookingFormProps {
    bookingData: Partial<Booking>;
    onSubmit: (bookings: Partial<Booking>[]) => void;
    onCancel: () => void;
}

export const RecurringBookingForm = ({bookingData, onSubmit, onCancel}: RecurringBookingFormProps) => {
    const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [occurrences, setOccurrences] = useState<number>(4);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [endDate, setEndDate] = useState<string>('');
    const [useOccurrences, setUseOccurrences] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [preview, setPreview] = useState<Date[]>([]);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    // Initialiser les jours sélectionnés avec le jour de la date de départ
    useEffect(() => {
        if (bookingData.startTime) {
            const startDay = new Date(bookingData.startTime).getDay();
            setSelectedDays([startDay]);

            // Initialiser la date de fin à 1 mois après la date de début
            const oneMonthLater = new Date(bookingData.startTime);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            setEndDate(oneMonthLater.toISOString().split('T')[0]);
        }
    }, [bookingData.startTime]);

    // Ajoutez un nouvel useEffect qui dépend de selectedDays pour générer l'aperçu
    useEffect(() => {
        // Ne générez l'aperçu que si des jours sont sélectionnés et que nous avons une date de début
        if (selectedDays.length > 0 && bookingData.startTime) {
            generatePreview();
        }
    }, [selectedDays, bookingData.startTime]);

    // Générer un aperçu des dates de réservation
    const generatePreview = () => {
        setErrorMessage('');

        if (!bookingData.startTime) {
            setErrorMessage('Date de départ invalide');
            return;
        }

        // Vérifier qu'au moins un jour est sélectionné pour le mode hebdomadaire
        if (recurrenceType === 'weekly' && selectedDays.length === 0) {
            setErrorMessage('Veuillez sélectionner au moins un jour de la semaine');
            return;
        }

        // Vérifier que la date de fin est définie si on n'utilise pas les occurrences
        if (!useOccurrences && !endDate) {
            setErrorMessage('Veuillez sélectionner une date de fin');
            return;
        }

        const dates: Date[] = [];
        const startDate = new Date(bookingData.startTime);
        let currentDate = new Date(startDate);

        const maxDate = useOccurrences
            ? null
            : new Date(endDate);

        let count = 0;

        while ((useOccurrences && count < occurrences) ||
        (!useOccurrences && maxDate && currentDate <= maxDate)) {

            if (recurrenceType === 'daily') {
                if (count > 0) { // Skip first date as it's the original booking
                    currentDate.setDate(currentDate.getDate() + 1);
                    dates.push(new Date(currentDate));
                } else {
                    dates.push(new Date(currentDate));
                }
                count++;
            } else if (recurrenceType === 'weekly') {
                // Pour les réservations hebdomadaires avec jours spécifiques
                if (count === 0) {
                    // Ajouter la date originale
                    dates.push(new Date(currentDate));
                    count++;
                } else {
                    // Parcourir les 7 prochains jours et vérifier si le jour est sélectionné
                    for (let i = 1; i <= 7; i++) {
                        const nextDate = new Date(currentDate);
                        nextDate.setDate(nextDate.getDate() + i);

                        if (selectedDays.includes(nextDate.getDay())) {
                            dates.push(new Date(nextDate));
                            count++;

                            // Vérifier si nous avons atteint le nombre d'occurrences
                            if (useOccurrences && count >= occurrences) {
                                break;
                            }
                        }
                    }

                    // Avancer d'une semaine
                    currentDate.setDate(currentDate.getDate() + 7);
                }
            } else if (recurrenceType === 'monthly') {
                if (count > 0) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    dates.push(new Date(currentDate));
                } else {
                    dates.push(new Date(currentDate));
                }
                count++;
            }

            // Sécurité pour éviter une boucle infinie
            if (dates.length > 100) break;
        }

        setPreview(dates);
        setShowPreview(true);
    };

    // Générer les instances de réservation récurrentes
    const generateRecurringBookings = (): Partial<Booking>[] => {
        if (!bookingData.startTime || !bookingData.endTime) return [];

        const bookings: Partial<Booking>[] = [];
        const startDate = new Date(bookingData.startTime);
        const endDate = new Date(bookingData.endTime);
        const duration = endDate.getTime() - startDate.getTime();

        // Ajouter chaque date prévisualisée comme réservation
        preview.forEach(date => {
            const newStartTime = new Date(date);
            newStartTime.setHours(startDate.getHours(), startDate.getMinutes());

            const newEndTime = new Date(newStartTime.getTime() + duration);

            bookings.push({
                ...bookingData,
                startTime: newStartTime.toISOString(),
                endTime: newEndTime.toISOString()
            });
        });

        return bookings;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const bookings = generateRecurringBookings();
            onSubmit(bookings);
        } catch (error) {
            console.error('Erreur lors de la création des réservations récurrentes:', error);
            setErrorMessage('Une erreur est survenue lors de la création des réservations récurrentes');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    // Vérifier si des données sont manquantes
    const roomName = bookingData.room?.name;
    const hasStartDate = Boolean(bookingData.startTime);
    const roomId = bookingData.room?.id || '';

    return (
        <div className="flex flex-col xl:flex-row gap-6">
            {/* Partie principale du formulaire */}
            <div className="flex-1">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-blue-600 text-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <button
                                    onClick={onCancel}
                                    className="mr-4 bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 focus:outline-none"
                                    aria-label="Retour"
                                >
                                    <ChevronLeft size={20}/>
                                </button>
                                <h2 className="text-xl font-bold flex items-center">
                                    <Repeat className="mr-2" size={24}/>
                                    Configurer une récurrence
                                </h2>
                            </div>
                            <button
                                onClick={onCancel}
                                className="rounded-full p-2 hover:bg-white hover:bg-opacity-10 focus:outline-none"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-3">Réservation de base</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="mb-2"><span
                                        className="font-medium">Titre:</span> {bookingData.title || 'Non défini'}</p>
                                    <p><span className="font-medium">Salle:</span> {roomName || 'Non définie'}</p>
                                </div>
                                <div>
                                    <p><span className="font-medium">Date initiale:</span> {
                                        hasStartDate ? new Date(bookingData.startTime!).toLocaleDateString('fr-FR', {
                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                        }) : 'Non définie'
                                    }</p>
                                    <p><span className="font-medium">Horaires:</span> {
                                        hasStartDate ? `${new Date(bookingData.startTime!).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })} - 
                                        ${new Date(bookingData.endTime!).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}` : 'Non définis'
                                    }</p>
                                </div>
                            </div>

                            {(!roomName || !hasStartDate) && (
                                <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 rounded flex items-center">
                                    <AlertCircle size={16} className="mr-2"/>
                                    Informations incomplètes. Veuillez retourner au formulaire pour les compléter.
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-800 mb-3">Type de récurrence</label>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    className={`py-3 px-4 text-center border rounded-lg transition-all ${
                                        recurrenceType === 'daily' ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                                    }`}
                                    onClick={() => setRecurrenceType('daily')}
                                >
                                    Quotidienne
                                </button>
                                <button
                                    type="button"
                                    className={`py-3 px-4 text-center border rounded-lg transition-all ${
                                        recurrenceType === 'weekly' ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                                    }`}
                                    onClick={() => setRecurrenceType('weekly')}
                                >
                                    Hebdomadaire
                                </button>
                                <button
                                    type="button"
                                    className={`py-3 px-4 text-center border rounded-lg transition-all ${
                                        recurrenceType === 'monthly' ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                                    }`}
                                    onClick={() => setRecurrenceType('monthly')}
                                >
                                    Mensuelle
                                </button>
                            </div>
                        </div>

                        {recurrenceType === 'weekly' && (
                            <div className="mb-6">
                                <label className="block text-lg font-medium text-gray-800 mb-3">Jours de la semaine</label>
                                <div className="flex flex-wrap gap-2">
                                    {dayNames.map((day, index) => (
                                        <button
                                            key={day}
                                            type="button"
                                            className={`py-2 px-4 text-sm rounded-lg transition-all ${
                                                selectedDays.includes(index)
                                                    ? 'bg-blue-100 text-blue-800 border border-blue-300 font-medium'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                            }`}
                                            onClick={() => toggleDay(index)}
                                        >
                                            {day.slice(0, 2)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <label className="block text-lg font-medium text-gray-800 mb-3">Fin de récurrence</label>
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="end-after"
                                        checked={useOccurrences}
                                        onChange={() => setUseOccurrences(true)}
                                        className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="end-after" className="ml-3 block text-gray-700">
                                        Après
                                        <input
                                            type="number"
                                            min="1"
                                            max="52"
                                            value={occurrences}
                                            onChange={(e) => setOccurrences(Math.min(52, Math.max(1, parseInt(e.target.value) || 1)))}
                                            className="mx-3 w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                                            disabled={!useOccurrences}
                                        />
                                        occurrence(s)
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="end-on"
                                        checked={!useOccurrences}
                                        onChange={() => setUseOccurrences(false)}
                                        className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="end-on" className="ml-3 block text-gray-700">
                                        Le
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="ml-3 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                                            disabled={useOccurrences}
                                            min={bookingData.startTime ? new Date(bookingData.startTime).toISOString().split('T')[0] : ''}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <button
                                type="button"
                                onClick={generatePreview}
                                className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
                            >
                                <Calendar size={18} className="mr-2"/>
                                Générer un aperçu des dates
                            </button>

                            {preview.length > 0 && (
                                <span className="text-blue-600 font-medium">{preview.length} dates générées</span>
                            )}
                        </div>

                        {errorMessage && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
                                <AlertCircle size={18} className="mr-2 flex-shrink-0"/>
                                {errorMessage}
                            </div>
                        )}

                        {showPreview && preview.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                                    <Calendar size={18} className="mr-2 text-blue-500"/>
                                    Aperçu des dates ({preview.length})
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                                    <ul className="space-y-2">
                                        {preview.map((date, index) => (
                                            <li key={index} className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                                                <div
                                                    className="h-8 w-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mr-3 font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{date.toLocaleDateString('fr-FR', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {preview.length > 10 && (
                                    <div
                                        className="mt-3 flex items-center text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        <AlertCircle size={18} className="mr-2 flex-shrink-0"/>
                                        <span>
                                            <strong>Attention:</strong> Vous êtes sur le point de créer <strong>{preview.length} réservations</strong>.
                                            Assurez-vous que cela correspond à votre besoin.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={preview.length === 0 || loading}
                                className={`px-6 py-3 border border-transparent rounded-lg font-medium text-white ${
                                    preview.length === 0 || loading
                                        ? 'bg-blue-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                    strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor"
                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Création en cours...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <Check size={16} className="mr-2"/>
                                        Créer {preview.length} réservations
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne du calendrier de disponibilité */}
            {roomId && (
                <div className="xl:w-[450px]">
                    <div className="sticky top-6 bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-blue-600 text-white p-4">
                            <h2 className="text-xl font-semibold flex items-center">
                                <Calendar size={20} className="mr-2"/>
                                Disponibilité de {roomName}
                            </h2>
                        </div>
                        <div className="calendar-container">
                            <RoomAvailabilityCalendar
                                roomId={roomId}
                                selectedDate={bookingData.startTime ? new Date(bookingData.startTime) : new Date()}
                                currentBooking={{
                                    startTime: bookingData.startTime || '',
                                    endTime: bookingData.endTime || '',
                                    title: bookingData.title || 'Réservation initiale'
                                }}
                                recurringBookings={preview.slice(1).map(date => {
                                    // Créez des objets réservation pour chaque date prévisualisée
                                    const startTime = new Date(date);
                                    const originalStart = new Date(bookingData.startTime || '');
                                    const originalEnd = new Date(bookingData.endTime || '');

                                    // Garde l'heure de la réservation originale
                                    startTime.setHours(originalStart.getHours(), originalStart.getMinutes());

                                    // Calcule la durée de la réservation originale
                                    const duration = originalEnd.getTime() - originalStart.getTime();
                                    const endTime = new Date(startTime.getTime() + duration);

                                    return {
                                        startTime: startTime.toISOString(),
                                        endTime: endTime.toISOString(),
                                        title: `${bookingData.title} (récurrence)`
                                    };
                                })}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringBookingForm;