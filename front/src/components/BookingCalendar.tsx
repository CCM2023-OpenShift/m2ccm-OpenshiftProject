import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { Booking } from '../services/Booking';

export const BookingCalendar = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<string>('all');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await Booking.getAll();
                setBookings(data);
            } catch (error) {
                console.error("Erreur lors du chargement des réservations :", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchBookings();
    }, []);

    // Récupération des noms de salles uniques
    const rooms = Array.from(new Set(bookings.map(b => b.room?.name).filter(Boolean)));

    // Filtrage des bookings en fonction de la salle sélectionnée
    const filteredBookings = selectedRoom === 'all'
        ? bookings
        : bookings.filter(b => b.room?.name === selectedRoom);

    const events = filteredBookings.map((booking) => ({
        title: booking.title,
        start: booking.startTime,
        end: booking.endTime,
        extendedProps: {
            room: booking.room?.name,
        },
    }));

    if (loading) {
        return <div className="p-6">Chargement du calendrier...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Calendrier des réservations</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Filtrer par salle :</label>
                <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="border border-gray-300 rounded p-2"
                >
                    <option value="all">Toutes les salles</option>
                    {rooms.map((roomName) => (
                        <option key={roomName} value={roomName}>{roomName}</option>
                    ))}
                </select>
            </div>

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={frLocale}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={events}
                height="auto"
                eventContent={(arg) => (
                    <div>
                        <strong>{arg.event.title}</strong><br />
                        <span className="text-xs">{arg.event.extendedProps.room}</span>
                    </div>
                )}
            />
        </div>
    );
};
