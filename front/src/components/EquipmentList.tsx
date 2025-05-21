import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Monitor, Plus, Edit, Trash, X } from 'lucide-react';
import { Equipment } from '../types';

export const EquipmentList = () => {
    const { equipment, fetchEquipment, addEquipment, updateEquipment, deleteEquipment } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: 0,
        mobile: false,
    });

    useEffect(() => {
        void fetchEquipment();
    }, [fetchEquipment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingEquipment?.id) {
                await updateEquipment({ ...formData, id: editingEquipment.id } as Equipment);
            } else {
                await addEquipment(formData);
            }

            setIsModalOpen(false);
            setEditingEquipment(null);
            setFormData({ name: '', description: '', quantity: 0, mobile: false });
            setErrorMessage('');
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('Une erreur inconnue est survenue.');
            }
        }
    };


    const handleEdit = (equipment: Equipment) => {
        setEditingEquipment(equipment);
        setFormData({
            name: equipment.name,
            description: equipment.description,
            quantity: equipment.quantity,
            mobile: equipment.mobile,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (equipmentId: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
            await deleteEquipment(equipmentId);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestion des équipements</h1>
                <button
                    onClick={() => {
                        setEditingEquipment(null);
                        setFormData({ name: '', description: '', quantity: 0, mobile: false });
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter un équipement
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.map((equip) => (
                    <div key={equip.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <Monitor className="w-5 h-5 text-gray-500 mr-2"/>
                                <h2 className="text-xl font-semibold">{equip.name}</h2>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEdit(equip)}
                                    className="text-blue-500 hover:text-blue-600"
                                >
                                    <Edit className="w-5 h-5"/>
                                </button>
                                <button
                                    onClick={() => handleDelete(equip.id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash className="w-5 h-5"/>
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
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
