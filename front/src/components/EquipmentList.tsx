import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Monitor, Plus, Edit, Trash, X, Camera, Upload } from 'lucide-react';
import { Equipment } from '../types';

export const EquipmentList = () => {
    const { equipment, fetchEquipment, addEquipment, updateEquipment, deleteEquipment, uploadEquipmentImage, deleteEquipmentImage } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: 0,
        mobile: false,
    });

    useEffect(() => {
        void fetchEquipment();
    }, [fetchEquipment]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrorMessage('Veuillez sélectionner un fichier image valide');
                return;
            }

            setSelectedFile(file);

            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setErrorMessage('');
        }
    };

    const handleDirectImageUpload = async (equipmentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image valide');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('La taille de l\'image ne doit pas dépasser 2MB');
            return;
        }

        try {
            await uploadEquipmentImage(equipmentId, file);
            event.target.value = '';
        } catch (error) {
            alert('Erreur lors de l\'upload de l\'image');
        }
    };

    const handleImageUpload = async (equipmentId: string) => {
        if (!selectedFile) return;

        try {
            await uploadEquipmentImage(equipmentId, selectedFile);
            setSelectedFile(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            setErrorMessage('Erreur lors de l\'upload de l\'image');
        }
    };

    const handleImageDelete = async (equipmentId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

        setIsDeleting(equipmentId);
        try {
            await deleteEquipmentImage(equipmentId);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image:', error);
            setErrorMessage('Erreur lors de la suppression de l\'image');
        } finally {
            setIsDeleting(null);
        }
    };

    // Renommer la variable locale pour éviter le conflit
    const handleDelete = async (equipmentId: string) => {
        const targetEquipment = equipment.find((e: Equipment) => e.id === equipmentId);
        const hasImage = targetEquipment?.imageUrl && targetEquipment.imageUrl.trim() !== '';

        const confirmMessage = hasImage
            ? 'Êtes-vous sûr de vouloir supprimer cet équipement ?\n Son image sera également supprimée définitivement.'
            : 'Êtes-vous sûr de vouloir supprimer cet équipement ?';

        if (!confirm(confirmMessage)) return;

        setIsDeleting(equipmentId);
        try {
            await deleteEquipment(equipmentId);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'équipement:', error);
            alert('Erreur lors de la suppression de l\'équipement');
        } finally {
            setIsDeleting(null);
        }
    };

    const resetModal = () => {
        setEditingEquipment(null);
        setFormData({ name: '', description: '', quantity: 0, mobile: false });
        setSelectedFile(null);
        setImagePreview(null);
        setErrorMessage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            // Renommer la variable locale pour éviter le conflit
            let savedEquipment: Equipment;

            if (editingEquipment?.id) {
                savedEquipment = await updateEquipment({ ...formData, id: editingEquipment.id } as Equipment);
            } else {
                savedEquipment = await addEquipment(formData);
            }

            if (selectedFile && savedEquipment.id) {
                await handleImageUpload(savedEquipment.id);
            }

            setIsModalOpen(false);
            resetModal();
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('Une erreur inconnue est survenue.');
            }
        }
    };

    // Renommer le paramètre pour éviter le conflit
    const handleEdit = (equipmentToEdit: Equipment) => {
        setEditingEquipment(equipmentToEdit);
        setFormData({
            name: equipmentToEdit.name,
            description: equipmentToEdit.description,
            quantity: equipmentToEdit.quantity,
            mobile: equipmentToEdit.mobile,
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestion des équipements</h1>
                <button
                    onClick={() => {
                        resetModal();
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter un équipement
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.map((equip: Equipment) => (
                    <div key={equip.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
                        {/* Overlay de chargement lors de la suppression */}
                        {isDeleting === equip.id && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                                <div className="bg-white p-4 rounded-lg">
                                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-600">Suppression en cours...</p>
                                </div>
                            </div>
                        )}

                        {/* Image de l'équipement */}
                        <div className="h-48 bg-gray-200 relative">
                            {equip.imageUrl ? (
                                <img
                                    src={equip.imageUrl}
                                    alt={equip.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Monitor className="w-16 h-16 text-gray-400" />
                                </div>
                            )}

                            {/* Boutons d'action pour l'image */}
                            <div className="absolute top-2 right-2 flex space-x-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleDirectImageUpload(equip.id, e)}
                                    className="hidden"
                                    id={`file-input-${equip.id}`}
                                    disabled={isDeleting === equip.id}
                                />
                                <label
                                    htmlFor={`file-input-${equip.id}`}
                                    className={`bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 ${
                                        isDeleting === equip.id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Changer l'image"
                                >
                                    <Camera className="w-4 h-4" />
                                </label>

                                {equip.imageUrl && (
                                    <button
                                        onClick={() => handleImageDelete(equip.id)}
                                        disabled={isDeleting === equip.id}
                                        className={`bg-red-500 text-white p-2 rounded-full hover:bg-red-600 ${
                                            isDeleting === equip.id ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        title="Supprimer l'image"
                                    >
                                        {isDeleting === equip.id ? (
                                            <div className="w-4 h-4 animate-spin border border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <X className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Contenu de la carte */}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <h2 className="text-xl font-semibold">{equip.name}</h2>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(equip)}
                                        disabled={isDeleting === equip.id}
                                        className={`text-blue-500 hover:text-blue-600 ${
                                            isDeleting === equip.id ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <Edit className="w-5 h-5"/>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(equip.id)}
                                        disabled={isDeleting === equip.id}
                                        className={`text-red-500 hover:text-red-600 ${
                                            isDeleting === equip.id ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        title={equip.imageUrl ? 'Supprimer l\'équipement et son image' : 'Supprimer l\'équipement'}
                                    >
                                        {isDeleting === equip.id ? (
                                            <div className="w-5 h-5 animate-spin border border-red-500 border-t-transparent rounded-full"></div>
                                        ) : (
                                            <Trash className="w-5 h-5"/>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-2">{equip.description}</p>
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Quantité :</span> {equip.quantity}
                            </p>
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Type :</span> {equip.mobile ? 'Mobile' : 'Statique'}
                            </p>
                            {equip.imageUrl && (
                                <p className="text-xs text-blue-600 mt-2">
                                    📷 Image stockée
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {editingEquipment ? 'Modifier l\'équipement' : 'Ajouter un équipement'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Section Image */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Image de l'équipement
                                </label>

                                <div className="mb-3 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Aperçu"
                                            className="h-full max-w-full object-contain rounded-lg"
                                        />
                                    ) : editingEquipment?.imageUrl ? (
                                        <img
                                            src={editingEquipment.imageUrl}
                                            alt="Image actuelle"
                                            className="h-full max-w-full object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-gray-400 text-center">
                                            <Upload className="w-8 h-8 mx-auto mb-2" />
                                            <p>Aucune image</p>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Formats acceptés: JPG, PNG. Taille max: 2MB
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Nom de l'équipement
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
                                    Quantité
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    rows={3}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center space-x-2">
                                    <span className="text-gray-700 font-semibold">Mobile</span>
                                    <input
                                        type="checkbox"
                                        checked={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.checked })}
                                        className="h-5 w-5"
                                    />
                                </label>
                            </div>

                            {errorMessage && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                {editingEquipment ? 'Modifier' : 'Ajouter'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};