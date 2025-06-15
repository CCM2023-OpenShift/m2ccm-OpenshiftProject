import {useEffect, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import {DateSelectArg} from '@fullcalendar/core';
import {Booking} from '../services/Booking';
import {Room} from '../services/Room';
import {AlertCircle} from 'lucide-react';
import {useStore} from '../store';

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
}

export const RoomAvailabilityCalendar = ({
                                             roomId,
                                             selectedDate = new Date(),
                                             onSlotSelect,
                                             currentBooking
                                         }: RoomAvailabilityCalendarProps) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setRoomInfo] = useState<Room | null>(null);

    // Utiliser le store pour accéder aux salles déjà chargées
    const {rooms} = useStore();

    useEffect(() => {
        if (!roomId) {
            setBookings([]);
            setRoomInfo(null);
            return;
        }

        const fetchRoomBookings = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Récupérer les infos de la salle depuis le store ou l'API
                let roomInstance: Room | null = null;

                // D'abord chercher dans les salles déjà chargées dans le store
                if (rooms && rooms.length > 0) {
                    // Trouver la room par id depuis le store
                    const storeRoom = rooms.find(r => String(r.id) === String(roomId));

                    if (storeRoom) {
                        // Convertir l'objet du store en instance de Room
                        roomInstance = new Room();
                        roomInstance.id = storeRoom.id;
                        roomInstance.name = storeRoom.name;
                        roomInstance.capacity = storeRoom.capacity;
                        roomInstance.imageUrl = storeRoom.imageUrl;
                        roomInstance.roomEquipments = storeRoom.roomEquipments || [];
                    }
                }

                // Si la salle n'est pas trouvée dans le store, charger depuis l'API
                if (!roomInstance) {
                    try {
                        roomInstance = await Room.getById(roomId);
                    } catch (e) {
                        const allRooms = await Room.getAll();
                        const foundRoom = allRooms.find(r => String(r.id) === String(roomId));
                        if (foundRoom) roomInstance = foundRoom;
                    }
                }

                if (!roomInstance) {
                    console.warn(`Salle avec ID ${roomId} non trouvée`);
                    setError(`Salle avec ID ${roomId} non trouvée`);
                    return;
                }

                setRoomInfo(roomInstance);

                const allBookings = await Booking.getAll();

                // Filtrer par salle en utilisant strictement String() pour les IDs
                const roomBookings = allBookings.filter(booking =>
                    booking.room && String(booking.room.id) === String(roomId)
                );

                setBookings(roomBookings);
            } catch (err) {
                console.error("Erreur lors du chargement des réservations :", err);
                setError("Impossible de charger les disponibilités de la salle.");
            } finally {
                setLoading(false);
            }
        };

        void fetchRoomBookings();
    }, [roomId, rooms, selectedDate]);

    // Créer les événements pour le calendrier
    const events = [
        // Réservations existantes
        ...bookings.map(booking => ({
            id: booking.id,
            title: booking.title,
            start: booking.startTime,
            end: booking.endTime,
            backgroundColor: '#f87171',
            borderColor: '#ef4444',
            textColor: '#ffffff',
            extendedProps: {
                organizer: booking.organizer,
                attendees: booking.attendees
            }
        })),

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
        }] : [])
    ];

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        if (onSlotSelect) {
            onSlotSelect(selectInfo.startStr, selectInfo.endStr);
        }
    };

    if (loading) {
        return <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement des disponibilités...</span>
        </div>;
    }

    if (error) {
        return <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="mr-2" size={16}/>
            {error}
        </div>;
    }

    if (!roomId) {
        return <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
            Sélectionnez une salle pour voir ses disponibilités
        </div>;
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
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
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
                        {arg.event.id !== 'current' && (
                            <div className="text-xs opacity-80">
                                {arg.event.extendedProps.organizer} ·
                                {arg.event.extendedProps.attendees} pers.
                            </div>
                        )}
                    </div>
                )}
            />

            <div className="mt-3 text-sm text-gray-500 grid grid-cols-2 gap-2">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
                    <span>Créneaux réservés</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                    <span>Votre réservation</span>
                </div>
            </div>
        </div>
    );
};