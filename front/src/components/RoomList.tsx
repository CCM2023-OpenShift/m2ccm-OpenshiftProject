import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Monitor, Users, Plus, Edit, Trash, X } from 'lucide-react';
import { Room } from '../types';

export const RoomList = () => {
    const { rooms, equipment, fetchRooms, fetchEquipmentFixed, addRoom, updateRoom, deleteRoom } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        capacity: '',
        roomEquipments: [] as { equipmentId: string; quantity: number }[],
    });

    useEffect(() => {
        void fetchRooms();
        void fetchEquipmentFixed();
    }, [fetchRooms, fetchEquipmentFixed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const roomData = {
            name: formData.name,
            capacity: Number(formData.capacity),
            roomEquipments: formData.roomEquipments.map((re) => ({
                id: '',
                quantity: re.quantity,
                equipmentId: re.equipmentId,
                roomId: '',
            })),
        };

        if (editingRoom?.id) {
            await updateRoom({ ...roomData, id: editingRoom.id } as Room);
        } else {
            await addRoom(roomData);
            await fetchRooms();
        }

        setIsModalOpen(false);
        setEditingRoom(null);
        setFormData({ name: '', capacity: '', roomEquipments: [] });
    };

    const handleEdit = (room: Room) => {
        setEditingRoom(room);
        setFormData({
            name: room.name,
            capacity: room.capacity.toString(),
            roomEquipments: room.roomEquipments.map((re) => ({
                id: re.id,
                equipmentId: re.equipmentId,
                quantity: re.quantity,
                roomId: re.roomId,
            })),
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (roomId: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
            await deleteRoom(roomId);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestion des salles</h1>
                <button
                    onClick={() => {
                        setEditingRoom(null);
                        setFormData({ name: '', capacity: '', roomEquipments: [] });
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter une salle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold">{room.name}</h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEdit(room)}
                                    className="text-blue-500 hover:text-blue-600"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(room.id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center mb-4">
                            <Users className="w-5 h-5 text-gray-500 mr-2" />
                            <span>Capacité: {room.capacity} personnes</span>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Équipements:</h3>
                            {Array.isArray(room.roomEquipments) && room.roomEquipments.length > 0 ? (
                                <ul className="space-y-2">
                                    {room.roomEquipments.map((re, index) => {
                                        const matchedEquipment = equipment.find(eq => eq.id === re.equipmentId);
                                        if (!matchedEquipment || matchedEquipment.mobile) return null;

                                        return (
                                            <li key={index} className="flex items-center">
                                                <Monitor className="w-4 h-4 text-gray-500 mr-2" />
                                                <span>{matchedEquipment.name} – {re.quantity}x</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Aucun équipement</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {editingRoom ? 'Modifier la salle' : 'Ajouter une salle'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Nom de la salle
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Capacité
                                </label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    min="0"
                                />
                            </div>

                            {equipment.filter((re) => !re.mobile).length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Équipements
                                    </label>
                                    <div className="max-h-64 overflow-y-auto border rounded p-2">
                                        {equipment
                                            .filter((re) => !re.mobile)
                                            .map((re) => {
                                                const name = re.name;
                                                const existing = formData.roomEquipments.find(e => e.equipmentId === re.id);
                                                return (
                                                    <div key={re.id} className="flex items-center justify-between mb-2">
                                                        <label className="flex items-center space-x-2 w-full">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!existing}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            roomEquipments: [
                                                                                ...prev.roomEquipments,
                                                                                { equipmentId: re.id, quantity: 1 },
                                                                            ],
                                                                        }));
                                                                    } else {
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            roomEquipments: prev.roomEquipments.filter(
                                                                                (eq) => eq.equipmentId !== re.id
                                                                            ),
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <span className="flex-1">{name}</span>
                                                        </label>
                                                        {existing && (
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-16 border rounded px-1 ml-2"
                                                                value={existing.quantity}
                                                                onChange={(e) => {
                                                                    const qty = Number(e.target.value);
                                                                    setFormData((prev) => ({
                                                                        ...prev,
                                                                        roomEquipments: prev.roomEquipments.map((eq) =>
                                                                            eq.equipmentId === re.id ? { ...eq, quantity: qty } : eq
                                                                        ),
                                                                    }));
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                {editingRoom ? 'Modifier' : 'Ajouter'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
