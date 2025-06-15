import React, {useEffect, useState} from 'react';
import {useKeycloak} from '@react-keycloak/web';
import {useStore} from "../store.ts";
import {useLocation} from 'react-router-dom';
import {Room} from '../services/Room';
import {Booking} from '../services/Booking';
import {Equipment} from "../services/Equipment.ts";
import {RoomEquipment} from "../services/RoomEquipment.ts";
import {User} from '../services/User.ts';
import {roundUpToNextHalfHour, formatDateTimeLocal} from '../composable/formatTimestamp.ts';
import {User as UserIcon, Shield, AlertCircle, CheckCircle} from 'lucide-react';

export const BookingForm = () => {
    const location = useLocation();
    const {keycloak} = useKeycloak();
    const {fetchEquipment} = useStore();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [availableEquipments, setAvailableEquipments] = useState<any[]>([]);
    const [availableEquipmentsMobile, setAvailableEquipmentsMobile] = useState<any[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [customOrganizerInput, setCustomOrganizerInput] = useState('');
    const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);

    const roles = keycloak.tokenParsed?.realm_access?.roles || [];
    const isAdmin = roles.includes('admin');
    const currentUser = keycloak.tokenParsed?.preferred_username || 'M0rd0rian';

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
        organizer: currentUser,
    };

    const [formData, setFormData] = useState(initialBookingData);

    // Extraire les paramètres de l'URL
    useEffect(() => {
        if (urlParamsLoaded) return;

        const queryParams = new URLSearchParams(location.search);
        const roomId = queryParams.get('roomId');
        const date = queryParams.get('date');
        const start = queryParams.get('start');
        const end = queryParams.get('end');
        const capacity = queryParams.get('capacity');

        const newFormData = {...formData};

        if (roomId) {
            newFormData.roomId = roomId;
        }

        if (date && start) {
            newFormData.startTime = `${date}T${start}`;
        }

        if (date && end) {
            newFormData.endTime = `${date}T${end}`;
        }

        if (capacity) {
            newFormData.attendees = capacity;
        }

        // Définir un titre par défaut si une salle est sélectionnée
        if (roomId && rooms.length > 0) {
            const selectedRoom = rooms.find(r => r.id === roomId);
            if (selectedRoom) {
                newFormData.title = `Réservation de ${selectedRoom.name}`;
            }
        }

        setFormData(newFormData);
        setUrlParamsLoaded(true);
    }, [location.search, rooms, urlParamsLoaded]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Charger les salles
                const roomsData = await Room.getAll();
                setRooms(roomsData);

                if (isAdmin) {
                    await fetchAvailableUsers();
                }

            } catch (error) {
                console.error('Erreur lors du chargement des données', error);
                setErrorMessage('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [isAdmin]);

    // Effet pour charger les paramètres d'URL après le chargement des salles
    useEffect(() => {
        if (rooms.length > 0 && !urlParamsLoaded) {
            const queryParams = new URLSearchParams(location.search);
            const roomId = queryParams.get('roomId');

            if (roomId) {
                const selectedRoom = rooms.find(r => r.id === roomId);
                if (selectedRoom) {
                    setFormData(prev => ({
                        ...prev,
                        roomId,
                        title: prev.title || `Réservation de ${selectedRoom.name}`
                    }));
                }
            }

            setUrlParamsLoaded(true);
        }
    }, [rooms, location.search, urlParamsLoaded]);

    const fetchAvailableUsers = async () => {
        try {
            const users = await User.getBookingOrganizers();
            setAvailableUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);

            // Fallback : seulement l'utilisateur connecté
            const fallbackUser = new User().fromJSON({
                id: 'current-user',
                username: currentUser,
                displayName: `${currentUser} (Vous - Keycloak indisponible)`,
                enabled: true
            });

            setAvailableUsers([fallbackUser]);
        }
    };

    // Gestion de l'input libre pour les admins
    const handleCustomOrganizerChange = (value: string) => {
        setCustomOrganizerInput(value);
        setFormData(prev => ({...prev, organizer: value}));
    };

    // Gestion de la sélection dans le dropdown
    const handleOrganizerSelect = (value: string) => {
        setFormData(prev => ({...prev, organizer: value}));
        setCustomOrganizerInput(''); // Reset l'input libre
    };

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
                        equipment: detail ? {name: detail.name, mobile: detail.mobile} : {
                            name: 'Inconnu',
                            mobile: false
                        },
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
        setLoading(true);

        try {
            const selectedRoom = rooms.find((room) => String(room.id) === String(formData.roomId));
            if (!selectedRoom) {
                setErrorMessage("La salle sélectionnée n'est pas valide.");
                setLoading(false);
                return;
            }

            if (!formData.organizer.trim()) {
                setErrorMessage('L\'organisateur est obligatoire');
                setLoading(false);
                return;
            }

            if (isAdmin && customOrganizerInput.trim()) {
                try {
                    const validation = await User.validateUsername(customOrganizerInput.trim());
                    if (!validation.valid) {
                        setErrorMessage(`Nom d'utilisateur invalide: ${validation.message}`);
                        setLoading(false);
                        return;
                    }
                } catch (validationError) {
                    console.warn('Validation error, proceeding anyway:', validationError);
                }
            }

            const bookingData = {
                title: formData.title,
                startTime: formData.startTime,
                endTime: formData.endTime,
                attendees: parseInt(formData.attendees as string),
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

            const booking = new Booking();
            Object.assign(booking, bookingData);
            await booking.create();

            alert("Réservation créée avec succès!");
            setErrorMessage('');
            setFormData(initialBookingData);
            setCustomOrganizerInput('');

        } catch (error) {
            console.error("Error creating booking:", error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('Une erreur inconnue est survenue.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && rooms.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-4">Chargement...</span>
            </div>
        );
    }

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
                        disabled={loading}
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
                        disabled={loading}
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
                            disabled={loading}
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
                            disabled={loading}
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
                        disabled={loading}
                    />
                </div>

                {/* CHAMP ORGANISATEUR */}
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2 items-center">
                        Organisateur
                    </label>

                    {!isAdmin ? (
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.organizer}
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                                title="Seuls les administrateurs peuvent modifier l'organisateur"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <UserIcon className="w-5 h-5 text-gray-400"/>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Dropdown */}
                            <select
                                value={customOrganizerInput ? '' : formData.organizer}
                                onChange={(e) => handleOrganizerSelect(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-orange-300"
                                disabled={loading}
                            >
                                <option value="">Sélectionner un organisateur connu</option>
                                {availableUsers.map((user) => (
                                    <option key={user.getUsername()} value={user.getUsername()}>
                                        {user.getDisplayName()}
                                    </option>
                                ))}
                            </select>

                            {/* Séparateur */}
                            <div className="flex items-center">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="px-3 text-sm text-gray-500">ou</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            {/* Input libre */}
                            <div>
                                <input
                                    type="text"
                                    value={customOrganizerInput}
                                    onChange={(e) => handleCustomOrganizerChange(e.target.value)}
                                    placeholder="Tapez un autre nom d'utilisateur..."
                                    className="w-full px-3 py-2 border rounded-lg border-dashed border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    <Shield className="w-3 h-3 mr-1"/>
                                    En tant qu'admin, vous pouvez saisir n'importe quel nom d'utilisateur
                                </p>
                            </div>

                            {/* Affichage de l'organisateur sélectionné */}
                            {formData.organizer && (
                                <div className="flex items-center text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2"/>
                                    <span className="text-green-700">
                                        Organisateur: <strong>{formData.organizer}</strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Équipements mobiles */}
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
                                            disabled={loading}
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
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start">
                        <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"/>
                        <div>
                            {errorMessage
                                .split('\n')
                                .filter(line => line.trim() !== '')
                                .map((line, index) => (
                                    <p key={index} className={index > 0 ? 'ml-4' : ''}>
                                        {index === 0 ? line : `- ${line}`}
                                    </p>
                                ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Création en cours...
                        </>
                    ) : (
                        'Réserver la salle'
                    )}
                </button>
            </form>
        </div>
    );
};