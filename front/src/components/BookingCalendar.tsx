import {useEffect, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import {useStore} from '../store';
import {useKeycloak} from '@react-keycloak/web';
import {Booking} from '../types';

export const BookingCalendar = () => {
    // Extraction des données et fonctions du store
    const {bookings, loading, fetchBookings, currentUser} = useStore(state => ({
        bookings: state.bookings,
        loading: state.loading.bookings, // Accès spécifique à l'état de chargement des réservations
        fetchBookings: state.fetchBookings,
        currentUser: state.currentUser
    }));

    const [selectedRoom, setSelectedRoom] = useState<string>('all');

    const {keycloak} = useKeycloak();
    const isAdmin = keycloak.tokenParsed?.realm_access?.roles?.includes('admin') || false;

    useEffect(() => {
        void fetchBookings();
    }, [fetchBookings]);

    const rooms = Array.from(new Set(bookings.map(b => b.room?.name).filter(Boolean)));

    const filteredBookings = selectedRoom === 'all'
        ? bookings
        : bookings.filter(b => b.room?.name === selectedRoom);

    const isOrganizerOf = (booking: Booking) =>
        currentUser && booking.organizer === currentUser.username;

    const events = filteredBookings.map((booking) => {
        const showDetails = isAdmin || isOrganizerOf(booking);
        return {
            title: showDetails ? booking.title : 'Réservé',
            start: booking.startTime,
            end: booking.endTime,
            extendedProps: {
                room: booking.room?.name,
                showDetails
            }
        };
    });

    if (loading) return <div className="p-6">Chargement du calendrier...</div>;

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
                        <strong>{arg.event.title}</strong><br/>
                        {arg.event.extendedProps.showDetails && (
                            <span className="text-xs">{arg.event.extendedProps.room}</span>
                        )}
                    </div>
                )}
            />
        </div>
    );
};