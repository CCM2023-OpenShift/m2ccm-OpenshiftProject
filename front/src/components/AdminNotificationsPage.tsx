import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import {
    Bell, Check, AlertCircle, RefreshCw, Search, Calendar,
    X, Trash2, Eye, EyeOff, Plus, Filter, MessageCircle, Send
} from 'lucide-react';
import { useStore } from '../store';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminNotification, AdminNotificationCreateRequest } from '../types';

const AdminNotificationsPage: React.FC = () => {
    const { keycloak } = useKeycloak();
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [typeFilter, setTypeFilter] = useState('');
    const [organizerFilter, setOrganizerFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    const {
        adminNotifications,
        totalAdminNotifications,
        adminNotificationLoading,
        adminNotificationError,
        fetchAdminNotifications,
        createAdminNotification,
        markAdminNotificationAsRead,
        markAdminNotificationAsUnread,
        markAllAdminNotificationsAsRead,
        deleteAdminNotification
    } = useStore();

    // Formulaire de création
    const [createForm, setCreateForm] = useState<{
        title: string;
        message: string;
        notificationType: string;
        targetUsers: string;
        forAllUsers: boolean;
    }>({
        title: '',
        message: '',
        notificationType: 'manual',
        targetUsers: '',
        forAllUsers: false
    });

    // Chargement initial et lors des changements de filtres
    useEffect(() => {
        if (keycloak.authenticated) {
            try {
                setError(null);
                void fetchAdminNotifications(currentPage, limit, typeFilter, organizerFilter);
            } catch (err) {
                console.error('Error loading notifications:', err);
                setError('Impossible de charger les notifications. Veuillez réessayer plus tard.');
            }
        }
    }, [keycloak.authenticated, currentPage, limit, typeFilter, organizerFilter]);

    // Observer l'erreur dans le store
    useEffect(() => {
        if (adminNotificationError) {
            setError(adminNotificationError);
        }
    }, [adminNotificationError]);

    // Afficher un message de succès temporaire
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    // Handlers
    const handleToggleRead = async (notification: AdminNotification) => {
        try {
            if (notification.read) {
                await markAdminNotificationAsUnread(notification.id);
                showSuccess('Notification marquée comme non lue');
            } else {
                await markAdminNotificationAsRead(notification.id);
                showSuccess('Notification marquée comme lue');
            }
        } catch (err) {
            console.error('Error toggling read status:', err);
            setError('Impossible de modifier le statut de lecture');
        }
    };

    const handleViewNotification = (notification: AdminNotification) => {
        setSelectedNotification(notification);
        setShowViewModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
            try {
                await deleteAdminNotification(id);
                showSuccess('Notification supprimée avec succès');
            } catch (err) {
                console.error('Error deleting notification:', err);
                setError('Impossible de supprimer la notification');
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        if (confirm('Marquer toutes les notifications comme lues ?')) {
            try {
                await markAllAdminNotificationsAsRead();
                showSuccess('Toutes les notifications ont été marquées comme lues');
            } catch (err) {
                console.error('Error marking all as read:', err);
                setError('Impossible de marquer toutes les notifications comme lues');
            }
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const requestData: AdminNotificationCreateRequest = {
                title: createForm.title,
                message: createForm.message,
                notificationType: createForm.notificationType,
                forAllUsers: createForm.forAllUsers,
                targetUsers: createForm.forAllUsers ? undefined : createForm.targetUsers.split(/[\s,;]+/).filter(u => u.trim() !== '')
            };

            await createAdminNotification(requestData);
            showSuccess('Notification(s) créée(s) avec succès');
            setShowCreateModal(false);

            // Reset form
            setCreateForm({
                title: '',
                message: '',
                notificationType: 'manual',
                targetUsers: '',
                forAllUsers: false
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
            setError('Erreur lors de la création de la notification');
        }
    };

    const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setCreateForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRefresh = () => {
        try {
            setError(null);
            void fetchAdminNotifications(currentPage, limit, typeFilter, organizerFilter);
            showSuccess('Données actualisées');
        } catch (err) {
            console.error('Error refreshing data:', err);
            setError('Impossible d\'actualiser les données');
        }
    };

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page with new filters
        try {
            setError(null);
            void fetchAdminNotifications(1, limit, typeFilter, organizerFilter);
        } catch (err) {
            console.error('Error applying filters:', err);
            setError('Impossible d\'appliquer les filtres');
        }
    };

    const clearFilters = () => {
        setTypeFilter('');
        setOrganizerFilter('');
        setSearchQuery('');
        setCurrentPage(1);
        try {
            setError(null);
            void fetchAdminNotifications(1, limit, '', '');
        } catch (err) {
            console.error('Error clearing filters:', err);
            setError('Impossible de réinitialiser les filtres');
        }
    };

    // Pagination
    const totalPages = Math.ceil(totalAdminNotifications / limit);

    const paginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        // Previous button
        items.push(
            <button
                key="prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                &laquo;
            </button>
        );

        // Page numbers
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Always show first page
        if (startPage > 1) {
            items.push(
                <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className={`px-3 py-1 rounded ${
                        currentPage === 1 ? 'bg-blue-500 text-white' : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                items.push(<span key="ellipsis1">...</span>);
            }
        }

        // Pages
        for (let i = startPage; i <= endPage; i++) {
            if (i === 1) continue; // Skip duplicate first page
            items.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 rounded ${
                        currentPage === i ? 'bg-blue-500 text-white' : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {i}
                </button>
            );
        }

        // Always show last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<span key="ellipsis2">...</span>);
            }
            items.push(
                <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 rounded ${
                        currentPage === totalPages ? 'bg-blue-500 text-white' : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {totalPages}
                </button>
            );
        }

        // Next button
        items.push(
            <button
                key="next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                &raquo;
            </button>
        );

        return items;
    };

    const getNotificationTypeIcon = (type: string) => {
        switch (type) {
            case '24h':
                return <Calendar size={16} className="text-blue-500" />;
            case '1h':
                return <Calendar size={16} className="text-orange-500" />;
            case 'manual':
                return <MessageCircle size={16} className="text-green-500" />;
            case 'conflict':
                return <AlertCircle size={16} className="text-red-500" />;
            default:
                return <Bell size={16} className="text-gray-500" />;
        }
    };

    const formatNotificationType = (type: string) => {
        switch (type) {
            case '24h':
                return 'Rappel 24h';
            case '1h':
                return 'Rappel 1h';
            case 'manual':
                return 'Manuel';
            case 'conflict':
                return 'Conflit';
            default:
                return type;
        }
    };

    const formatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) {
            return 'Date non disponible';
        }

        try {
            const date = parseISO(dateStr);
            return formatDistanceToNow(date, { addSuffix: true, locale: fr });
        } catch (error) {
            console.error('Date parsing error:', error);
            return 'Date invalide';
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Bell className="mr-2" size={20} />
                        Administration des Notifications
                    </h1>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                        >
                            <Plus size={16} className="mr-1" />
                            Nouvelle notification
                        </button>
                        {adminNotifications?.some?.(n => !n.read) && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center"
                            >
                                <Check size={16} className="mr-1" />
                                Tout marquer comme lu
                            </button>
                        )}
                        <button
                            onClick={handleRefresh}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded"
                            disabled={adminNotificationLoading}
                        >
                            <RefreshCw size={16} className={adminNotificationLoading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Filtres et recherche */}
                <div className="p-4 border-b border-gray-200">
                    <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type de notification</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                            >
                                <option value="">Tous les types</option>
                                <option value="24h">Rappel 24h</option>
                                <option value="1h">Rappel 1h</option>
                                <option value="manual">Manuel</option>
                                <option value="conflict">Conflit</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organisateur</label>
                            <input
                                type="text"
                                value={organizerFilter}
                                onChange={(e) => setOrganizerFilter(e.target.value)}
                                placeholder="Nom d'utilisateur"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher..."
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 pl-10"
                                />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div className="flex items-end space-x-2">
                            <button
                                type="submit"
                                className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded"
                            >
                                <Filter size={16} className="mr-1" />
                                Filtrer
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
                            >
                                <X size={16} className="mr-1" />
                                Effacer
                            </button>
                        </div>
                    </form>
                </div>

                {/* Messages */}
                {successMessage && (
                    <div className="m-4 p-2 bg-green-50 border border-green-200 text-green-700 rounded flex justify-between items-center">
                        <span className="flex items-center">
                            <Check size={16} className="mr-2" /> {successMessage}
                        </span>
                        <button onClick={() => setSuccessMessage(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="m-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded flex justify-between items-center">
                        <span className="flex items-center">
                            <AlertCircle size={16} className="mr-2" /> {error}
                        </span>
                        <button onClick={() => setError(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Tableau des notifications */}
                <div className="overflow-x-auto">
                    {adminNotificationLoading && (
                        <div className="flex justify-center items-center py-8">
                            <RefreshCw size={24} className="animate-spin text-gray-500" />
                        </div>
                    )}

                    {/* Afficher un message d'erreur ou d'API non implémentée */}
                    {!adminNotificationLoading && error && (
                        <div className="text-center py-8 text-gray-500">
                            <AlertCircle size={40} className="mx-auto text-red-400 mb-2" />
                            <p className="text-red-500 font-medium">Erreur de chargement</p>
                            <p className="text-sm mt-2">Il semble que l'API d'administration des notifications n'est pas disponible actuellement.</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                <RefreshCw size={16} className="inline mr-2" /> Réessayer
                            </button>
                        </div>
                    )}

                    {!adminNotificationLoading && !error && (!adminNotifications || adminNotifications.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                            <Bell size={40} className="mx-auto text-gray-300 mb-2" />
                            <p>Aucune notification trouvée</p>
                            <p className="text-sm mt-2">Essayez de modifier vos filtres ou d'envoyer de nouvelles notifications</p>
                        </div>
                    )}

                    {!adminNotificationLoading && !error && adminNotifications && adminNotifications.length > 0 && (
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre/Message</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinataire</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réservation</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {adminNotifications.map((notification) => (
                                <tr
                                    key={notification.id}
                                    className={`${notification.read ? '' : 'bg-blue-50'} hover:bg-gray-50 cursor-pointer`}
                                    onClick={() => handleViewNotification(notification)}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{notification.id}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {getNotificationTypeIcon(notification.notificationType)}
                                            <span className="ml-1 text-sm text-gray-900">
                                                {formatNotificationType(notification.notificationType)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                            {notification.title}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">
                                            {notification.message}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{notification.organizer}</div>
                                        <div className="text-xs text-gray-500">{notification.organizerEmail}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{notification.roomName}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{notification.bookingTitle}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(notification.sentAt)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {notification.read ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Lu
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Non lu
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleToggleRead(notification);
                                                }}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                {notification.read ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDelete(notification.id);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination  */}
                {!adminNotificationLoading && !error && adminNotifications && adminNotifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>

                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Affichage de{' '}
                                    <span className="font-medium">{Math.min((currentPage - 1) * limit + 1, totalAdminNotifications)}</span>
                                    {' à '}
                                    <span className="font-medium">{Math.min(currentPage * limit, totalAdminNotifications)}</span>
                                    {' sur '}
                                    <span className="font-medium">{totalAdminNotifications}</span>
                                    {' résultats'}
                                </p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <span className="mr-2 text-sm text-gray-700">Afficher</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => {
                                            setLimit(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="rounded border-gray-300 text-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span className="ml-2 text-sm text-gray-700">par page</span>
                                </div>

                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {paginationItems()}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de visualisation des détails */}
            {showViewModal && selectedNotification && (
                <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                {getNotificationTypeIcon(selectedNotification.notificationType)}
                                <span className="ml-2">Détails de la notification</span>
                            </h3>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-xl font-semibold text-gray-900">{selectedNotification.title}</h2>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        selectedNotification.read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {selectedNotification.read ? 'Lu' : 'Non lu'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Envoyé {formatDate(selectedNotification.sentAt)}
                                </p>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Message :</h4>
                                <p className="text-gray-800 whitespace-pre-wrap text-sm">
                                    {selectedNotification.message}
                                </p>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Destinataire :</p>
                                    <p className="font-medium">{selectedNotification.organizer}</p>
                                    <p className="text-xs">{selectedNotification.organizerEmail}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Réservation :</p>
                                    <p className="font-medium">{selectedNotification.bookingTitle}</p>
                                    <p className="text-xs">Salle : {selectedNotification.roomName}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <p className="text-gray-500 text-sm">Informations complémentaires :</p>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                    <div>
                                        <p className="text-gray-500">ID de notification :</p>
                                        <p className="font-mono">{selectedNotification.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">ID de réservation :</p>
                                        <p className="font-mono">{selectedNotification.bookingId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                            <button
                                onClick={() => {
                                    void handleToggleRead(selectedNotification);
                                    setShowViewModal(false);
                                }}
                                className={`flex items-center px-4 py-2 rounded ${
                                    selectedNotification.read
                                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                                        : 'bg-green-100 hover:bg-green-200 text-green-800'
                                }`}
                            >
                                {selectedNotification.read ? (
                                    <>
                                        <EyeOff size={16} className="mr-2" /> Marquer comme non lu
                                    </>
                                ) : (
                                    <>
                                        <Eye size={16} className="mr-2" /> Marquer comme lu
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    void handleDelete(selectedNotification.id);
                                    setShowViewModal(false);
                                }}
                                className="flex items-center px-4 py-2 rounded bg-red-100 hover:bg-red-200 text-red-800"
                            >
                                <Trash2 size={16} className="mr-2" /> Supprimer
                            </button>

                            <button
                                onClick={() => setShowViewModal(false)}
                                className="flex items-center px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de création de notification */}
            {showCreateModal && (
                <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Send size={16} className="mr-2 text-blue-500" />
                                Créer une nouvelle notification
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notificationType">
                                        Type de notification
                                    </label>
                                    <select
                                        id="notificationType"
                                        name="notificationType"
                                        value={createForm.notificationType}
                                        onChange={handleCreateFormChange}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                                    >
                                        <option value="manual">Notification manuelle</option>
                                        <option value="conflict">Alerte de conflit</option>
                                        <option value="24h">Rappel 24h</option>
                                        <option value="1h">Rappel 1h</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                                        Titre
                                    </label>
                                    <input
                                        id="title"
                                        name="title"
                                        type="text"
                                        value={createForm.title}
                                        onChange={handleCreateFormChange}
                                        required
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                                        placeholder="Titre de la notification"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="message">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={3}
                                        value={createForm.message}
                                        onChange={handleCreateFormChange}
                                        required
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                                        placeholder="Contenu de la notification"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {createForm.message.length}/500 caractères
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-center mb-3">
                                        <input
                                            id="forAllUsers"
                                            name="forAllUsers"
                                            type="checkbox"
                                            checked={createForm.forAllUsers}
                                            onChange={handleCreateFormChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="forAllUsers" className="ml-2 block text-sm font-medium text-gray-700">
                                            Envoyer à tous les utilisateurs
                                        </label>
                                    </div>

                                    {!createForm.forAllUsers && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="targetUsers">
                                                Destinataires (séparés par virgule, espace ou point-virgule)
                                            </label>
                                            <textarea
                                                id="targetUsers"
                                                name="targetUsers"
                                                rows={2}
                                                value={createForm.targetUsers}
                                                onChange={handleCreateFormChange}
                                                required={!createForm.forAllUsers}
                                                disabled={createForm.forAllUsers}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                                                placeholder="utilisateur1, utilisateur2, utilisateur3"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Exemple: john.doe, marie.dupont, admin1
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={adminNotificationLoading}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {adminNotificationLoading ? (
                                        <div className="flex items-center">
                                            <RefreshCw size={16} className="animate-spin mr-2" />
                                            Envoi...
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <Send size={16} className="mr-2" />
                                            Envoyer
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationsPage;