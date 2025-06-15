import React, {useEffect, useState} from 'react';
import {useKeycloak} from '@react-keycloak/web';
import {useStore} from "../store.ts";
import {useLocation, useNavigate} from 'react-router-dom';
import {Room} from '../services/Room';
import {Booking} from '../services/Booking';
import {Equipment} from "../services/Equipment.ts";
import {RoomEquipment} from "../services/RoomEquipment.ts";
import {User} from '../services/User.ts';
import {formatDateTimeLocal, roundUpToNextHalfHour} from '../composable/formatTimestamp.ts';
import {
    AlertCircle,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    Info,
    Repeat,
    Shield,
    User as UserIcon,
    Users
} from 'lucide-react';
import {RecurringBookingForm} from './RecurringBookingForm';
import {RoomAvailabilityCalendar} from "./RoomAvailabilityCalendar.tsx";

export const BookingForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
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
    const [showRecurringForm, setShowRecurringForm] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [lastCreatedBooking, setLastCreatedBooking] = useState<Partial<Booking> | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    // Date actuelle pour l'affichage et la validation
    const currentDate = new Date("2025-06-15 13:50:00");

    const roles = keycloak.tokenParsed?.realm_access?.roles || [];
    const isAdmin = roles.includes('admin');

    // Récupérer le nom d'utilisateur de Keycloak avec fallback
    const currentUser = keycloak.tokenParsed?.preferred_username;

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
        attendees: 1,
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
            newFormData.attendees = Number(capacity) || 1;
        }

        setFormData(newFormData);
        setUrlParamsLoaded(true);
    }, [location.search, urlParamsLoaded]);

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
                const room = rooms.find(r => String(r.id) === String(roomId));
                if (room) {
                    setSelectedRoom(room);
                    setFormData(prev => ({
                        ...prev,
                        roomId,
                        title: prev.title || `Réservation de ${room.name}`
                    }));
                }
            }

            setUrlParamsLoaded(true);
        }
    }, [rooms, location.search, urlParamsLoaded]);

    // Effet pour mettre à jour selectedRoom quand roomId change
    useEffect(() => {
        if (formData.roomId && rooms.length > 0) {
            const room = rooms.find(r => String(r.id) === String(formData.roomId));

            if (room) {
                setSelectedRoom(room);

                // Si le titre est vide ou commence par "Réservation de", le mettre à jour
                if (!formData.title || formData.title.startsWith("Réservation de")) {
                    setFormData(prev => ({
                        ...prev,
                        title: `Réservation de ${room.name}`
                    }));
                }
            } else {
                setSelectedRoom(null);
            }
        } else {
            setSelectedRoom(null);
        }
    }, [formData.roomId, rooms]);

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
        setCustomOrganizerInput('');
    };

    useEffect(() => {
        if (!formData.roomId) {
            setAvailableEquipments([]);
            return;
        }

        const getEquipments = async () => {
            try {
                const equipments = await Equipment.getAll();
                const selectedRoom = rooms.find(room => String(room.id) === String(formData.roomId));
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
                    .filter((e) => e.available > 0);
                setAvailableEquipmentsMobile(filteredAndMapped);
            } catch (error) {
                console.error("Erreur lors du chargement des équipements disponibles :", error);
                setAvailableEquipmentsMobile([]);
            }
        };

        void fetchAvailableEquipments();
    }, [formData.startTime, formData.endTime]);

    // Validation de la réservation avant soumission
    const validateBooking = (): string | null => {
        if (!formData.title.trim()) {
            return "Le titre de la réservation est obligatoire.";
        }

        if (!formData.roomId) {
            return "Veuillez sélectionner une salle.";
        }

        if (!formData.startTime || !formData.endTime) {
            return "Les dates et heures de début et de fin sont obligatoires.";
        }

        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);

        if (startTime >= endTime) {
            return "L'heure de début doit être antérieure à l'heure de fin.";
        }

        if (startTime < currentDate) {
            return "Vous ne pouvez pas réserver une salle dans le passé.";
        }

        if (!formData.attendees || Number(formData.attendees) <= 0) {
            return "Le nombre de participants doit être supérieur à zéro.";
        }

        if (selectedRoom && Number(formData.attendees) > selectedRoom.capacity) {
            return `La salle peut accueillir au maximum ${selectedRoom.capacity} personnes.`;
        }

        if (!formData.organizer?.trim()) {
            return "L'organisateur est obligatoire.";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const validationError = validateBooking();
            if (validationError) {
                setErrorMessage(validationError);
                setLoading(false);
                return;
            }

            if (!selectedRoom) {
                setErrorMessage("La salle sélectionnée n'est pas valide.");
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

            // Créer d'abord l'objet booking sans les équipements
            const booking = new Booking();
            Object.assign(booking, {
                title: formData.title,
                startTime: formData.startTime,
                endTime: formData.endTime,
                attendees: Number(formData.attendees),
                organizer: formData.organizer,
                room: selectedRoom,
            });

            // Créer le booking
            await booking.create();

            // Ajouter les équipements après la création du booking
            if (formData.bookingEquipments.filter((be) => be.quantity > 0).length > 0) {
                // Mettre à jour l'objet booking avec les équipements
                booking.bookingEquipments = formData.bookingEquipments
                    .filter((be) => be.quantity > 0)
                    .map((be) => ({
                        id: "",
                        bookingId: booking.id,
                        equipmentId: String(be.equipmentId),
                        quantity: be.quantity,
                        startTime: formData.startTime,
                        endTime: formData.endTime,
                    }));
                await booking.update();
            }

            // Un seul appel à setLastCreatedBooking
            setLastCreatedBooking({
                ...booking,
                id: booking.id
            });

            setBookingSuccess(true);
            setErrorMessage('');

        } catch (error) {
            console.error("Error creating booking:", error);

            if (error instanceof Error) {
                if (error.message.includes("La salle est déjà réservée")) {
                    setErrorMessage(error.message);
                } else {
                    setErrorMessage(error.message);
                }
            } else {
                setErrorMessage('Une erreur inconnue est survenue.');
            }

            setBookingSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    // Gestionnaire pour les réservations récurrentes
    const handleRecurringSubmit = async (bookings: Partial<Booking>[]) => {
        setLoading(true);
        try {
            let createdCount = 0;

            for (const bookingData of bookings) {
                const booking = new Booking();
                Object.assign(booking, bookingData);
                await booking.create();
                createdCount++;
            }

            alert(`${createdCount} réservations récurrentes créées avec succès!`);
            setErrorMessage('');
            setFormData(initialBookingData);
            setCustomOrganizerInput('');
            setShowRecurringForm(false);
            navigate('/calendar');

        } catch (error) {
            console.error("Erreur lors de la création des réservations récurrentes:", error);
            if (error instanceof Error) {
                setErrorMessage(`Erreur lors de la création des réservations récurrentes: ${error.message}`);
            } else {
                setErrorMessage('Une erreur inconnue est survenue lors de la création des réservations récurrentes.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Réinitialiser le formulaire après une création réussie
    const handleNewReservation = () => {
        setBookingSuccess(false);
        setFormData(initialBookingData);
        setCustomOrganizerInput('');
        setSelectedRoom(null);
    };

    // Préparation de l'objet complet pour le RecurringBookingForm
    const getCompleteBookingData = (): Partial<Booking> => {
        if (!selectedRoom || !formData.roomId) {
            console.warn("Room data is missing when preparing recurring booking data");
            return {
                ...formData,
                attendees: Number(formData.attendees),
                bookingEquipments: formData.bookingEquipments.map(be => ({
                    ...be,
                    id: '',
                    bookingId: ''
                }))
            };
        }

        return {
            ...formData,
            room: selectedRoom,
            attendees: Number(formData.attendees),
            bookingEquipments: formData.bookingEquipments.map(be => ({
                ...be,
                id: '',
                bookingId: ''
            }))
        };
    };

    if (loading && rooms.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-4">Chargement...</span>
            </div>
        );
    }

    if (bookingSuccess && lastCreatedBooking) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                    <div className="mb-8 text-center">
                        <div
                            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600"/>
                        </div>
                        <h2 className="text-2xl font-bold text-green-700 mb-2">Réservation créée avec succès!</h2>
                        <p className="text-gray-600">Votre réservation a été enregistrée dans le système.</p>
                    </div>

                    <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-xl mb-4 text-blue-800">{lastCreatedBooking.title}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center mb-4">
                                    <Building className="mr-3 h-5 w-5 text-blue-600"/>
                                    <div>
                                        <p className="font-medium text-gray-700">Salle</p>
                                        <p className="text-gray-900 text-lg">{lastCreatedBooking.room?.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center mb-4">
                                    <Calendar className="mr-3 h-5 w-5 text-blue-600"/>
                                    <div>
                                        <p className="font-medium text-gray-700">Date</p>
                                        <p className="text-gray-900">
                                            {new Date(lastCreatedBooking.startTime!).toLocaleDateString('fr-FR', {
                                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center mb-4">
                                    <Clock className="mr-3 h-5 w-5 text-blue-600"/>
                                    <div>
                                        <p className="font-medium text-gray-700">Horaires</p>
                                        <p className="text-gray-900">
                                            {new Date(lastCreatedBooking.startTime!).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {' - '}
                                            {new Date(lastCreatedBooking.endTime!).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center mb-4">
                                    <Users className="mr-3 h-5 w-5 text-blue-600"/>
                                    <div>
                                        <p className="font-medium text-gray-700">Participants</p>
                                        <p className="text-gray-900">{lastCreatedBooking.attendees} personnes</p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <UserIcon className="mr-3 h-5 w-5 text-blue-600"/>
                                    <div>
                                        <p className="font-medium text-gray-700">Organisateur</p>
                                        <p className="text-gray-900">{lastCreatedBooking.organizer}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
                        <button
                            onClick={() => navigate('/calendar')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                            <Calendar size={18} className="inline-block mr-2"/>
                            Voir le calendrier
                        </button>
                        <button
                            onClick={handleNewReservation}
                            className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
                        >
                            Faire une nouvelle réservation
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showRecurringForm) {
        const completeBookingData = getCompleteBookingData();

        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <RecurringBookingForm
                    bookingData={completeBookingData}
                    onSubmit={handleRecurringSubmit}
                    onCancel={() => setShowRecurringForm(false)}
                />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Réserver une salle</h1>

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Colonne gauche Formulaire */}
                <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-lg shadow-md p-8">
                    {/* Section information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200 text-gray-700">
                            Informations de la réservation
                        </h2>

                        <div className="mb-5">
                            <label className="block text-gray-700 font-medium mb-2">
                                Titre de la réservation
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                placeholder="Ex: Réunion d'équipe, Présentation client..."
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="mb-5">
                            <label className="block text-gray-700 font-medium mb-2 items-center">
                                <Building size={18} className="inline-block mr-2 text-blue-500 align-text-bottom"/>
                                Salle
                            </label>
                            <select
                                value={formData.roomId}
                                onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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

                        {selectedRoom && (
                            <div className="mb-5 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                                    <Info size={16} className="mr-2"/>
                                    Informations sur la salle sélectionnée
                                </h3>
                                <p className="mb-2">
                                    <span
                                        className="font-medium text-gray-700">Capacité:</span> {selectedRoom.capacity} personnes
                                </p>

                                {availableEquipments.length > 0 && (
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Équipements disponibles:</p>
                                        <ul className="list-disc list-inside text-gray-800 ml-2">
                                            {availableEquipments.map((req) => {
                                                const equipment = req.equipment;
                                                return (
                                                    <li key={req.equipmentId}>
                                                        {equipment.name ?? 'Inconnu'} ({req.quantity})
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section Date et horaires */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200 text-gray-700 flex items-center">
                            <Calendar size={20} className="mr-2 text-blue-500"/>
                            Date et horaires
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Date et heure de début
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) =>
                                        setFormData({...formData, startTime: e.target.value})
                                    }
                                    min={formatDateTimeLocal(new Date())}
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Date et heure de fin
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.endTime}
                                    onChange={(e) =>
                                        setFormData({...formData, endTime: e.target.value})
                                    }
                                    min={formData.startTime}
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section participants */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200 text-gray-700 flex items-center">
                            <Users size={20} className="mr-2 text-blue-500"/>
                            Participants
                        </h2>

                        <div className="mb-5">
                            <label className="block text-gray-700 font-medium mb-2">
                                Nombre de participants
                            </label>
                            <input
                                type="number"
                                value={formData.attendees || ''}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 1;
                                    setFormData({...formData, attendees: value});
                                }}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                placeholder="Nombre de personnes attendues"
                                required
                                min="1"
                                disabled={loading}
                            />
                            {formData.roomId && rooms.length > 0 && formData.attendees && (
                                <div className="mt-2">
                                    {(() => {
                                        if (!selectedRoom) return null;
                                        const attendees = Number(formData.attendees);

                                        if (attendees > selectedRoom.capacity) {
                                            return (
                                                <p className="text-red-600 text-sm flex items-center">
                                                    <AlertCircle size={14} className="mr-1"/>
                                                    La capacité de cette salle est de {selectedRoom.capacity} personnes
                                                    maximum.
                                                </p>
                                            );
                                        } else if (attendees >= selectedRoom.capacity * 0.9) {
                                            return (
                                                <p className="text-orange-600 text-sm flex items-center">
                                                    <Info size={14} className="mr-1"/>
                                                    La salle sera presque à pleine capacité
                                                    ({attendees}/{selectedRoom.capacity}).
                                                </p>
                                            );
                                        } else if (attendees <= selectedRoom.capacity * 0.25 && attendees > 1) {
                                            return (
                                                <p className="text-blue-600 text-sm flex items-center">
                                                    <Info size={14} className="mr-1"/>
                                                    Cette salle est peut-être surdimensionnée
                                                    pour {attendees} personnes.
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* CHAMP ORGANISATEUR */}
                        <div className="mb-5">
                            <label className="block text-gray-700 font-medium mb-2 items-center">
                                Organisateur
                            </label>

                            {!isAdmin ? (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.organizer}
                                        readOnly
                                        className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                                        title="Seuls les administrateurs peuvent modifier l'organisateur"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <UserIcon className="w-5 h-5 text-gray-400"/>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Dropdown */}
                                    <select
                                        value={customOrganizerInput ? '' : formData.organizer}
                                        onChange={(e) => handleOrganizerSelect(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                                    <div className="flex items-center py-2">
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
                                            className="w-full px-4 py-3 border rounded-lg border-dashed border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                            disabled={loading}
                                        />
                                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                                            <Shield className="w-3 h-3 mr-1"/>
                                            En tant qu'admin, vous pouvez saisir n'importe quel nom d'utilisateur
                                        </p>
                                    </div>

                                    {/* Affichage de l'organisateur sélectionné */}
                                    {formData.organizer && (
                                        <div className="flex items-center text-sm bg-green-50 p-2 rounded-md">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2"/>
                                            <span className="text-green-700">
                                            Organisateur sélectionné: <strong>{formData.organizer}</strong>
                                        </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Option réservation récurrente */}
                    <div className="mb-8">
                        <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                            <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                                <Repeat size={20} className="mr-2"/>
                                Réservation récurrente
                            </h3>

                            <p className="mb-4 text-gray-700">
                                Vous pouvez créer plusieurs réservations pour cette salle avec un modèle récurrent
                                (quotidien, hebdomadaire, mensuel).
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    const validation = validateBooking();
                                    if (validation) {
                                        setErrorMessage(validation);
                                        return;
                                    }

                                    // Force une mise à jour de la salle sélectionnée
                                    const room = rooms.find(r => String(r.id) === String(formData.roomId));
                                    if (room) {
                                        setSelectedRoom(room);
                                        setTimeout(() => setShowRecurringForm(true), 0);
                                    } else {
                                        setErrorMessage("La salle sélectionnée est introuvable. Veuillez essayer de la sélectionner à nouveau.");
                                    }
                                }}
                                className="w-full sm:w-auto flex items-center justify-center bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                disabled={loading || !formData.roomId}
                            >
                                <Repeat size={18} className="mr-2"/>
                                Configurer une récurrence
                            </button>
                        </div>
                    </div>

                    {/* Équipements mobiles */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200 text-gray-700">
                            Équipements mobiles supplémentaires
                        </h2>

                        {formData.startTime && formData.endTime ? (
                            <div>
                                {availableEquipmentsMobile.length > 0 ? (
                                    <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                                        {availableEquipmentsMobile.map((req) => {
                                            const quantity = req.available || 0;
                                            const existing = formData.bookingEquipments.find(e => e.equipmentId === req.equipmentId) || {
                                                equipmentId: req.equipmentId,
                                                quantity: 0,
                                                startTime: formData.startTime,
                                                endTime: formData.endTime,
                                            };

                                            return (
                                                <div key={req.equipmentId}
                                                     className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 last:border-0">
                                                <span className="flex-1 font-medium">
                                                    {req.name}
                                                </span>
                                                    <div className="flex items-center">
                                                        <span className="mr-2 text-gray-600">Quantité:</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={quantity}
                                                            className="w-16 text-center border rounded-md py-1 px-2"
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
                                                        <span className="ml-2 text-gray-600">/ {quantity}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                                        <p className="text-gray-500">
                                            Aucun équipement mobile n'est disponible pour cette période.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"/>
                                <p>Veuillez sélectionner une date et des heures pour voir les équipements mobiles
                                    disponibles.</p>
                            </div>
                        )}
                    </div>

                    {errorMessage && (
                        <div
                            className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"/>
                            <div>
                                {errorMessage
                                    .split('\n')
                                    .filter(line => line.trim() !== '')
                                    .map((line, index) => (
                                        <p key={index} className={index > 0 ? 'mt-1 ml-4' : ''}>
                                            {index === 0 ? line : `- ${line}`}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Création en cours...
                            </span>
                            ) : (
                                'Réserver la salle'
                            )}
                        </button>
                    </div>
                </form>
                {selectedRoom && formData.roomId && (
                    <div className="xl:w-[450px]">
                        <div className="sticky top-6 bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="bg-blue-600 text-white p-4">
                                <h2 className="text-xl font-semibold flex items-center">
                                    <Calendar size={20} className="mr-2"/>
                                    Disponibilité de {selectedRoom.name}
                                </h2>
                                <p className="text-sm mt-1 text-blue-100">
                                    Cliquez sur un créneau disponible pour le sélectionner
                                </p>
                            </div>

                            <div className="calendar-container">
                                <RoomAvailabilityCalendar
                                    roomId={formData.roomId}
                                    selectedDate={formData.startTime ? new Date(formData.startTime) : new Date()}
                                    onSlotSelect={(start: string, end: string) => {
                                        setFormData({
                                            ...formData,
                                            startTime: start.substring(0, 16),
                                            endTime: end.substring(0, 16)
                                        });
                                    }}
                                    // Ajouter les données de la réservation en cours
                                    currentBooking={{
                                        startTime: formData.startTime,
                                        endTime: formData.endTime,
                                        title: formData.title || 'Nouvelle réservation'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
