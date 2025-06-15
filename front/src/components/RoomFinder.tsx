import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Search, Calendar, Users, Clock, Map, CheckCircle, AlertTriangle, Loader} from 'lucide-react';
import {useStore} from '../store';
import {Room, Booking} from '../types';
import {roundUpToNextHalfHour} from '../composable/formatTimestamp';

export const RoomFinder = () => {
    const navigate = useNavigate();

    // Utiliser le store pour accéder aux données et aux fonctions
    const {
        rooms,
        equipment,
        bookings,
        loading,
        fetchRooms,
        fetchEquipment,
        fetchBookings
    } = useStore(state => ({
        rooms: state.rooms,
        equipment: state.equipment,
        bookings: state.bookings,
        loading: {
            rooms: state.loading.rooms,
            equipment: state.loading.equipment,
            bookings: state.loading.bookings
        },
        fetchRooms: state.fetchRooms,
        fetchEquipment: state.fetchEquipment,
        fetchBookings: state.fetchBookings
    }));

    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});

    // Initialiser les dates/heures comme dans BookingForm
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const roundedNow = roundUpToNextHalfHour(now);
    const roundedOneHourLater = roundUpToNextHalfHour(oneHourLater);

    // Pour l'interface date et time séparés
    const todayDate = now.toISOString().split('T')[0];
    const formattedStartTime = roundedNow.toTimeString().substring(0, 5);
    const formattedEndTime = roundedOneHourLater.toTimeString().substring(0, 5);

    // Critères de recherche
    const [date, setDate] = useState<string>(todayDate);
    const [startTime, setStartTime] = useState<string>(formattedStartTime);
    const [endTime, setEndTime] = useState<string>(formattedEndTime);
    const [capacity, setCapacity] = useState<number>(0);
    const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showUnavailable, setShowUnavailable] = useState<boolean>(true);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // Charger les données au montage du composant
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Utiliser les méthodes du store pour charger les données
                await Promise.all([
                    fetchRooms(),
                    fetchEquipment(),
                    fetchBookings()
                ]);
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
            }
        };

        void fetchData();
    }, [fetchRooms, fetchEquipment, fetchBookings]);

    // Initialiser les salles filtrées quand les données sont chargées
    useEffect(() => {
        if (rooms.length > 0 && !isSearching) {
            setFilteredRooms(rooms);
            calculateAvailability(rooms, bookings);
        }
    }, [rooms, bookings, isSearching]);

    // Fonction pour vérifier la disponibilité des salles
    const isRoomAvailable = (roomId: string, start: Date, end: Date, bookingsList: Booking[]): boolean => {
        // Vérifier si la salle est déjà réservée à cette période
        return !bookingsList.some(booking => {
            // Ne vérifier que les réservations pour cette salle
            if (booking.room?.id !== roomId) return false;

            // Convertir les dates de la réservation
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);

            // Vérifier s'il y a chevauchement
            // (start1 < end2) && (end1 > start2)
            return (start < bookingEnd && end > bookingStart);
        });
    };

    // Fonction pour calculer la disponibilité initiale
    const calculateAvailability = (roomsList: Room[], bookingsList: Booking[]) => {
        const searchStart = new Date(`${date}T${startTime}:00`);
        const searchEnd = new Date(`${date}T${endTime}:00`);

        const newAvailabilityMap: Record<string, boolean> = {};

        roomsList.forEach(room => {
            newAvailabilityMap[room.id] = isRoomAvailable(room.id, searchStart, searchEnd, bookingsList);
        });

        setAvailabilityMap(newAvailabilityMap);
    };

    const searchRooms = () => {
        setIsSearching(true);

        // Convertir les entrées en dates pour la comparaison
        const searchStart = new Date(`${date}T${startTime}:00`);
        const searchEnd = new Date(`${date}T${endTime}:00`);

        // Vérifier que l'heure de début est avant l'heure de fin
        if (searchStart >= searchEnd) {
            alert("L'heure de début doit être antérieure à l'heure de fin");
            setIsSearching(false);
            return;
        }

        // Vérifier que la date n'est pas dans le passé
        if (searchStart < now && date === now.toISOString().split('T')[0]) {
            alert("Vous ne pouvez pas rechercher de salles pour une heure déjà passée");
            setIsSearching(false);
            return;
        }

        const newAvailabilityMap: Record<string, boolean> = {};

        // Filtrer les salles selon les critères
        const filtered = rooms.filter(room => {
            // Recherche textuelle
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!room.name.toLowerCase().includes(query)) {
                    return false;
                }
            }

            // Vérifier la capacité
            if (capacity > 0 && room.capacity < capacity) {
                return false;
            }

            // Vérifier les équipements
            if (selectedEquipments.length > 0) {
                const roomEquipments = room.roomEquipments?.map(re => re.equipmentId) || [];
                if (!selectedEquipments.every(eqId => roomEquipments.includes(eqId))) {
                    return false;
                }
            }

            // Vérifier la disponibilité
            const available = isRoomAvailable(room.id, searchStart, searchEnd, bookings);
            newAvailabilityMap[room.id] = available;

            // Filtrer les salles indisponibles sauf si l'option est activée
            return available || showUnavailable;
        });

        setAvailabilityMap(newAvailabilityMap);
        setFilteredRooms(filtered);
        setIsSearching(false);
    };

    const handleEquipmentToggle = (equipmentId: string) => {
        setSelectedEquipments(prev =>
            prev.includes(equipmentId)
                ? prev.filter(id => id !== equipmentId)
                : [...prev, equipmentId]
        );
    };

    const handleBookRoom = (roomId: string) => {
        // Vérifier une dernière fois la disponibilité
        const searchStart = new Date(`${date}T${startTime}:00`);
        const searchEnd = new Date(`${date}T${endTime}:00`);

        if (!isRoomAvailable(roomId, searchStart, searchEnd, bookings)) {
            alert("Cette salle vient d'être réservée par quelqu'un d'autre. Veuillez choisir une autre salle ou horaire.");
            searchRooms(); // Rafraîchir les résultats
            return;
        }

        // Rediriger vers le formulaire de réservation avec paramètres pré-remplis
        navigate(`/booking?roomId=${roomId}&date=${date}&start=${startTime}&end=${endTime}&capacity=${capacity}`);
    };

    // Affichage du chargement global
    const isLoading = loading.rooms || loading.equipment || loading.bookings;
    if (isLoading && (rooms.length === 0 || equipment.length === 0)) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Chargement des données...</span>
            </div>
        );
    }

    // Compter les salles réellement disponibles
    const availableRoomsCount = Object.values(availabilityMap).filter(Boolean).length;

    // Nombre total de salles affichées
    const totalShownRooms = filteredRooms.length;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Rechercher une salle</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                      size={16}/>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                min={now.toISOString().split('T')[0]} // Date minimum = aujourd'hui
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                   size={16}/>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                   size={16}/>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacité minimale
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                   size={16}/>
                            <input
                                type="number"
                                min="0"
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nombre de participants"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recherche par nom
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={16}/>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Rechercher par nom ou description"
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Équipements nécessaires</label>
                    <div className="flex flex-wrap gap-2">
                        {equipment.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleEquipmentToggle(item.id)}
                                className={`px-3 py-1 text-sm rounded-full ${
                                    selectedEquipments.includes(item.id)
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="showUnavailable"
                        checked={showUnavailable}
                        onChange={() => setShowUnavailable(!showUnavailable)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="showUnavailable" className="ml-2 text-sm text-gray-700">
                        Afficher également les salles indisponibles
                    </label>
                </div>

                <button
                    onClick={searchRooms}
                    disabled={isSearching}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                >
                    {isSearching ? (
                        <>
                            <Loader size={16} className="inline mr-2 animate-spin"/>
                            Recherche en cours...
                        </>
                    ) : (
                        <>
                            <Search size={16} className="inline mr-2"/>
                            Rechercher des salles disponibles
                        </>
                    )}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-lg">
                        {totalShownRooms} salle{totalShownRooms !== 1 ? 's' : ''} trouvée{totalShownRooms !== 1 ? 's' : ''}
                    </h2>
                    <div className="text-sm text-gray-600">
                        <span
                            className="text-green-500 font-semibold">{availableRoomsCount}</span> disponible{availableRoomsCount !== 1 ? 's' : ''}
                        {showUnavailable && filteredRooms.length > availableRoomsCount && (
                            <span> • <span
                                className="text-red-500 font-semibold">{filteredRooms.length - availableRoomsCount}</span> indisponible{(filteredRooms.length - availableRoomsCount) !== 1 ? 's' : ''}</span>
                        )}
                    </div>
                </div>

                {filteredRooms.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {filteredRooms.map(room => {
                            // Utiliser explicitement le booléen de la carte de disponibilité
                            const isAvailable = availabilityMap[room.id];

                            return (
                                <div
                                    key={room.id}
                                    className={`p-4 hover:bg-gray-50 ${!isAvailable ? 'bg-red-50' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center">
                                                <h3 className="font-semibold text-lg">{room.name}</h3>
                                                {isAvailable ? (
                                                    <span
                                                        className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle size={12} className="mr-1"/>
                                                        Disponible
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <AlertTriangle size={12} className="mr-1"/>
                                                        Indisponible
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-600">
                                                <Users size={16} className="mr-1"/>
                                                <span>Capacité: {room.capacity} personnes</span>
                                            </div>
                                            {room.roomEquipments && room.roomEquipments.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {room.roomEquipments.map((re, index) => {
                                                        const equipmentItem = equipment.find(e => e.id === re.equipmentId);
                                                        return equipmentItem ? (
                                                            <span key={index}
                                                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                {equipmentItem.name}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}

                                            {!isAvailable && (
                                                <p className="mt-2 text-sm text-red-600">
                                                    Cette salle est déjà réservée pendant la période sélectionnée.
                                                </p>
                                            )}
                                        </div>
                                        {isAvailable ? (
                                            <button
                                                onClick={() => handleBookRoom(room.id)}
                                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                            >
                                                Réserver
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
                                            >
                                                Non disponible
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <Map size={64} className="mx-auto text-gray-300 mb-4"/>
                        <p className="text-gray-500 text-lg">Aucune salle ne correspond à vos critères</p>
                        <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomFinder;