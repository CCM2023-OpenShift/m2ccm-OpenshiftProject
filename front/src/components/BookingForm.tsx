import React, { useEffect, useState } from 'react';
import { useStore } from "../store.ts";
import { Room } from '../services/Room';
import { Booking } from '../services/Booking';
import { Equipment } from "../services/Equipment.ts";
import { RoomEquipment } from "../services/RoomEquipment.ts";
import { roundUpToNextHalfHour, formatDateTimeLocal } from '../composable/formatTimestamp.ts';

export const BookingForm = () => {
    const { fetchEquipment } = useStore();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [availableEquipments, setAvailableEquipments] = useState<any[]>([]);
    const [availableEquipmentsMobile, setAvailableEquipmentsMobile] = useState<any[]>([]);

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const roundedNow = roundUpToNextHalfHour(now);
    const roundedOneHourLater = roundUpToNextHalfHour(oneHourLater);
    const formattedStartTime = formatDateTimeLocal(roundedNow);
    const formattedEndTime = formatDateTimeLocal(roundedOneHourLater);

    const initialBookingData = {
        title: '',
        roomId: '',
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        attendees: '',
        bookingEquipments: [] as {
            equipmentId: string;
            quantity: number;
            startTime: string;
            endTime: string;
        }[],
        organizer: '',
    };

    const [formData, setFormData] = useState(initialBookingData);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomsData = await Room.getAll();
                setRooms(roomsData);
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

    useEffect(() => {
        const fetchAvailableEquipments = async () => {
            if (!formData.startTime || !formData.endTime) return;

            try {
                const availableEquipment = await Booking.getAvailableEquipments(formData.startTime, formData.endTime);
                const filteredAndMapped = availableEquipment
                    .filter((e) => e.available > 0)
                setAvailableEquipmentsMobile(filteredAndMapped);
            } catch (error) {
                console.error("Erreur lors du chargement des équipements disponibles :", error);
                setAvailableEquipmentsMobile([]);
            }
        };

        void fetchAvailableEquipments();
    }, [formData.startTime, formData.endTime]);

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
            bookingEquipments: formData.bookingEquipments
                .filter((be) => be.quantity > 0)
                .map((be) => ({
                    equipmentId: String(be.equipmentId),
                    quantity: be.quantity,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                })),
        };

        try {
            const booking = new Booking();
            Object.assign(booking, bookingData);
            await booking.create();

            alert("Réservation créée avec succès!");
            setErrorMessage('');
            setFormData(initialBookingData);
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
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, roomId: e.target.value})}
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
                            onChange={(e) =>
                                setFormData({...formData, startTime: e.target.value})
                            }
                            min={formatDateTimeLocal(new Date())}
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
                            onChange={(e) =>
                                setFormData({...formData, endTime: e.target.value})
                            }
                            min={formData.startTime}
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
                        onChange={(e) => setFormData({...formData, attendees: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {formData.startTime && formData.endTime ? (
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Équipements mobiles disponibles à la réservation (pour ce créneau)
                        </label>
                        <div className="max-h-64 overflow-y-auto border rounded p-2">
                            {availableEquipmentsMobile.map((req) => {
                                const quantity = req.available || 0;
                                const existing = formData.bookingEquipments.find(e => e.equipmentId === req.equipmentId) || {
                                    equipmentId: req.equipmentId,
                                    quantity: 0,
                                    startTime: formData.startTime,
                                    endTime: formData.endTime,
                                };

                                return (
                                    <div key={req.equipmentId} className="flex items-center justify-between mb-2">
                                        <span className="flex-1">
                                            {req.name}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={quantity}
                                            className="w-20 border rounded px-1 ml-2"
                                            value={existing.quantity}
                                            onChange={(e) => {
                                                const qty = Number(e.target.value);
                                                setFormData((prev) => {
                                                    const exists = prev.bookingEquipments.find(eq => eq.equipmentId === req.equipmentId);
                                                    if (exists) {
                                                        return {
                                                            ...prev,
                                                            bookingEquipments: prev.bookingEquipments.map((eq) =>
                                                                eq.equipmentId === req.equipmentId
                                                                    ? {...eq, quantity: qty}
                                                                    : eq
                                                            ),
                                                        };
                                                    } else {
                                                        return {
                                                            ...prev,
                                                            bookingEquipments: [
                                                                ...prev.bookingEquipments,
                                                                {
                                                                    equipmentId: req.equipmentId,
                                                                    quantity: qty,
                                                                    startTime: prev.startTime,
                                                                    endTime: prev.endTime,
                                                                },
                                                            ],
                                                        };
                                                    }
                                                });
                                            }}
                                        />
                                        <span className="text-gray-600"> / {quantity}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                        Veuillez sélectionner une date de début et de fin pour voir les équipements mobiles disponibles.
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errorMessage
                            .split('\n')
                            .filter(line => line.trim() !== '')
                            .map((line, index) => (
                                <p key={index} className={index > 0 ? 'ml-4' : ''}>
                                    {index === 0 ? line : `- ${line}`}
                                </p>
                            ))}
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
