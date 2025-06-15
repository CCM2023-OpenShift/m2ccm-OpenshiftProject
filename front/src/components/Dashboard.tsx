import {useState, useEffect} from 'react';
import {Calendar, MapPin, User as UserIcon, Users, ChevronDown, CheckCircle, BookOpen, Clock} from 'lucide-react';
import {formatBookingTimeRange} from '../composable/formatTimestamp';
import {formatOrganizer} from '../composable/userFormatter';
import {useStore} from '../store';
import {useKeycloak} from "@react-keycloak/web";
import {Booking} from '../types';

export const Dashboard = () => {
    const [visibleOngoing, setVisibleOngoing] = useState(5);
    const [visibleUpcoming, setVisibleUpcoming] = useState(5);
    const [visiblePastToday, setVisiblePastToday] = useState(5);

    // Extraction des données et méthodes du store
    const {currentUser, rooms, bookings, loading, fetchAllData} = useStore(state => ({
        currentUser: state.currentUser,
        rooms: state.rooms,
        bookings: state.bookings,
        loading: {
            rooms: state.loading.rooms,
            bookings: state.loading.bookings,
            currentUser: state.loading.currentUser
        },
        fetchAllData: state.fetchAllData
    }));

    // Récupération de l'état admin depuis Keycloak
    const {keycloak} = useKeycloak();
    const isAdmin = keycloak.tokenParsed?.realm_access?.roles?.includes('admin') || false;

    // Charger les données au montage du composant
    useEffect(() => {
        void fetchAllData();
    }, [fetchAllData]);

    const now = new Date();

    const currentTimeFormatted = new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(now);

    const isSameDay = (date1: Date, date2: Date): boolean =>
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();

    const ongoingBookings = bookings
        .filter(booking => {
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            return startTime <= now && endTime > now;
        })
        .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());

    const upcomingBookings = bookings
        .filter(booking => new Date(booking.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const pastBookingsToday = bookings
        .filter(booking => {
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            return endTime <= now && isSameDay(startTime, now);
        })
        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

    const upcomingBookingsToday = upcomingBookings.filter(booking => {
        const bookingStartDate = new Date(booking.startTime);
        return isSameDay(bookingStartDate, now);
    });

    const totalCapacity = rooms.reduce((acc, room) => acc + room.capacity, 0);

    const isOrganizerOf = (booking: Booking) => {
        return currentUser && booking.organizer === currentUser.username;
    };

    // Afficher un indicateur de chargement si des données sont en cours de chargement
    const isLoading = loading.rooms || loading.bookings || loading.currentUser;

    if (isLoading) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Chargement du tableau de bord...</span>
            </div>
        );
    }

    const BookingCard = ({booking}: { booking: Booking }) => {
        const showDetails = isAdmin || isOrganizerOf(booking);

        return (
            <div className="border-b pb-4 last:border-0">
                <h3 className="font-semibold">{showDetails ? booking.title : "Réservé"}</h3>

                <div className="mt-2 space-y-1.5">
                    <p className="text-gray-600 flex items-start">
                        <Calendar size={16} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0"/>
                        <span>{formatBookingTimeRange(booking.startTime, booking.endTime)}</span>
                    </p>

                    <p className="text-gray-600 flex items-start">
                        <MapPin size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0"/>
                        <span>Salle : {booking.room?.name || 'Salle inconnue'}</span>
                    </p>

                    {showDetails && (
                        <p className="text-gray-600 flex items-start">
                            <UserIcon size={16} className="mr-2 mt-0.5 text-indigo-500 flex-shrink-0"/>
                            <span>Organisateur : {formatOrganizer(booking.organizer)}</span>
                        </p>
                    )}
                </div>

                {showDetails && booking.attendees > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                            <Users size={14} className="mr-1"/>
                            {booking.attendees} participant{booking.attendees > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    const LoadMoreButton = ({currentCount, totalCount, onClick}: {
        currentCount: number,
        totalCount: number,
        onClick: () => void
    }) => {
        const remainingCount = totalCount - currentCount;
        if (remainingCount <= 0) return null;

        return (
            <button
                onClick={onClick}
                className="mt-4 w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <ChevronDown className="w-4 h-4 mr-2"/>
                Afficher {Math.min(5, remainingCount)} réservation{Math.min(5, remainingCount) > 1 ? 's' : ''} supplémentaire{Math.min(5, remainingCount) > 1 ? 's' : ''}
            </button>
        );
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-2">
                        <div className="rounded-full bg-orange-100 p-2 mr-3">
                            <Calendar className="w-5 h-5 text-orange-500"/>
                        </div>
                        <h2 className="text-lg font-semibold">En cours</h2>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                        {ongoingBookings.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {ongoingBookings.length === 0 ? 'Aucune réservation en cours' :
                            ongoingBookings.length === 1 ? '1 réservation active' :
                                `${ongoingBookings.length} réservations actives`}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-2">
                        <div className="rounded-full bg-blue-100 p-2 mr-3">
                            <Clock className="w-5 h-5 text-blue-500"/>
                        </div>
                        <h2 className="text-lg font-semibold">À venir</h2>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                        {upcomingBookings.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {upcomingBookingsToday.length === 0 ? 'Aucune réservation aujourd\'hui' :
                            upcomingBookingsToday.length === 1 ? '1 réservation prévue aujourd\'hui' :
                                `${upcomingBookingsToday.length} réservations prévues aujourd'hui`}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-2">
                        <div className="rounded-full bg-green-100 p-2 mr-3">
                            <BookOpen className="w-5 h-5 text-green-500"/>
                        </div>
                        <h2 className="text-lg font-semibold">Salles</h2>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{rooms.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {rooms.length === 0 ? 'Aucune salle disponible' :
                            rooms.length === 1 ? '1 salle disponible' :
                                `${rooms.length} salles disponibles`}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-2">
                        <div className="rounded-full bg-purple-100 p-2 mr-3">
                            <Users className="w-5 h-5 text-purple-500"/>
                        </div>
                        <h2 className="text-lg font-semibold">Capacité</h2>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                        {totalCapacity}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Capacité totale de toutes les salles
                    </p>
                </div>
            </div>

            {/* Réservations en cours */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <div className="rounded-full bg-orange-100 p-1.5 mr-2">
                        <Calendar className="w-4 h-4 text-orange-500"/>
                    </div>
                    Réservations en cours
                </h2>

                {ongoingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {ongoingBookings.slice(0, visibleOngoing).map((booking) => (
                            <BookingCard key={booking.id} booking={booking}/>
                        ))}

                        <LoadMoreButton
                            currentCount={visibleOngoing}
                            totalCount={ongoingBookings.length}
                            onClick={() => setVisibleOngoing(prev => prev + 5)}
                        />
                    </div>
                ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <Calendar size={36} className="mx-auto text-gray-400 mb-2"/>
                        <p className="text-gray-500">Aucune réservation en cours actuellement</p>
                    </div>
                )}
            </div>

            {/* Réservations terminées aujourd'hui */}
            {pastBookingsToday.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <div className="rounded-full bg-gray-100 p-1.5 mr-2">
                            <CheckCircle className="w-4 h-4 text-gray-500"/>
                        </div>
                        Réservations terminées aujourd'hui
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            (avant {currentTimeFormatted})
                        </span>
                    </h2>

                    <div className="mb-3 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded">
                        <p>Cette section affiche les réservations du jour qui sont déjà terminées (l'heure de fin est
                            passée).</p>
                    </div>

                    <div className="space-y-4">
                        {pastBookingsToday.slice(0, visiblePastToday).map((booking) => (
                            <BookingCard key={booking.id} booking={booking}/>
                        ))}

                        <LoadMoreButton
                            currentCount={visiblePastToday}
                            totalCount={pastBookingsToday.length}
                            onClick={() => setVisiblePastToday(prev => prev + 5)}
                        />
                    </div>
                </div>
            )}

            {/* Prochaines réservations */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <div className="rounded-full bg-blue-100 p-1.5 mr-2">
                        <Clock className="w-4 h-4 text-blue-500"/>
                    </div>
                    Prochaines réservations
                </h2>

                {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.slice(0, visibleUpcoming).map((booking) => (
                            <BookingCard key={booking.id} booking={booking}/>
                        ))}

                        <LoadMoreButton
                            currentCount={visibleUpcoming}
                            totalCount={upcomingBookings.length}
                            onClick={() => setVisibleUpcoming(prev => prev + 5)}
                        />
                    </div>
                ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <Clock size={36} className="mx-auto text-gray-400 mb-2"/>
                        <p className="text-gray-500">Aucune réservation planifiée</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;