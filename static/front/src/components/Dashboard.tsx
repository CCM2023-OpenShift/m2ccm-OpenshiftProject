import React from 'react';
import { useStore } from '../store';
import { Calendar, Users, BookOpen } from 'lucide-react';

export const Dashboard = () => {
    const { rooms, bookings } = useStore();

    const upcomingBookings = bookings.filter(
        (booking) => new Date(booking.startTime) > new Date()
    );

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                        <h2 className="text-xl font-semibold">Réservations à venir</h2>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <BookOpen className="w-6 h-6 text-green-500 mr-2" />
                        <h2 className="text-xl font-semibold">Salles disponibles</h2>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{rooms.length}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <Users className="w-6 h-6 text-purple-500 mr-2" />
                        <h2 className="text-xl font-semibold">Capacité totale</h2>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                        {rooms.reduce((acc, room) => acc + room.capacity, 0)}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Prochaines réservations</h2>
                {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                            <div key={booking.id} className="border-b pb-4">
                                <h3 className="font-semibold">{booking.title}</h3>
                                <p className="text-gray-600">
                                    {new Date(booking.startTime).toLocaleString()} -
                                    {new Date(booking.endTime).toLocaleString()}
                                </p>
                                <p className="text-gray-600">
                                    Salle: {rooms.find(room => room.id === booking.roomId)?.name}
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