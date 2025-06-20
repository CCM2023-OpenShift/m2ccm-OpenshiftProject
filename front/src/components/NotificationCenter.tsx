import {useState, useEffect, useRef} from 'react';
import {useKeycloak} from '@react-keycloak/web';
import {Link} from 'react-router-dom';
import {Bell, X, Calendar, Check, AlertCircle, RefreshCw} from 'lucide-react';
import {parseISO, formatDistanceToNow} from 'date-fns';
import {fr} from 'date-fns/locale';
import {useStore} from '../store';
import type { Notification } from '../types';

export const NotificationCenter = () => {
    const {keycloak} = useKeycloak();
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const {
        notifications,
        unreadNotificationsCount,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissNotification,
        fetchUnreadNotificationsCount,
    } = useStore(state => ({
        notifications: state.notifications,
        unreadNotificationsCount: state.unreadNotificationsCount,
        fetchNotifications: state.fetchNotifications,
        markNotificationAsRead: state.markNotificationAsRead,
        markAllNotificationsAsRead: state.markAllNotificationsAsRead,
        dismissNotification: state.dismissNotification,
        fetchUnreadNotificationsCount: state.fetchUnreadNotificationsCount,
    }));

    useEffect(() => {
        const loadUserData = async () => {
            if (keycloak.authenticated) {
                setLoading(true);
                setError(null);
                try {
                    await fetchUnreadNotificationsCount();
                    if (showNotifications) {
                        await fetchNotifications();
                    }
                } catch (err) {
                    console.error("Erreur lors du chargement des notifications:", err);
                    setError("Impossible de charger vos notifications");
                } finally {
                    setLoading(false);
                }
            }
        };

        void loadUserData();

        const intervalId = setInterval(() => {
            if (keycloak.authenticated) {
                fetchUnreadNotificationsCount().catch(err => {
                    console.error("Erreur lors de l'actualisation du compteur:", err);
                });
            }
        }, 2 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [keycloak.authenticated, keycloak.tokenParsed?.preferred_username, fetchUnreadNotificationsCount]);

    useEffect(() => {
        if (showNotifications && keycloak.authenticated) {
            void fetchNotifications();
        }
    }, [showNotifications, fetchNotifications, keycloak.authenticated]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                showNotifications) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    const handleNotificationClick = (notificationId: string) => {
        void markNotificationAsRead(notificationId);
    };

    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        void markAllNotificationsAsRead();
    };

    const handleDismissNotification = (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        void dismissNotification(notificationId);
    };

    const handleRefresh = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        fetchNotifications().finally(() => setLoading(false));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'BOOKING_REMINDER':
                return <Calendar size={16} className="text-blue-500"/>;
            case 'BOOKING_CONFLICT':
                return <AlertCircle size={16} className="text-red-500"/>;
            default:
                return <Bell size={16} className="text-gray-500"/>;
        }
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return "Date inconnue";

        try {
            let date;
            if (dateString.includes('T')) {
                date = new Date(dateString);
            } else if (dateString.includes(' ')) {
                const [datePart, timePart] = dateString.split(' ');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes, seconds] = timePart.split(':').map(Number);
                date = new Date(year, month - 1, day, hours, minutes, seconds || 0);
            } else {
                date = parseISO(dateString);
            }

            if (!isNaN(date.getTime())) {
                return formatDistanceToNow(date, {
                    addSuffix: true,
                    locale: fr
                });
            }
            return "Date non valide";
        } catch (error) {
            console.error(`Erreur formatage date "${dateString}":`, error);
            return "Date inconnue";
        }
    };

    const handleShowDetails = (notification: Notification) => {
        setSelectedNotification(notification);
    };
    const handleCloseDetails = () => setSelectedNotification(null);

    const currentUsername = keycloak.tokenParsed?.preferred_username;

    return (
        <div className="relative z-30" ref={dropdownRef}>
            <button
                ref={buttonRef}
                className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
            >
                <Bell size={20}/>
                {unreadNotificationsCount > 0 && (
                    <span
                        className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-white">
                        {unreadNotificationsCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div className="fixed inset-0 z-40 overflow-hidden" style={{pointerEvents: 'none'}}>
                    <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
                        <div className="relative w-screen max-w-md" style={{pointerEvents: 'auto'}}>
                            <div className="h-full flex flex-col bg-white shadow-xl">
                                <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                                    <h3 className="font-semibold text-blue-800">
                                        Mes Notifications
                                        {loading && (
                                            <RefreshCw size={14} className="inline ml-2 animate-spin text-blue-600"/>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {unreadNotificationsCount > 0 && (
                                            <button
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                                onClick={handleMarkAllAsRead}
                                            >
                                                <Check size={12} className="mr-1"/>
                                                Tout marquer comme lu
                                            </button>
                                        )}
                                        <button
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                            onClick={handleRefresh}
                                            disabled={loading}
                                        >
                                            <RefreshCw size={12} className={`mr-1 ${loading ? 'animate-spin' : ''}`}/>
                                            Actualiser
                                        </button>
                                        <button
                                            onClick={() => setShowNotifications(false)}
                                            className="ml-2 text-gray-500 hover:text-gray-700"
                                        >
                                            <X size={16}/>
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-2 bg-yellow-50 border-b border-yellow-100 text-xs text-yellow-800">
                                        {error}
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto">
                                    {(!notifications || notifications.length === 0) ? (
                                        <div className="p-4 text-center text-gray-500">
                                            <Bell size={40} className="mx-auto text-gray-300 mb-2"/>
                                            <p>Aucune notification</p>
                                            <p className="text-xs mt-2">Connecté en tant que {currentUsername}</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification.id)}
                                                className={`p-3 border-b last:border-0 relative cursor-pointer ${
                                                    notification.read ? 'bg-white' : 'bg-blue-50'
                                                }`}
                                            >
                                                <button
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                                    onClick={(e) => handleDismissNotification(e, notification.id)}
                                                    aria-label="Supprimer"
                                                >
                                                    <X size={16}/>
                                                </button>
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <p className="font-semibold text-sm">{notification.title}</p>
                                                        <p className="text-sm text-gray-600 break-words">{notification.message}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                                    <span>
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                    {notification.bookingId && (
                                                        <button
                                                            className="text-blue-600 hover:text-blue-800 flex items-center"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleShowDetails(notification);
                                                            }}
                                                        >
                                                            <Calendar size={12} className="mr-1"/>
                                                            Voir détails
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal de détails de notification --- */}
            {selectedNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            onClick={handleCloseDetails}
                            aria-label="Fermer"
                        >
                            <X size={20}/>
                        </button>
                        <h2 className="text-lg font-semibold mb-2">{selectedNotification.title}</h2>
                        <div className="mb-2 text-sm text-gray-700">
                            <div><span className="font-medium">Salle :</span> {selectedNotification.roomName}</div>
                            <div><span className="font-medium">Date/Heure :</span> {formatTime(selectedNotification.createdAt)}</div>
                            <div><span className="font-medium">Organisateur :</span> {selectedNotification.organizer}</div>
                            {selectedNotification.bookingTitle && (
                                <div><span className="font-medium">Titre réservation :</span> {selectedNotification.bookingTitle}</div>
                            )}
                            {selectedNotification.message && (
                                <div className="mt-2"><span className="font-medium">Message :</span> {selectedNotification.message}</div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-4">
                            {selectedNotification.bookingId && (
                                <Link
                                    to={`/calendar?select=${selectedNotification.bookingId}`}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                                    onClick={() => setSelectedNotification(null)}
                                >
                                    <Calendar size={16} className="mr-2"/>
                                    Aller à l’événement
                                </Link>
                            )}
                            {selectedNotification.bookingId && (
                                <Link
                                    to={`/history?select=${selectedNotification.bookingId}`}
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 flex items-center"
                                    onClick={() => setSelectedNotification(null)}
                                >
                                    <Bell size={16} className="mr-2"/>
                                    Voir dans l’historique
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;