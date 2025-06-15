import {useEffect, useState, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Search, Calendar, Users, Clock, Map, CheckCircle, AlertTriangle,
    Loader, Building, Layers, Info, Home, Tag, X
} from 'lucide-react';
import {useStore} from '../store';
import {Room, Booking} from '../types';
import {roundUpToNextHalfHour} from '../composable/formatTimestamp';

export const RoomFinder = () => {
    const navigate = useNavigate();

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
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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

    // Nouveaux filtres
    const [buildingFilter, setBuildingFilter] = useState<string>('');
    const [floorFilter, setFloorFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Extraire les valeurs uniques des champs pour les filtres
    const availableBuildings = useMemo(() => {
        const buildings = new Set<string>();
        rooms.forEach(room => {
            if (room.building) buildings.add(room.building);
        });
        return Array.from(buildings).sort();
    }, [rooms]);

    const availableFloors = useMemo(() => {
        const floors = new Set<string>();
        rooms.forEach(room => {
            if (room.floor) floors.add(room.floor);
        });
        return Array.from(floors).sort();
    }, [rooms]);

    const availableTypes = useMemo(() => {
        const types = new Set<string>();
        rooms.forEach(room => {
            if (room.type) types.add(room.type);
        });
        return Array.from(types).sort();
    }, [rooms]);

    // Charger les données au montage du composant
    useEffect(() => {
        const fetchData = async () => {
            try {
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
        return !bookingsList.some(booking => {
            if (booking.room?.id !== roomId) return false;

            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);

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
        setSelectedRoom(null);

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

            // Nouveaux filtres
            if (buildingFilter && room.building !== buildingFilter) {
                return false;
            }

            if (floorFilter && room.floor !== floorFilter) {
                return false;
            }

            if (typeFilter && room.type !== typeFilter) {
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

        // Trier les résultats selon le critère choisi
        const sortedRooms = [...filtered].sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'capacity':
                    valueA = a.capacity || 0;
                    valueB = b.capacity || 0;
                    break;
                case 'building':
                    valueA = a.building || '';
                    valueB = b.building || '';
                    break;
                case 'floor':
                    valueA = a.floor || '';
                    valueB = b.floor || '';
                    break;
                case 'name':
                default:
                    valueA = a.name || '';
                    valueB = b.name || '';
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        setAvailabilityMap(newAvailabilityMap);
        setFilteredRooms(sortedRooms);
        setIsSearching(false);
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            // Inverser l'ordre si on clique sur la même colonne
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Nouvelle colonne de tri, toujours commencer par asc
            setSortBy(field);
            setSortOrder('asc');
        }
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

    const handleRoomSelect = (room: Room) => {
        setSelectedRoom(prev => prev?.id === room.id ? null : room);
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
                                min={now.toISOString().split('T')[0]}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacité minimale</label>
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

                    {/* Nouveaux filtres */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bâtiment</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                      size={16}/>
                            <select
                                value={buildingFilter}
                                onChange={(e) => setBuildingFilter(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tous les bâtiments</option>
                                {availableBuildings.map(building => (
                                    <option key={building} value={building}>
                                        Bâtiment {building}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={16}/>
                            <select
                                value={floorFilter}
                                onChange={(e) => setFloorFilter(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tous les étages</option>
                                {availableFloors.map(floor => (
                                    <option key={floor} value={floor}>
                                        {floor}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de salle</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                 size={16}/>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tous les types</option>
                                {availableTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type === 'STANDARD' ? 'Standard' :
                                            type === 'REUNION' ? 'Réunion' :
                                                type === 'MULTIMEDIA' ? 'Multimédia' :
                                                    type === 'LABORATOIRE' ? 'Laboratoire' :
                                                        type === 'AMPHI' ? 'Amphithéâtre' :
                                                            type === 'COWORKING' ? 'Coworking' :
                                                                type === 'INFORMATIQUE' ? 'Informatique' : type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recherche par nom</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={16}/>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Rechercher par nom de salle"
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

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
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

                    <div className="flex items-center">
                        <label htmlFor="sortBy" className="mr-2 text-sm text-gray-700">Trier par:</label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => toggleSort(e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="name">Nom</option>
                            <option value="capacity">Capacité</option>
                            <option value="building">Bâtiment</option>
                            <option value="floor">Étage</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="ml-2 p-1 rounded-md hover:bg-gray-100"
                            title={sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
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

            {/* Fiche détaillée de la salle sélectionnée */}
            {selectedRoom && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-semibold mb-4">Salle {selectedRoom.name}</h2>
                        <button
                            onClick={() => setSelectedRoom(null)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Image de la salle */}
                        <div className="col-span-1">
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                {selectedRoom.imageUrl ? (
                                    <img
                                        src={selectedRoom.imageUrl}
                                        alt={`Salle ${selectedRoom.name}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Home size={64}/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Informations sur la salle */}
                        <div className="col-span-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Localisation</h3>
                                    <p className="mt-1">
                                        <span
                                            className="font-medium">Bâtiment:</span> {selectedRoom.building || 'Non spécifié'}
                                    </p>
                                    <p className="mt-1">
                                        <span
                                            className="font-medium">Étage:</span> {selectedRoom.floor || 'Non spécifié'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Caractéristiques</h3>
                                    <p className="mt-1">
                                        <span className="font-medium">Type:</span> {
                                        selectedRoom.type === 'STANDARD' ? 'Standard' :
                                            selectedRoom.type === 'REUNION' ? 'Réunion' :
                                                selectedRoom.type === 'MULTIMEDIA' ? 'Multimédia' :
                                                    selectedRoom.type === 'LABORATOIRE' ? 'Laboratoire' :
                                                        selectedRoom.type === 'AMPHI' ? 'Amphithéâtre' :
                                                            selectedRoom.type === 'COWORKING' ? 'Coworking' :
                                                                selectedRoom.type === 'INFORMATIQUE' ? 'Informatique' :
                                                                    selectedRoom.type || 'Non spécifié'
                                    }
                                    </p>
                                    <p className="mt-1">
                                        <span className="font-medium">Capacité:</span> {selectedRoom.capacity} personnes
                                    </p>
                                </div>
                            </div>

                            {/* Équipements */}
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Équipements disponibles</h3>
                                {selectedRoom.roomEquipments && selectedRoom.roomEquipments.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRoom.roomEquipments.map((re, index) => {
                                            const equipmentItem = equipment.find(e => e.id === re.equipmentId);
                                            return equipmentItem ? (
                                                <div key={index}
                                                     className="bg-gray-100 rounded-md p-2 flex items-center">
                                                    <span className="text-sm font-medium">{equipmentItem.name}</span>
                                                    {re.quantity > 1 && (
                                                        <span
                                                            className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                                                            {re.quantity}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Aucun équipement spécifique</p>
                                )}
                            </div>

                            {/* Action bouton */}
                            <div className="mt-6">
                                {availabilityMap[selectedRoom.id] ? (
                                    <button
                                        onClick={() => handleBookRoom(selectedRoom.id)}
                                        className="w-full sm:w-auto py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Réserver cette salle
                                    </button>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <button
                                            disabled
                                            className="w-full sm:w-auto py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400"
                                        >
                                            Salle non disponible
                                        </button>
                                        <p className="mt-2 sm:mt-0 sm:ml-4 text-sm text-red-600">
                                            Cette salle est déjà réservée pendant la période sélectionnée.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            const isAvailable = availabilityMap[room.id];
                            const isSelected = selectedRoom?.id === room.id;

                            return (
                                <div
                                    key={room.id}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!isAvailable ? 'bg-red-50' : ''} ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                    onClick={() => handleRoomSelect(room)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex">
                                            {/* Image miniature (si disponible) */}
                                            {room.imageUrl && (
                                                <div
                                                    className="w-16 h-16 mr-4 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={room.imageUrl}
                                                        alt={`Salle ${room.name}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

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

                                                <div
                                                    className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-gray-600">
                                                    {room.building && (
                                                        <div className="flex items-center">
                                                            <Building size={14} className="mr-1"/>
                                                            <span>Bât. {room.building}{room.floor ? `, ${room.floor}` : ''}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center">
                                                        <Users size={14} className="mr-1"/>
                                                        <span>{room.capacity} personnes</span>
                                                    </div>

                                                    {room.type && (
                                                        <div className="flex items-center">
                                                            <Tag size={14} className="mr-1"/>
                                                            <span>{
                                                                room.type === 'STANDARD' ? 'Standard' :
                                                                    room.type === 'REUNION' ? 'Réunion' :
                                                                        room.type === 'MULTIMEDIA' ? 'Multimédia' :
                                                                            room.type === 'LABORATOIRE' ? 'Laboratoire' :
                                                                                room.type === 'AMPHI' ? 'Amphithéâtre' :
                                                                                    room.type === 'COWORKING' ? 'Coworking' :
                                                                                        room.type === 'INFORMATIQUE' ? 'Informatique' : room.type
                                                            }</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {room.roomEquipments && room.roomEquipments.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {room.roomEquipments.slice(0, 3).map((re, index) => {
                                                            const equipmentItem = equipment.find(e => e.id === re.equipmentId);
                                                            return equipmentItem ? (
                                                                <span key={index}
                                                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                    {equipmentItem.name}
                                                                    {re.quantity > 1 && ` (${re.quantity})`}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                        {room.roomEquipments.length > 3 && (
                                                            <span
                                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                +{room.roomEquipments.length - 3} autres
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {!isAvailable && (
                                                    <p className="mt-2 text-xs text-red-600">
                                                        Cette salle est déjà réservée pendant la période sélectionnée.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRoomSelect(room);
                                                }}
                                                className="mb-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                                <Info size={14} className="mr-1"/>
                                                Détails
                                            </button>

                                            {isAvailable && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBookRoom(room.id);
                                                    }}
                                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                                >
                                                    Réserver
                                                </button>
                                            )}
                                        </div>
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