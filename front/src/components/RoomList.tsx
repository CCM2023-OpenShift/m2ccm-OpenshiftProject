import React, {useState, useEffect, useMemo} from 'react';
import {useStore} from '../store';
import {
    Monitor,
    Users,
    Plus,
    Edit,
    Trash,
    X,
    Upload,
    Image as ImageIcon,
    Search,
    Filter,
    SlidersHorizontal
} from 'lucide-react';
import {Room} from '../types';
import {useImageValidation} from '../hooks/useImageValidation';

interface RoomFilters {
    search: string;
    minCapacity: number;
    maxCapacity: number;
    hasImage: 'all' | 'with' | 'without';
    hasEquipment: 'all' | 'with' | 'without';
    equipmentName: string;
    sortBy: 'name' | 'capacity' | 'equipment-count';
    sortOrder: 'asc' | 'desc';
}

export const RoomList = () => {
    const {
        rooms,
        equipment,
        fetchRooms,
        fetchEquipmentFixed,
        addRoom,
        updateRoom,
        deleteRoom,
        uploadRoomImage,
        deleteRoomImage
    } = useStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // État des filtres
    const [filters, setFilters] = useState<RoomFilters>({
        search: '',
        minCapacity: 0,
        maxCapacity: 1000,
        hasImage: 'all',
        hasEquipment: 'all',
        equipmentName: '',
        sortBy: 'name',
        sortOrder: 'asc'
    });

    const [formData, setFormData] = useState({
        name: '',
        capacity: '',
        roomEquipments: [] as { equipmentId: string; quantity: number }[],
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const {
        loading,
        validateFile,
        getMaxSizeMB,
        getAcceptedTypes,
        getAcceptedExtensions,
        isConfigReady
    } = useImageValidation('room');

    useEffect(() => {
        void fetchRooms();
        void fetchEquipmentFixed();
    }, [fetchRooms, fetchEquipmentFixed]);

    // Logique de filtrage et tri
    const filteredAndSortedRooms = useMemo(() => {
        let filtered = rooms.filter((room: Room) => {
            // Recherche textuelle
            const searchMatch = room.name.toLowerCase().includes(filters.search.toLowerCase());

            // Filtre par capacité
            const capacityMatch = room.capacity >= filters.minCapacity &&
                room.capacity <= filters.maxCapacity;

            // Filtre par image
            const imageMatch = filters.hasImage === 'all' ||
                (filters.hasImage === 'with' && room.imageUrl && room.imageUrl.trim() !== '') ||
                (filters.hasImage === 'without' && (!room.imageUrl || room.imageUrl.trim() === ''));

            // Filtre par équipement
            const hasAnyEquipment = Array.isArray(room.roomEquipments) && room.roomEquipments.length > 0;
            const equipmentMatch = filters.hasEquipment === 'all' ||
                (filters.hasEquipment === 'with' && hasAnyEquipment) ||
                (filters.hasEquipment === 'without' && !hasAnyEquipment);

            // Filtre par nom d'équipement spécifique
            let equipmentNameMatch = true;
            if (filters.equipmentName.trim() !== '') {
                equipmentNameMatch = room.roomEquipments?.some(re => {
                    const matchedEquipment = equipment.find(eq => eq.id === re.equipmentId);
                    return matchedEquipment?.name.toLowerCase().includes(filters.equipmentName.toLowerCase());
                }) ?? false;
            }

            return searchMatch && capacityMatch && imageMatch && equipmentMatch && equipmentNameMatch;
        });

        // Tri
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (filters.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'capacity':
                    aValue = a.capacity;
                    bValue = b.capacity;
                    break;
                case 'equipment-count':
                    aValue = Array.isArray(a.roomEquipments) ? a.roomEquipments.length : 0;
                    bValue = Array.isArray(b.roomEquipments) ? b.roomEquipments.length : 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [rooms, equipment, filters]);

    // Réinitialiser les filtres
    const resetFilters = () => {
        setFilters({
            search: '',
            minCapacity: 0,
            maxCapacity: 1000,
            hasImage: 'all',
            hasEquipment: 'all',
            equipmentName: '',
            sortBy: 'name',
            sortOrder: 'asc'
        });
    };

    // Statistiques rapides
    const stats = useMemo(() => {
        const total = rooms.length;
        const withImages = rooms.filter((r: Room) => r.imageUrl && r.imageUrl.trim() !== '').length;
        const withEquipment = rooms.filter((r: Room) => Array.isArray(r.roomEquipments) && r.roomEquipments.length > 0).length;
        const totalCapacity = rooms.reduce((sum: number, r: Room) => sum + r.capacity, 0);
        const avgCapacity = total > 0 ? Math.round(totalCapacity / total) : 0;
        const maxCapacity = total > 0 ? Math.max(...rooms.map((r: Room) => r.capacity)) : 0;

        return {
            total,
            withImages,
            withEquipment,
            totalCapacity,
            avgCapacity,
            maxCapacity
        };
    }, [rooms]);

    // Liste des équipements uniques dans les salles
    const equipmentInRooms = useMemo(() => {
        const equipmentIds = new Set<string>();
        rooms.forEach(room => {
            room.roomEquipments?.forEach(re => {
                equipmentIds.add(re.equipmentId);
            });
        });

        return Array.from(equipmentIds)
            .map(id => equipment.find(eq => eq.id === id))
            .filter(Boolean)
            .sort((a, b) => a!.name.localeCompare(b!.name));
    }, [rooms, equipment]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isConfigReady()) {
            alert('Configuration en cours de chargement, veuillez patienter...');
            e.target.value = '';
            return;
        }

        const error = validateFile(file);
        if (error) {
            alert(error);
            e.target.value = '';
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

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

        try {
            if (editingRoom?.id) {
                await updateRoom({...roomData, id: editingRoom.id} as Room);

                // Upload de l'image si présente
                if (imageFile) {
                    await uploadRoomImage(editingRoom.id, imageFile);
                }
            } else {
                // Mode création - Get the actual room from the server after creation
                await addRoom(roomData);

                // Refresh rooms to get the newly created room with its ID
                await fetchRooms();

                // Find the newly created room by name (assuming name is unique)
                const createdRoom = rooms.find(r => r.name === formData.name);

                // Si on a une image à uploader et on a trouvé la salle créée
                if (imageFile && createdRoom) {
                    await uploadRoomImage(createdRoom.id, imageFile);
                }
            }

            // Always refresh rooms list after operations
            await fetchRooms();

            setIsModalOpen(false);
            setEditingRoom(null);
            setFormData({name: '', capacity: '', roomEquipments: []});
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error saving room:', error);
            alert('Une erreur est survenue lors de l\'enregistrement de la salle.');
        }
    };

    const handleEdit = (room: Room) => {
        setEditingRoom(room);
        setFormData({
            name: room.name,
            capacity: room.capacity.toString(),
            roomEquipments: room.roomEquipments.map((re) => ({
                equipmentId: re.equipmentId,
                quantity: re.quantity,
            })),
        });

        // Afficher l'image actuelle s'il y en a une
        if (room.imageUrl) {
            setImagePreview(room.imageUrl);
        } else {
            setImagePreview(null);
        }

        setImageFile(null); // Reset du fichier sélectionné
        setIsModalOpen(true);
    };

    const handleDelete = async (roomId: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
            await deleteRoom(roomId);
        }
    };

    const handleDeleteImage = async (roomId: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer l\'image de cette salle ?')) {
            await deleteRoomImage(roomId);
        }
    };

    return (
        <div className="p-6">
            {/* Header avec statistiques */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gestion des salles</h1>
                    <div className="flex space-x-6 mt-2 text-sm text-gray-600">
                        <span>Total: <strong>{stats.total}</strong></span>
                        <span>Avec images: <strong>{stats.withImages}</strong></span>
                        <span>Avec équipements: <strong>{stats.withEquipment}</strong></span>
                        <span>Capacité totale: <strong>{stats.totalCapacity}</strong></span>
                        <span>Capacité max: <strong>{stats.maxCapacity}</strong></span>
                        <span>Capacité moy: <strong>{stats.avgCapacity}</strong></span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingRoom(null);
                        setFormData({name: '', capacity: '', roomEquipments: []});
                        setImageFile(null);
                        setImagePreview(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2"/>
                    Ajouter une salle
                </button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex items-center space-x-4 mb-4">
                    {/* Recherche */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                        <input
                            type="text"
                            placeholder="Rechercher par nom de salle..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Bouton filtres */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                            showFilters ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'
                        }`}
                    >
                        <SlidersHorizontal className="w-5 h-5"/>
                        <span>Filtres</span>
                    </button>

                    {/* Bouton reset */}
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
                    >
                        Tout effacer
                    </button>
                </div>

                {/* Panneau de filtres */}
                {showFilters && (
                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Capacité min */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacité min</label>
                            <input
                                type="number"
                                min="0"
                                value={filters.minCapacity}
                                onChange={(e) => setFilters({...filters, minCapacity: Number(e.target.value)})}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Capacité max */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacité max</label>
                            <input
                                type="number"
                                min="0"
                                value={filters.maxCapacity}
                                onChange={(e) => setFilters({...filters, maxCapacity: Number(e.target.value)})}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Images */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                            <select
                                value={filters.hasImage}
                                onChange={(e) => setFilters({...filters, hasImage: e.target.value as any})}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Toutes</option>
                                <option value="with">Avec image</option>
                                <option value="without">Sans image</option>
                            </select>
                        </div>

                        {/* Équipements */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Équipements</label>
                            <select
                                value={filters.hasEquipment}
                                onChange={(e) => setFilters({...filters, hasEquipment: e.target.value as any})}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Toutes</option>
                                <option value="with">Avec équipements</option>
                                <option value="without">Sans équipements</option>
                            </select>
                        </div>

                        {/* Recherche par équipement spécifique */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Équipement
                                spécifique</label>
                            <input
                                type="text"
                                placeholder="Nom d'équipement..."
                                value={filters.equipmentName}
                                onChange={(e) => setFilters({...filters, equipmentName: e.target.value})}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Tri */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="name">Nom</option>
                                <option value="capacity">Capacité</option>
                                <option value="equipment-count">Nb équipements</option>
                            </select>
                        </div>

                        {/* Ordre de tri */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => setFilters({...filters, sortOrder: e.target.value as any})}
                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="asc">Croissant</option>
                                <option value="desc">Décroissant</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Résultats */}
                <div className="mt-4 text-sm text-gray-600">
                    {filteredAndSortedRooms.length} salle(s) trouvée(s) sur {rooms.length}
                </div>

                {/* Équipements populaires */}
                {equipmentInRooms.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">Équipements dans les salles :</p>
                        <div className="flex flex-wrap gap-2">
                            {equipmentInRooms.slice(0, 8).map(eq => (
                                <button
                                    key={eq!.id}
                                    onClick={() => setFilters({...filters, equipmentName: eq!.name})}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                                >
                                    {eq!.name}
                                </button>
                            ))}
                            {equipmentInRooms.length > 8 && (
                                <span className="px-3 py-1 text-gray-500 text-xs">
                                    +{equipmentInRooms.length - 8} autres...
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Grille des salles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedRooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Image de la salle */}
                        {room.imageUrl ? (
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={room.imageUrl}
                                    alt={room.name}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => handleDeleteImage(room.id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                    title="Supprimer l'image"
                                >
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                        ) : (
                            <div className="h-48 bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-gray-400"/>
                            </div>
                        )}

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">{room.name}</h2>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(room)}
                                        className="text-blue-500 hover:text-blue-600"
                                    >
                                        <Edit className="w-5 h-5"/>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(room.id)}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center mb-4">
                                <Users className="w-5 h-5 text-gray-500 mr-2"/>
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
                                                    <Monitor className="w-4 h-4 text-gray-500 mr-2"/>
                                                    <span>{matchedEquipment.name} – {re.quantity}x</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">Aucun équipement</p>
                                )}
                            </div>

                            {/* Badges informatifs */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {room.imageUrl && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                        📷 Image
                                    </span>
                                )}
                                {Array.isArray(room.roomEquipments) && room.roomEquipments.length > 0 && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        🔧 {room.roomEquipments.length} équipement(s)
                                    </span>
                                )}
                                {room.capacity >= 50 && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                        👥 Grande salle
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Affichage si aucun résultat */}
            {filteredAndSortedRooms.length === 0 && rooms.length > 0 && (
                <div className="text-center py-12">
                    <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune salle trouvée</h3>
                    <p className="text-gray-500 mb-4">Essayez de modifier vos critères de recherche</p>
                    <button
                        onClick={resetFilters}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            )}

            {/* Modal (reste identique à ton code original) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {editingRoom ? 'Modifier la salle' : 'Ajouter une salle'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5"/>
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
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    min="0"
                                />
                            </div>

                            {/* Section Image */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Image de la salle
                                </label>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Aperçu"
                                                className="max-w-full h-32 object-cover mx-auto rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-2 -translate-y-2"
                                            >
                                                <X className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                                            <p className="text-gray-500">Cliquez pour sélectionner une image</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept={getAcceptedTypes()}
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {loading ? 'Chargement configuration...' :
                                        `Max: ${getMaxSizeMB()}MB, formats: ${getAcceptedExtensions()}`}
                                </p>
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
                                                                                {equipmentId: re.id, quantity: 1},
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
                                                                            eq.equipmentId === re.id ? {
                                                                                ...eq,
                                                                                quantity: qty
                                                                            } : eq
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