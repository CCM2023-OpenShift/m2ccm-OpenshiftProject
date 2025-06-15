import { useEffect, useState } from 'react';
import { Booking } from '../services/Booking';
import { formatBookingTimeRange } from '../composable/formatTimestamp';
import { User as UserIcon, Calendar, MapPin, Users } from 'lucide-react';
import { formatOrganizer } from '../composable/userFormatter';
import { useStore } from '../store';
import {useKeycloak} from "@react-keycloak/web";

export const BookingHistory = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Accès au store pour récupérer l'utilisateur courant
    const { currentUser } = useStore();

    // Vérifier si l'utilisateur est admin
    const isAdmin = useKeycloak().keycloak.tokenParsed?.realm_access?.roles?.includes('admin') || false;

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

    const pastBookings = bookings
        .filter((booking) => new Date(booking.endTime) < new Date())
        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

    // Vérifier si l'utilisateur est l'organisateur de la réservation
    const isOrganizerOf = (booking: Booking) => {
        return currentUser && booking.organizer === currentUser.username;
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Historique des réservations</h1>

            {pastBookings.length > 0 ? (
                <div className="space-y-4">
                    {pastBookings.map((booking) => {
                        // Vérifier si l'utilisateur peut voir les détails complets
                        const showDetails = isAdmin || isOrganizerOf(booking);

                        return (
                            <div key={booking.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <h3 className="font-semibold text-lg">{showDetails ? booking.title : "Réservé"}</h3>

                                <div className="mt-2 space-y-1.5">
                                    <p className="text-gray-600 flex items-start">
                                        <Calendar size={16} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                                        <span>{formatBookingTimeRange(booking.startTime, booking.endTime)}</span>
                                    </p>

                                    <p className="text-gray-600 flex items-start">
                                        <MapPin size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                                        <span>Salle : {booking.room?.name ?? 'Salle inconnue'}</span>
                                    </p>

                                    {showDetails && (
                                        <p className="text-gray-600 flex items-start">
                                            <UserIcon size={16} className="mr-2 mt-0.5 text-indigo-500 flex-shrink-0" />
                                            <span>Organisateur : {formatOrganizer(booking.organizer)}</span>
                                        </p>
                                    )}
                                </div>

                                {showDetails && booking.attendees > 0 && (
                                    <div className="mt-2 text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <Users size={14} className="mr-1" />
                                            {booking.attendees} participant{booking.attendees > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 text-lg">Aucune réservation passée.</p>
                    <p className="text-gray-400 text-sm mt-1">L'historique des réservations apparaîtra ici une fois les réservations terminées.</p>
                </div>
            )}
        </div>
    );
};

export default BookingHistory;