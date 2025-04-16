import React, { useState } from 'react';
import { useStore, addBooking } from '../store';
import { Calendar, Clock, Users } from 'lucide-react';

export const BookingForm = () => {
    const { rooms, equipment } = useStore();
    const [formData, setFormData] = useState({
        title: '',
        roomId: '',
        startTime: '',
        endTime: '',
        attendees: '',
        equipment: [] as string[],
        organizer: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addBooking({
            id: Date.now().toString(),
            ...formData,
            attendees: parseInt(formData.attendees),
        });
        setFormData({
            title: '',
            roomId: '',
            startTime: '',
            endTime: '',
            attendees: '',
            equipment: [],
            organizer: '',
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Réserver une salle</h1>

            <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Titre de la réservation
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Salle
                    </label>
                    <select
                        value={formData.roomId}
                        onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Sélectionner une salle</option>
                        {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                                {room.name} (Capacité: {room.capacity})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Date et heure de début
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Date et heure de fin
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Nombre de participants
                    </label>
                    <input
                        type="number"
                        value={formData.attendees}
                        onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="1"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Équipements nécessaires
                    </label>
                    <div className="space-y-2">
                        {equipment.map((equip) => (
                            <label key={equip.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.equipment.includes(equip.id)}
                                    onChange={(e) => {
                                        const newEquipment = e.target.checked
                                            ? [...formData.equipment, equip.id]
                                            : formData.equipment.filter((id) => id !== equip.id);
                                        setFormData({ ...formData, equipment: newEquipment });
                                    }}
                                    className="mr-2"
                                />
                                {equip.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Organisateur
                    </label>
                    <input
                        type="text"
                        value={formData.organizer}
                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Réserver la salle
                </button>
            </form>
        </div>
    );
};