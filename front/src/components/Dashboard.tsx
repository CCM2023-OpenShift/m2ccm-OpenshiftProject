import { useEffect, useState } from 'react';
import { Room } from '../services/Room';
import { Booking } from '../services/Booking';
import { Calendar, Users, BookOpen } from 'lucide-react';

export const Dashboard = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomsData = await Room.getAll();
                setRooms(roomsData);

                const bookingsData = await Booking.getAll();
                setBookings(bookingsData);
            } catch (error) {
                console.error("Erreur lors du chargement des données :", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, []);

    const now = new Date();

    const ongoingBookings = bookings
        .filter(booking =>
            new Date(booking.startTime) <= now && new Date(booking.endTime) > now
        )
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const upcomingBookings = bookings
        .filter(booking => new Date(booking.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());


    if (loading) {
        return <div className="p-6">Chargement...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-orange-500 mr-2"/>
                        <h2 className="text-lg font-semibold">En cours</h2>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                        {ongoingBookings.length}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-blue-500 mr-2"/>
                        <h2 className="text-lg font-semibold">À venir</h2>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                        {upcomingBookings.length}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center mb-2">
                        <BookOpen className="w-5 h-5 text-green-500 mr-2"/>
                        <h2 className="text-lg font-semibold">Salles</h2>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{rooms.length}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center mb-2">
                        <Users className="w-5 h-5 text-purple-500 mr-2"/>
                        <h2 className="text-lg font-semibold">Capacité</h2>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                        {rooms.reduce((acc, room) => acc + room.capacity, 0)}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Réservations en cours</h2>
                {ongoingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {ongoingBookings.map((booking) => (
                            <div key={booking.id} className="border-b pb-4">
                                <h3 className="font-semibold">{booking.title}</h3>
                                <p className="text-gray-600">
                                    {new Date(booking.startTime).toLocaleString()} -{' '}
                                    {new Date(booking.endTime).toLocaleString()}
                                </p>
                                <p className="text-gray-600">
                                    Salle : {booking.room?.name || 'Salle inconnue'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Aucune réservation en cours</p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Prochaines réservations</h2>
                {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                            <div key={booking.id} className="border-b pb-4">
                                <h3 className="font-semibold">{booking.title}</h3>
                                <p className="text-gray-600">
                                    {new Date(booking.startTime).toLocaleString()} -{' '}
                                    {new Date(booking.endTime).toLocaleString()}
                                </p>
                                <p className="text-gray-600">
                                    Salle : {booking.room?.name || 'Salle inconnue'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Aucune réservation à venir</p>
                )}
            </div>
        </div>
    );
};
