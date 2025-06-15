import {useEffect, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import {useStore} from '../store';
import {useKeycloak} from '@react-keycloak/web';
import {Booking} from '../types';
import {useNavigate} from 'react-router-dom';
import {EventClickArg} from '@fullcalendar/core';
import {AlertCircle, Info, Loader, User, Users} from 'lucide-react';

// Interface pour les propriétés modales
interface BookingDetailModalProps {
    booking: Booking | null;
    onClose: () => void;
    isAdmin: boolean;
    currentUser: any;
}

// Composant pour afficher les détails d'une réservation
const BookingDetailModal = ({booking, onClose, isAdmin, currentUser}: BookingDetailModalProps) => {
    if (!booking) return null;

    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Vérifier si l'utilisateur actuel est l'organisateur de cette réservation
    const isOrganizerOf = (booking: Booking) =>
        currentUser && booking.organizer === currentUser.username;

    // Déterminer si l'utilisateur peut voir les détails complets
    const showDetails = isAdmin || isOrganizerOf(booking);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 md:p-8"
                 onClick={e => e.stopPropagation()}>
                <div className="mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-900">{booking.title}</h3>
                </div>

                <div className="space-y-3 mb-5">
                    <div className="flex items-start">
                        <div className="text-blue-500 mr-3">
                            <Info size={18}/>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Salle</p>
                            <p className="font-medium">{booking.room?.name}</p>
                        </div>
                    </div>

                    {showDetails && (
                        <div className="flex items-start">
                            <div className="text-blue-500 mr-3">
                                <Users size={18}/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Participants</p>
                                <p className="font-medium">{booking.attendees} personnes</p>
                            </div>
                        </div>
                    )}

                    {showDetails && (
                        <div className="flex items-start">
                            <div className="text-blue-500 mr-3">
                                <User size={18}/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Organisateur</p>
                                <p className="font-medium">{booking.organizer}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start">
                        <div className="text-blue-500 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                 strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Horaires</p>
                            <p className="font-medium">
                                {startDate.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                                <br/>
                                {formatTime(startDate)} - {formatTime(endDate)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800 font-medium text-sm transition"
                        onClick={onClose}
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export const BookingCalendar = () => {
    // Extraction des données et fonctions du store
    const {bookings, loading, fetchBookings, currentUser} = useStore(state => ({
        bookings: state.bookings,
        loading: state.loading.bookings,
        fetchBookings: state.fetchBookings,
        currentUser: state.currentUser
    }));

    const [selectedRoom, setSelectedRoom] = useState<string>('all');
    const [calendarView, setCalendarView] = useState('timeGridWeek');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [userFilter, setUserFilter] = useState<'all' | 'mine'>('all');
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const {keycloak} = useKeycloak();
    const isAdmin = keycloak.tokenParsed?.realm_access?.roles?.includes('admin') || false;

    useEffect(() => {
        const loadBookings = async () => {
            try {
                setError(null);
                await fetchBookings();
            } catch (err) {
                console.error("Erreur lors du chargement des réservations:", err);
                setError("Impossible de charger les réservations. Veuillez réessayer plus tard.");
            }
        };

        void loadBookings();
    }, [fetchBookings]);

    // Liste des salles uniques
    const rooms = Array.from(new Set(bookings.map(b => b.room?.name).filter(Boolean)));

    // Filtrer les réservations
    const filteredBookings = bookings.filter(b => {
        const matchesRoom = selectedRoom === 'all' || b.room?.name === selectedRoom;
        const matchesUser = userFilter === 'all' || (currentUser && b.organizer === currentUser.username);
        return matchesRoom && matchesUser;
    });

    const isOrganizerOf = (booking: Booking) =>
        currentUser && booking.organizer === currentUser.username;

    // Conversion des réservations en événements pour le calendrier avec des couleurs différentes
    const events = filteredBookings.map((booking) => {
        const isUserBooking = isOrganizerOf(booking);
        const showDetails = isAdmin || isUserBooking;

        // Déterminer la couleur en fonction du type de réservation
        let backgroundColor;
        if (isUserBooking) {
            backgroundColor = '#4f46e5'; // Indigo pour les réservations de l'utilisateur
        } else if (selectedRoom !== 'all') {
            backgroundColor = '#1e40af'; // Bleu foncé pour la salle sélectionnée
        } else {
            // Couleur basée sur la salle pour une meilleure différenciation
            const roomIndex = rooms.indexOf(booking.room?.name || '');
            const baseColors = [
                '#3b82f6', // Bleu
                '#10b981', // Vert émeraude
                '#f59e0b', // Orange amber
                '#8b5cf6', // Violet
                '#ec4899', // Rose
                '#14b8a6', // Turquoise
                '#ef4444'  // Rouge
            ];
            backgroundColor = baseColors[roomIndex % baseColors.length];
        }

        return {
            id: booking.id,
            title: showDetails ? booking.title : 'Réservé',
            start: booking.startTime,
            end: booking.endTime,
            backgroundColor,
            borderColor: isUserBooking ? '#312e81' : undefined, // Bordure plus foncée pour les réservations de l'utilisateur
            textColor: '#ffffff',
            extendedProps: {
                booking,
                room: booking.room?.name,
                organizer: booking.organizer,
                showDetails,
                isUserBooking
            }
        };
    });

    // Gestionnaire de clic sur un événement
    const handleEventClick = (info: EventClickArg) => {
        const booking = info.event.extendedProps.booking;
        setSelectedBooking(booking);
    };

    // Gestionnaire pour créer une nouvelle réservation
    const handleDateSelect = (selectInfo: any) => {
        if (selectedRoom === 'all') {
            // Si aucune salle n'est sélectionnée, rediriger avec les dates uniquement
            navigate(`/create-booking?date=${selectInfo.startStr.split('T')[0]}&start=${selectInfo.startStr.split('T')[1]}&end=${selectInfo.endStr.split('T')[1]}`);
        } else {
            // Si une salle est sélectionnée, inclure l'ID de la salle dans la redirection
            const room = bookings.find(b => b.room?.name === selectedRoom)?.room;
            if (room) {
                navigate(`/create-booking?roomId=${room.id}&date=${selectInfo.startStr.split('T')[0]}&start=${selectInfo.startStr.split('T')[1]}&end=${selectInfo.endStr.split('T')[1]}`);
            }
        }
    };

    const renderLoading = () => (
        <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-10 w-10 text-blue-500 mr-3"/>
            <span className="text-lg text-gray-600">Chargement du calendrier...</span>
        </div>
    );

    if (loading && bookings.length === 0) return renderLoading();

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Calendrier des réservations</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2"/>
                    <span>{error}</span>
                </div>
            )}

            <div className="mb-6 flex flex-wrap gap-3 md:gap-4">
                {/* Sélecteur de salle */}
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Salle :</label>
                    <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="w-full md:w-64 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Toutes les salles</option>
                        {rooms.map((roomName) => (
                            <option key={roomName} value={roomName}>{roomName}</option>
                        ))}
                    </select>
                </div>

                {/* Filtres par utilisateur (si connecté) */}
                {currentUser && (
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium mb-1 text-gray-700">Afficher :</label>
                        <div className="flex rounded-md overflow-hidden border border-gray-300">
                            <button
                                onClick={() => setUserFilter('all')}
                                className={`px-4 py-2 text-sm font-medium ${userFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Toutes
                            </button>
                            <button
                                onClick={() => setUserFilter('mine')}
                                className={`px-4 py-2 text-sm font-medium ${userFilter === 'mine' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Mes réservations
                            </button>
                        </div>
                    </div>
                )}

                {/* Légende des couleurs */}
                <div className="flex items-end ml-auto">
                    {currentUser && (
                        <div className="flex items-center mr-4">
                            <span className="inline-block w-4 h-4 bg-indigo-600 rounded-sm mr-1"></span>
                            <span className="text-sm text-gray-600">Vos réservations</span>
                        </div>
                    )}
                    <div className="flex items-center">
                        <span className="inline-block w-4 h-4 bg-blue-500 rounded-sm mr-1"></span>
                        <span className="text-sm text-gray-600">Autres réservations</span>
                    </div>
                </div>
            </div>

            {loading && bookings.length > 0 ? renderLoading() : (
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    locale={frLocale}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    events={events}
                    height="auto"
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    nowIndicator={true}
                    businessHours={[
                        {
                            daysOfWeek: [1, 2, 3, 4, 5], // Lundi-vendredi
                            startTime: '08:00',
                            endTime: '18:00',
                        }
                    ]}
                    viewDidMount={(view) => setCalendarView(view.view.type)}
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    eventContent={(arg) => {
                        const isUserEvent = arg.event.extendedProps.isUserBooking;
                        return (
                            <div className={`p-1 ${isUserEvent ? 'border-l-4 border-indigo-800' : ''}`}>
                                <div className="font-semibold">{arg.event.title}</div>
                                {arg.event.extendedProps.showDetails && (
                                    <>
                                        <div className="text-xs opacity-90">
                                            {arg.event.extendedProps.room}
                                        </div>
                                        <div className="text-xs flex items-center">
                                            <User className="h-3 w-3 mr-1"/>
                                            {arg.event.extendedProps.organizer}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    }}
                />
            )}

            {/* Affichage des détails d'une réservation */}
            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    isAdmin={isAdmin}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};