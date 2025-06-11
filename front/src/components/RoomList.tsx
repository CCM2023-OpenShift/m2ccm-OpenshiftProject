import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Monitor, Users, Plus, Edit, Trash, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Room } from '../types';

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
    const [formData, setFormData] = useState({
        name: '',
        capacity: '',
        roomEquipments: [] as { equipmentId: string; quantity: number }[],
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        void fetchRooms();
        void fetchEquipmentFixed();
    }, [fetchRooms, fetchEquipmentFixed]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner un fichier image valide');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert('La taille de l\'image ne doit pas dépasser 2MB');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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
                // Mode modification
                await updateRoom({ ...roomData, id: editingRoom.id } as Room);
                console.log('Room updated');

                // Upload de l'image si présente
                if (imageFile) {
                    console.log('Uploading image for updated room:', editingRoom.id);
                    await uploadRoomImage(editingRoom.id, imageFile);
                }
            } else {
                // Mode création - Get the actual room from the server after creation
                await addRoom(roomData);
                console.log('Room created');

                // Refresh rooms to get the newly created room with its ID
                await fetchRooms();

                // Find the newly created room by name (assuming name is unique)
                const createdRoom = rooms.find(r => r.name === formData.name);

                // Si on a une image à uploader et on a trouvé la salle créée
                if (imageFile && createdRoom) {
                    console.log('Uploading image for new room:', createdRoom.id);
                    await uploadRoomImage(createdRoom.id, imageFile);
                }
            }

            // Always refresh rooms list after operations
            await fetchRooms();

            setIsModalOpen(false);
            setEditingRoom(null);
            setFormData({ name: '', capacity: '', roomEquipments: [] });
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestion des salles</h1>
                <button
                    onClick={() => {
                        setEditingRoom(null);
                        setFormData({ name: '', capacity: '', roomEquipments: [] });
                        setImageFile(null);
                        setImagePreview(null);
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
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-48 bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-gray-400" />
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
                    </div>
                ))}
            </div>

            {/* Modal */}
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

                            {/* Section Image */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Image de la salle
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
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
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500">Cliquez pour sélectionner une image</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
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