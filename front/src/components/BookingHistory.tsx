import { useEffect, useState } from 'react';
import { Booking } from '../services/Booking';

export const BookingHistory = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div className="p-6">Chargement de l'historique...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Historique des réservations</h1>
            {pastBookings.length > 0 ? (
                <div className="space-y-4">
                    {pastBookings.map((booking) => (
                        <div key={booking.id} className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="font-semibold">{booking.title}</h3>
                            <p className="text-gray-600">
                                {booking.startTime} - {booking.endTime}
                            </p>
                            <p className="text-gray-600">
                                Salle : {booking.room?.name ?? 'Salle inconnue'}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Aucune réservation passée.</p>
            )}
        </div>
    );
};
