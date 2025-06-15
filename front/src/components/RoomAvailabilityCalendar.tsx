import {useEffect, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import {DateSelectArg} from '@fullcalendar/core';
import {AlertCircle} from 'lucide-react';
import {useStore} from '../store';
import {useKeycloak} from "@react-keycloak/web";
import {Booking, Room} from '../types';

// Interface des props
interface RoomAvailabilityCalendarProps {
    roomId: string;
    selectedDate?: Date;
    onSlotSelect?: (start: string, end: string) => void;
    currentBooking?: {
        startTime: string;
        endTime: string;
        title?: string;
    };
    // Propriété pour les réservations récurrentes
    recurringBookings?: Array<{
        startTime: string;
        endTime: string;
        title?: string;
    }>;
}

export const RoomAvailabilityCalendar = ({
                                             roomId,
                                             selectedDate = new Date(),
                                             onSlotSelect,
                                             currentBooking,
                                             recurringBookings
                                         }: RoomAvailabilityCalendarProps) => {
    // Utiliser les données et états du store
    const {
        rooms,
        bookings,
        currentUser,
        loading,
        fetchRooms,
        fetchBookings
    } = useStore(state => ({
        rooms: state.rooms,
        bookings: state.bookings,
        currentUser: state.currentUser,
        loading: {
            rooms: state.loading.rooms,
            bookings: state.loading.bookings
        },
        fetchRooms: state.fetchRooms,
        fetchBookings: state.fetchBookings
    }));

    const [error, setError] = useState<string | null>(null);
    const [, setRoomInfo] = useState<Room | null>(null);
    const [roomBookings, setRoomBookings] = useState<Booking[]>([]);

    // Vérifier si l'utilisateur est admin
    const isAdmin = useKeycloak().keycloak.tokenParsed?.realm_access?.roles?.includes('admin') || false;

    // Charger les salles et réservations si nécessaire
    useEffect(() => {
        const loadData = async () => {
            try {
                // Si nous n'avons pas encore les salles, les charger
                if (rooms.length === 0) {
                    await fetchRooms();
                }

                // Si nous n'avons pas encore les réservations, les charger
                if (bookings.length === 0) {
                    await fetchBookings();
                }
            } catch (err) {
                console.error("Erreur lors du chargement des données:", err);
                setError("Impossible de charger les données nécessaires.");
            }
        };

        void loadData();
    }, [fetchRooms, fetchBookings, rooms.length, bookings.length]);

    // Filtrer les réservations pour la salle sélectionnée et récupérer les infos de la salle
    useEffect(() => {
        if (!roomId) {
            setRoomBookings([]);
            setRoomInfo(null);
            return;
        }

        try {
            // Récupérer les infos de la salle
            const selectedRoom = rooms.find(r => String(r.id) === String(roomId));

            if (selectedRoom) {
                setRoomInfo(selectedRoom);
            } else {
                console.warn(`Salle avec ID ${roomId} non trouvée`);
                setError(`Salle avec ID ${roomId} non trouvée`);
                return;
            }

            // Filtrer les réservations pour cette salle
            const filteredBookings = bookings.filter(booking =>
                booking.room && String(booking.room.id) === String(roomId)
            );

            setRoomBookings(filteredBookings);
            setError(null);

        } catch (err) {
            console.error("Erreur lors du filtrage des réservations :", err);
            setError("Impossible de récupérer les réservations de la salle.");
        }
    }, [roomId, rooms, bookings]);

    // Vérifier si l'utilisateur est l'organisateur de la réservation
    const isOrganizerOf = (booking: Booking) => {
        return currentUser && booking.organizer === currentUser.username;
    };

    // Créer les événements pour le calendrier
    const events = [
        // Réservations existantes
        ...roomBookings.map(booking => {
            // Vérifier si l'utilisateur peut voir les détails complets
            const showDetails = isAdmin || isOrganizerOf(booking);

            return {
                id: booking.id,
                title: showDetails ? booking.title : "Réservé",
                start: booking.startTime,
                end: booking.endTime,
                backgroundColor: '#f87171',
                borderColor: '#ef4444',
                textColor: '#ffffff',
                extendedProps: {
                    organizer: showDetails ? booking.organizer : null,
                    attendees: showDetails ? booking.attendees : null,
                    showDetails: showDetails
                }
            };
        }),

        // Ajouter la réservation en cours si elle existe
        ...(currentBooking ? [{
            id: 'current',
            title: currentBooking.title || 'Votre réservation',
            start: currentBooking.startTime,
            end: currentBooking.endTime,
            backgroundColor: '#3b82f6', // Bleu pour la réservation en cours
            borderColor: '#2563eb',
            textColor: '#ffffff',
            editable: false,
            durationEditable: false
        }] : []),

        // Ajouter les réservations récurrentes si elles existent
        ...(recurringBookings ? recurringBookings.map((booking, index) => ({
            id: `recurring-${index}`,
            title: booking.title || 'Réservation récurrente',
            start: booking.startTime,
            end: booking.endTime,
            backgroundColor: '#60a5fa', // Bleu plus clair pour les récurrences
            borderColor: '#3b82f6',
            textColor: '#ffffff',
            editable: false,
            durationEditable: false
        })) : [])
    ];

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        if (onSlotSelect) {
            onSlotSelect(selectInfo.startStr, selectInfo.endStr);
        }
    };

    // Affichage des états de chargement
    if (loading.rooms || loading.bookings) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Chargement des disponibilités...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <AlertCircle className="mr-2" size={16}/>
                {error}
            </div>
        );
    }

    if (!roomId) {
        return (
            <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
                Sélectionnez une salle pour voir ses disponibilités
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-4">
            <FullCalendar
                plugins={[timeGridPlugin]}
                initialView="timeGridDay"
                initialDate={selectedDate}
                locale={frLocale}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '',
                }}
                allDaySlot={false}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                height="auto"
                events={events}
                selectable={!!onSlotSelect}
                select={handleDateSelect}
                selectMirror={true}
                selectOverlap={false}
                nowIndicator={true}
                eventContent={(arg) => (
                    <div className="p-1">
                        <div className="font-medium text-sm">{arg.event.title}</div>
                        {arg.event.id !== 'current' &&
                            arg.event.id.toString().indexOf('recurring') === -1 &&
                            arg.event.extendedProps.showDetails && (
                                <div className="text-xs opacity-80">
                                    {arg.event.extendedProps.organizer} ·
                                    {arg.event.extendedProps.attendees} pers.
                                </div>
                            )}
                    </div>
                )}
            />

            {/* Légende */}
            <div className="mt-3 text-sm text-gray-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
                        <span>Créneaux réservés</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-sm mr-2"></div>
                        <span>Réservation initiale</span>
                    </div>
                    {recurringBookings && recurringBookings.length > 0 && (
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-400 rounded-sm mr-2"></div>
                            <span>Récurrences prévues</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};