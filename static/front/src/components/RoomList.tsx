import React from 'react';
import { useStore } from '../store';
import { Monitor, Users } from 'lucide-react';

export const RoomList = () => {
    const { rooms, equipment } = useStore();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Gestion des salles</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">{room.name}</h2>

                        <div className="flex items-center mb-4">
                            <Users className="w-5 h-5 text-gray-500 mr-2" />
                            <span>Capacité: {room.capacity} personnes</span>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Équipements:</h3>
                            <ul className="space-y-2">
                                {room.equipment.map((equipId) => {
                                    const equip = equipment.find((e) => e.id === equipId);
                                    return (
                                        <li key={equipId} className="flex items-center">
                                            <Monitor className="w-4 h-4 text-gray-500 mr-2" />
                                            <span>{equip?.name}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};