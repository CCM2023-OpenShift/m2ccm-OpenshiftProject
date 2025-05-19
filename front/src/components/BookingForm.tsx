import React, { useEffect, useState } from 'react';
import { Room } from '../services/Room.ts';
import { Booking } from '../services/Booking.ts';
import {useStore} from "../store.ts";
import {Equipment} from "../services/Equipment.ts";
import {RoomEquipment} from "../services/RoomEquipment.ts";

export const BookingForm = () => {
    const { fetchEquipment } = useStore();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [availableEquipments, setAvailableEquipments] = useState<any[]>([]);
    const [availableEquipmentsMobile, setAvailableEquipmentsMobile] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        roomId: '',
        startTime: '',
        endTime: '',
        attendees: '',
        bookingEquipments: [] as { equipmentId: string, quantity: number }[],
        organizer: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomsData = await Room.getAll();
                setRooms(roomsData);

                const allEquipments = await Equipment.getAll();
                const mobileAvailableEquipments = allEquipments.filter(
                    (eq) => eq.mobile && (eq.quantity ?? 0) > 0
                );
                setAvailableEquipmentsMobile(
                    mobileAvailableEquipments.map((eq) => ({
                        equipment: eq,
                        equipmentId: eq.id,
                        quantity: eq.quantity ?? 0
                    }))
                );
            } catch (error) {
                console.error('Erreur lors du chargement des données', error);
            }
        };

        void fetchData();
    }, []);


    useEffect(() => {
        if (!formData.roomId) {
            setAvailableEquipments([]);
            return;
        }

        const getEquipments = async () => {
            try {
                const equipments = await Equipment.getAll();
                const selectedRoom = rooms.find(room => String(room.id) === formData.roomId);
                if (!selectedRoom) {
                    setAvailableEquipments([]);
                    return;
                }

                const merged = selectedRoom.roomEquipments.map(roomEquip => {
                    const equipId = roomEquip.equipmentId;
                    const detail = equipments.find((e: Equipment) => e.id === equipId);
                    return {
                        ...roomEquip,
                        equipment: detail ? { name: detail.name, mobile: detail.mobile } : { name: 'Inconnu', mobile: false },
                    } as RoomEquipment;
                });

                setAvailableEquipments(merged);
            } catch (err) {
                console.error('Erreur lors de la récupération des équipements :', err);
                setAvailableEquipments([]);
            }
        };

        void getEquipments();
    }, [formData.roomId, rooms, fetchEquipment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedRoom = rooms.find((room) => Number(room.id) === Number(formData.roomId));
        if (!selectedRoom) {
            alert("La salle sélectionnée n'est pas valide.");
            return;
        }

        const bookingData = {
            title: formData.title,
            startTime: formData.startTime,
            endTime: formData.endTime,
            attendees: parseInt(formData.attendees),
            organizer: formData.organizer,
            room: selectedRoom,
            bookingEquipments: formData.bookingEquipments.map((be) => ({
                equipmentId: String(be.equipmentId),
                quantity: be.quantity,
            })),
        };

        try {
            const booking = new Booking();
            Object.assign(booking, bookingData);
            await booking.create();

            alert("Réservation créée avec succès!");
            setErrorMessage('');
            setFormData({
                title: '',
                roomId: '',
                startTime: '',
                endTime: '',
                attendees: '',
                bookingEquipments: [],
                organizer: '',
            });
        } catch (error) {
            console.error("Error creating booking:", error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('Une erreur inconnue est survenue.');
            }
        }
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

                {formData.roomId && (
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Équipements fixes disponibles dans la salle
                        </label>
                        <ul className="list-disc list-inside text-gray-800 space-y-1 ml-6">
                            {availableEquipments.map((req) => {
                                const equipment = req.equipment;
                                return (
                                    <li key={req.equipmentId}>
                                        <strong>{equipment.name ?? 'Inconnu'}</strong> x{req.quantity}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

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

                {availableEquipmentsMobile.filter((req) => req.equipment.mobile).length > 0 && (
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Équipements mobiles disponibles à la réservation (pour ce créneau)
                        </label>
                        <div className="max-h-64 overflow-y-auto border rounded p-2">
                            {availableEquipmentsMobile
                                .filter((req) => req.equipment.mobile)
                                .map((req) => {
                                    const equipment = req.equipment;
                                    const quantity = req.quantity || 0;
                                    const existing = formData.bookingEquipments.find(e => e.equipmentId === req.equipmentId);

                                    return (
                                        <div key={req.equipmentId} className="flex items-center justify-between mb-2">
                                            <label className="flex items-center space-x-2 w-full">
                                                <input
                                                    type="checkbox"
                                                    checked={!!existing}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                bookingEquipments: [
                                                                    ...prev.bookingEquipments,
                                                                    { equipmentId: req.equipmentId, quantity: 1 },
                                                                ],
                                                            }));
                                                        } else {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                bookingEquipments: prev.bookingEquipments.filter(
                                                                    (eq) => eq.equipmentId !== req.equipmentId
                                                                ),
                                                            }));
                                                        }
                                                    }}
                                                />
                                                <span className="flex-1">
                                                    {equipment.name} (Disponible : {quantity})
                                                </span>
                                            </label>
                                            {existing && (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={quantity}
                                                    className="w-16 border rounded px-1 ml-2"
                                                    value={existing.quantity}
                                                    onChange={(e) => {
                                                        const qty = Number(e.target.value);
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            bookingEquipments: prev.bookingEquipments.map((eq) =>
                                                                eq.equipmentId === req.equipmentId
                                                                    ? { ...eq, quantity: qty }
                                                                    : eq
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

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errorMessage}
                    </div>
                )}

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
