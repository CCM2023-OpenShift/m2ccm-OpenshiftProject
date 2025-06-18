import {create} from 'zustand';
import {
    AppState,
    Equipment,
    Notification,
    NotificationParams,
    Room,
    AdminNotification
} from './types';
import {Room as RoomService} from './services/Room';
import {Equipment as EquipmentService} from './services/Equipment';
import User from "./services/User.ts";
import {Booking} from "./services/Booking.ts";
import {Notification as NotificationService} from "./services/Notification.ts";

export const useStore = create<AppState>((set, get) => ({
    rooms: [],
    equipment: [],
    bookings: [],
    currentUser: null,
    availableOrganizers: [],
    loading: {
        rooms: false,
        equipment: false,
        bookings: false,
        currentUser: false,
        organizers: false,
        notifications: false
    },
    notifications: [],
    unreadNotificationsCount: 0,
    adminNotifications: [],
    totalAdminNotifications: 0,
    adminNotificationLoading: false,
    adminNotificationError: null,

    fetchAllData: async () => {
        const tasks = [
            get().fetchRooms().catch(error => {
                console.error('Error in fetchRooms during fetchAllData:', error);
            }),
            get().fetchBookings().catch(error => {
                console.error('Error in fetchBookings during fetchAllData:', error);
            }),
            get().fetchCurrentUser().catch(error => {
                console.error('Error in fetchCurrentUser during fetchAllData:', error);
            }),
            get().fetchEquipment().catch(error => {
                console.error('Error in fetchEquipment during fetchAllData:', error);
            })
        ];

        await Promise.all(tasks);
    },

    fetchRooms: async () => {
        try {
            set(() => ({loading: {...get().loading, rooms: true}}));
            const data = await RoomService.getAll();
            set(() => ({
                rooms: data,
                loading: {...get().loading, rooms: false}
            }));
        } catch (error) {
            console.error('Error fetching rooms:', error);
            set(() => ({loading: {...get().loading, rooms: false}}));
        }
    },

    fetchEquipment: async () => {
        try {
            set(() => ({loading: {...get().loading, equipment: true}}));
            const data = await EquipmentService.getAll();
            set(() => ({
                equipment: data,
                loading: {...get().loading, equipment: false}
            }));
        } catch (error) {
            console.error('Error fetching equipment:', error);
            set(() => ({loading: {...get().loading, equipment: false}}));
        }
    },

    fetchEquipmentFixed: async () => {
        try {
            set(() => ({loading: {...get().loading, equipment: true}}));
            const allEquipment = await EquipmentService.getAll();
            const fixedEquipment = allEquipment.filter((equip: EquipmentService) => !equip.getMobile());
            set(() => ({
                equipment: fixedEquipment,
                loading: {...get().loading, equipment: false}
            }));
        } catch (error) {
            console.error('Error fetching fixed equipment:', error);
            set(() => ({loading: {...get().loading, equipment: false}}));
        }
    },

    fetchBookings: async () => {
        try {
            set(() => ({loading: {...get().loading, bookings: true}}));

            const data = await Booking.getAll();

            set(() => ({
                bookings: data || [],
                loading: {...get().loading, bookings: false}
            }));
        } catch (error) {
            console.error('Error fetching bookings:', error);
            set(() => ({
                bookings: [],
                loading: {...get().loading, bookings: false}
            }));
        }
    },

    fetchCurrentUser: async () => {
        try {
            set(() => ({loading: {...get().loading, currentUser: true}}));
            const currentUser = await User.getCurrent();
            set(() => ({
                currentUser,
                loading: {...get().loading, currentUser: false}
            }));
        } catch (error) {
            console.error('Store: Error fetching current user:', error);
            set(() => ({
                currentUser: null,
                loading: {...get().loading, currentUser: false}
            }));
        }
    },

    fetchBookingOrganizers: async () => {
        try {
            set(() => ({loading: {...get().loading, organizers: true}}));
            const organizers = await User.getBookingOrganizers();
            set(() => ({
                availableOrganizers: organizers,
                loading: {...get().loading, organizers: false}
            }));
        } catch (error) {
            console.error('Store: Error fetching booking organizers:', error);
            set(() => ({
                availableOrganizers: [],
                loading: {...get().loading, organizers: false}
            }));
        }
    },

    addRoom: async (room: Partial<Room>) => {
        try {
            const newRoom = new RoomService();
            Object.assign(newRoom, room);
            const createdRoom = await newRoom.create();
            set((state) => ({rooms: [...state.rooms, createdRoom]}));
            return createdRoom;
        } catch (error) {
            console.error('Error adding room:', error);
            throw error;
        }
    },

    updateRoom: async (room: Room) => {
        try {
            const roomInstance = new RoomService();
            Object.assign(roomInstance, room);
            const updatedRoom = await roomInstance.update();
            set((state) => ({
                rooms: state.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)),
            }));
            return updatedRoom;
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    },

    deleteRoom: async (roomId: string) => {
        try {
            const roomService = new RoomService();
            roomService.id = roomId;
            await roomService.delete();
            set((state) => ({
                rooms: state.rooms.filter((r) => r.id !== roomId),
            }));
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    },

    addEquipment: async (equipment: Partial<Equipment>): Promise<Equipment> => {
        try {
            const newEquipment = new EquipmentService();
            Object.assign(newEquipment, equipment);
            const createdEquipment = await newEquipment.create();

            const equipmentData: Equipment = {
                id: createdEquipment.getId(),
                name: createdEquipment.getName(),
                description: createdEquipment.getDescription(),
                quantity: createdEquipment.getQuantity(),
                mobile: createdEquipment.getMobile(),
                imageUrl: createdEquipment.getImageUrl()
            };

            set((state) => ({equipment: [...state.equipment, equipmentData]}));
            return equipmentData;
        } catch (error) {
            console.error('Error adding equipment:', error);
            throw error;
        }
    },

    updateEquipment: async (equipment: Equipment): Promise<Equipment> => {
        try {
            const equipmentInstance = new EquipmentService();
            Object.assign(equipmentInstance, equipment);
            const updatedEquipment = await equipmentInstance.update();

            const equipmentData: Equipment = {
                id: updatedEquipment.getId(),
                name: updatedEquipment.getName(),
                description: updatedEquipment.getDescription(),
                quantity: updatedEquipment.getQuantity(),
                mobile: updatedEquipment.getMobile(),
                imageUrl: updatedEquipment.getImageUrl()
            };

            set((state) => ({
                equipment: state.equipment.map((e) =>
                    e.id === equipmentData.id ? equipmentData : e
                ),
            }));

            return equipmentData;
        } catch (error) {
            console.error('Error updating equipment:', error);
            throw error;
        }
    },

    deleteEquipment: async (equipmentId: string) => {
        try {
            const equipmentInstance = new EquipmentService();
            equipmentInstance.id = equipmentId;
            await equipmentInstance.delete();
            set((state) => ({
                equipment: state.equipment.filter((e) => e.id !== equipmentId),
            }));
        } catch (error) {
            console.error('Error deleting equipment:', error);
            throw error;
        }
    },

    // ========== MÉTHODES POUR LES IMAGES D'ÉQUIPEMENTS ==========
    uploadEquipmentImage: async (equipmentId: string, file: File) => {
        try {
            const equipmentInstance = new EquipmentService();
            equipmentInstance.id = equipmentId;

            const result = await equipmentInstance.uploadImage(file);

            set((state) => ({
                equipment: state.equipment.map((e) =>
                    e.id === equipmentId ? {...e, imageUrl: result.imageUrl} : e
                ),
            }));

            return result;
        } catch (error) {
            console.error('Error uploading equipment image:', error);
            throw error;
        }
    },

    deleteEquipmentImage: async (equipmentId: string) => {
        try {
            // Utiliser get() pour accéder à l'état actuel
            const currentEquipment = get().equipment.find(e => e.id === equipmentId);

            if (!currentEquipment || !currentEquipment.imageUrl) {
                return;
            }

            const equipmentInstance = new EquipmentService();
            equipmentInstance.id = equipmentId;
            equipmentInstance.imageUrl = currentEquipment.imageUrl;

            await equipmentInstance.deleteImage();

            set((state) => ({
                equipment: state.equipment.map((e) =>
                    e.id === equipmentId ? {...e, imageUrl: ''} : e
                ),
            }));

            const refreshedData = await EquipmentService.getAll();
            set({equipment: refreshedData});

        } catch (error) {
            console.error('Error deleting equipment image:', error);
            throw error;
        }
    },

    // ========== MÉTHODES POUR LES IMAGES DES SALLES ==========
    uploadRoomImage: async (roomId: string, file: File) => {
        try {
            const roomInstance = new RoomService();
            roomInstance.id = roomId;

            const result = await roomInstance.uploadImage(file);

            set((state) => ({
                rooms: state.rooms.map((r) =>
                    r.id === roomId ? {...r, imageUrl: result.imageUrl} : r
                ),
            }));

            return result;
        } catch (error) {
            console.error('Error uploading room image:', error);
            throw error;
        }
    },

    deleteRoomImage: async (roomId: string) => {
        try {
            const roomInstance = new RoomService();
            roomInstance.id = roomId;

            await roomInstance.deleteImage();

            set((state) => ({
                rooms: state.rooms.map((r) =>
                    r.id === roomId ? {...r, imageUrl: undefined} : r
                ),
            }));

            const refreshedData = await RoomService.getAll();
            set({rooms: refreshedData});
        } catch (error) {
            console.error('Error deleting room image:', error);
            throw error;
        }
    },

    // Validation d'un nom d'utilisateur
    validateUsername: async (username: string): Promise<{ valid: boolean, message: string }> => {
        try {
            return await User.validateUsername(username);
        } catch (error) {
            console.error('Error validating username:', error);
            return {valid: false, message: 'Erreur de validation'};
        }
    },

    // Récupération des équipements disponibles pour une période
    getAvailableEquipments: async (startTime: string, endTime: string) => {
        try {
            set(() => ({loading: {...get().loading, equipment: true}}));
            const data = await Booking.getAvailableEquipments(startTime, endTime);
            set(() => ({loading: {...get().loading, equipment: false}}));
            return data;
        } catch (error) {
            console.error('Error fetching available equipment:', error);
            set(() => ({loading: {...get().loading, equipment: false}}));
            throw error;
        }
    },

    // Création d'une réservation
    createBooking: async (bookingData: any) => {
        try {
            const booking = new Booking();
            Object.assign(booking, bookingData);
            const createdBooking = await booking.create();

            // Mettre à jour la liste des réservations dans le store
            set((state) => ({
                bookings: [...state.bookings, createdBooking]
            }));

            return createdBooking;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    },

    // Mise à jour d'une réservation
    updateBooking: async (booking: any) => {
        try {
            const updatedBooking = await booking.update();

            // Mettre à jour la liste des réservations dans le store
            set((state) => ({
                bookings: state.bookings.map(b =>
                    b.id === updatedBooking.id ? updatedBooking : b
                )
            }));

            return updatedBooking;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },

    fetchAllUsers: async () => {
        try {
            set(() => ({loading: {...get().loading, organizers: true}}));
            const users = await User.getAllUsers();
            set(() => ({
                availableOrganizers: users, // Réutilisation du même champ pour stocker tous les utilisateurs
                loading: {...get().loading, organizers: false}
            }));
            return users;
        } catch (error) {
            console.error('Error fetching all users:', error);
            set(() => ({loading: {...get().loading, organizers: false}}));
            throw error;
        }
    },

    updateUserStatus: async (userId: string, status: boolean) => {
        try {
            const updatedUser = await User.updateUserStatus(userId, status);

            // Mettre à jour la liste des organisateurs si l'utilisateur existe dans la liste
            set((state) => ({
                availableOrganizers: state.availableOrganizers.map(user =>
                    user.getId() === userId ? updatedUser : user
                )
            }));

            return updatedUser;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    },

    sendPasswordResetEmail: async (userId: string) => {
        try {
            await User.sendPasswordResetEmail(userId);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    },

    fetchNotifications: async () => {
        try {
            set({loading: {...get().loading, notifications: true}});
            const serviceNotifications = await NotificationService.getAll();

            // Mapping explicite pour le type Notification du store
            const notifications: Notification[] = serviceNotifications.map((n: any) => ({
                id: n.id,
                userId: n.userId,
                type: n.type,
                title: n.title,
                message: n.message,
                bookingId: n.bookingId,
                read: !!n.read,
                createdAt: n.createdAt || n.sentAt || '',
                bookingTitle: n.bookingTitle || '',
                roomName: n.roomName || '',
                organizer: n.organizer || n.userId || '',
                organizerEmail: n.organizerEmail || ''
            }));

            const unreadCount = notifications.filter(n => !n.read).length;

            set({
                notifications,
                unreadNotificationsCount: unreadCount,
                loading: {...get().loading, notifications: false}
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            set({loading: {...get().loading, notifications: false}});
        }
    },

    markNotificationAsRead: async (notificationId: string) => {
        try {
            await NotificationService.markAsRead(notificationId);
            set((state) => ({
                notifications: state.notifications.map(notification =>
                    notification.id === notificationId
                        ? {...notification, read: true}
                        : notification
                ),
                unreadNotificationsCount: Math.max(state.unreadNotificationsCount - 1, 0)
            }));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    markAllNotificationsAsRead: async () => {
        try {
            await NotificationService.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map(notification => ({...notification, read: true})),
                unreadNotificationsCount: 0
            }));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    },

    dismissNotification: async (notificationId: string) => {
        try {
            await NotificationService.delete(notificationId);
            set((state) => {
                const notification = state.notifications.find(n => n.id === notificationId);
                const wasUnread = notification && !notification.read;

                return {
                    notifications: state.notifications.filter(n => n.id !== notificationId),
                    unreadNotificationsCount: wasUnread
                        ? Math.max(state.unreadNotificationsCount - 1, 0)
                        : state.unreadNotificationsCount
                };
            });
        } catch (error) {
            console.error('Error dismissing notification:', error);
        }
    },

    // Nouvelles méthodes de notifications
    fetchUnreadNotificationsCount: async () => {
        try {
            const count = await NotificationService.getUnreadCount();
            set(() => ({unreadNotificationsCount: count}));
            return count;
        } catch (error) {
            console.error('Error fetching unread notifications count:', error);
            // Si erreur, on retourne le compteur actuel
            return get().unreadNotificationsCount;
        }
    },

    fetchNotificationsWithParams: async (params: NotificationParams) => {
        try {
            set({loading: {...get().loading, notifications: true}});
            const result = await NotificationService.getAllWithParams(params);

            // Mapping explicite vers le type Notification
            const notifications: Notification[] = (result.notifications || []).map((n: any) => ({
                id: n.id,
                userId: n.userId,
                type: n.type,
                title: n.title,
                message: n.message,
                bookingId: n.bookingId,
                read: !!n.read,
                createdAt: n.createdAt || n.sentAt || '',
                bookingTitle: n.bookingTitle || '',
                roomName: n.roomName || '',
                organizer: n.organizer || n.userId || '',
                organizerEmail: n.organizerEmail || ''
            }));

            // Mets à jour le store si première page
            if (params.offset === 0 || params.offset === undefined) {
                set({
                    notifications,
                    unreadNotificationsCount: notifications.filter(n => !n.read).length,
                });
            }
            set({loading: {...get().loading, notifications: false}});
            // Toujours retourner le bon type, pas la structure brute du backend
            return {
                notifications,
                total: result.total || notifications.length,
                limit: result.limit || params.limit || 50,
                offset: result.offset || params.offset || 0
            };
        } catch (error) {
            console.error('Error fetching notifications with params:', error);
            set({loading: {...get().loading, notifications: false}});
            // Toujours retourner la structure typée attendue, même en cas d'erreur
            return {
                notifications: get().notifications,
                total: get().notifications.length,
                limit: params.limit || 50,
                offset: params.offset || 0
            };
        }
    },

    markNotificationAsUnread: async (notificationId: string) => {
        try {
            await NotificationService.markAsUnread(notificationId);
            set((state) => ({
                notifications: state.notifications.map(notification =>
                    notification.id === notificationId
                        ? {...notification, read: false}
                        : notification
                ),
                unreadNotificationsCount: state.unreadNotificationsCount + 1
            }));
        } catch (error) {
            console.error('Error marking notification as unread:', error);
        }
    },

    fetchNotificationTypes: async () => {
        try {
            return await NotificationService.getNotificationTypes();
        } catch (error) {
            console.error('Error fetching notification types:', error);
            return [];
        }
    },

    fetchAdminNotifications: async (page = 1, limit = 10, type = '', organizer = '') => {
        set({adminNotificationLoading: true, adminNotificationError: null});
        try {
            const offset = (page - 1) * limit;

            const result = await NotificationService.getAllForAdmin({
                offset,
                limit,
                type: type || undefined,
                organizer: organizer || undefined
            });

            const adminNotifications: AdminNotification[] = result.notifications.map(notification => {
                // Utilise tous les champs possibles du backend
                const adminNotif: AdminNotification = {
                    id: parseInt(notification.id),
                    title: notification.title,
                    message: notification.message,
                    read: Boolean(notification.read),
                    deleted: false,
                    notificationType: notification.type,
                    bookingId: notification.bookingId ? parseInt(notification.bookingId) : 0,
                    bookingTitle: notification.bookingTitle || '',
                    roomName: notification.roomName || '',
                    organizer: notification.organizer || notification.userId || '',
                    organizerEmail: notification.organizerEmail || '',
                    sentAt: notification.createdAt
                };

                // Extraction fallback si nécessaire depuis le message
                if ((!adminNotif.roomName || !adminNotif.bookingTitle) && notification.message) {
                    const roomMatch = notification.message.match(/salle\s+([A-Z][0-9]{1,3})/i);
                    if (!adminNotif.roomName && roomMatch && roomMatch[1]) {
                        adminNotif.roomName = roomMatch[1];
                    }
                    const titleMatch = notification.message.match(/"([^"]+)"/);
                    if (!adminNotif.bookingTitle && titleMatch && titleMatch[1]) {
                        adminNotif.bookingTitle = titleMatch[1];
                    } else if (!adminNotif.bookingTitle && notification.bookingId) {
                        adminNotif.bookingTitle = `Réservation #${notification.bookingId}`;
                    }
                }

                return adminNotif;
            });

            set({
                adminNotifications,
                totalAdminNotifications: result.total,
                adminNotificationLoading: false
            });
        } catch (error) {
            console.error('Error fetching admin notifications:', error);
            set({
                adminNotificationError: 'Échec du chargement des notifications',
                adminNotificationLoading: false,
                adminNotifications: []
            });
        }
    },

    createAdminNotification: async (data) => {
        set({adminNotificationLoading: true, adminNotificationError: null});
        try {
            const result = await NotificationService.createManualNotification(data);
            await get().fetchAdminNotifications();
            set({adminNotificationLoading: false});
            return result;
        } catch (error) {
            console.error('Error creating notification:', error);
            set({
                adminNotificationError: 'Échec de la création de la notification',
                adminNotificationLoading: false
            });
            throw error;
        }
    },

    updateAdminNotification: async (id, data) => {
        set({adminNotificationLoading: true, adminNotificationError: null});
        try {
            const result = await NotificationService.updateNotification(id.toString(), data);
            await get().fetchAdminNotifications();
            set({adminNotificationLoading: false});
            return result;
        } catch (error) {
            console.error('Error updating notification:', error);
            set({
                adminNotificationError: 'Échec de la mise à jour de la notification',
                adminNotificationLoading: false
            });
        }
    },

    markAdminNotificationAsRead: async (id) => {
        try {
            await NotificationService.markAsRead(id.toString());
            set(state => ({
                adminNotifications: state.adminNotifications.map(n =>
                    n.id === id ? {...n, read: true} : n
                )
            }));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            set({adminNotificationError: 'Échec de la mise à jour du statut de la notification'});
        }
    },

    markAdminNotificationAsUnread: async (id) => {
        try {
            await NotificationService.markAsUnread(id.toString());
            set(state => ({
                adminNotifications: state.adminNotifications.map(n =>
                    n.id === id ? {...n, read: false} : n
                )
            }));
        } catch (error) {
            console.error('Error marking notification as unread:', error);
            set({adminNotificationError: 'Échec de la mise à jour du statut de la notification'});
        }
    },

    markAllAdminNotificationsAsRead: async () => {
        set({adminNotificationLoading: true, adminNotificationError: null});
        try {
            await NotificationService.markAllAsReadAdmin();
            set(state => ({
                adminNotifications: state.adminNotifications.map(n => ({...n, read: true})),
                adminNotificationLoading: false
            }));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            set({
                adminNotificationError: 'Échec de la mise à jour des statuts de notification',
                adminNotificationLoading: false
            });
        }
    },

    deleteAdminNotification: async (id) => {
        set({adminNotificationLoading: true, adminNotificationError: null});
        try {
            await NotificationService.deleteAdmin(id.toString());
            set(state => ({
                adminNotifications: state.adminNotifications.filter(n => n.id !== id),
                totalAdminNotifications: state.totalAdminNotifications - 1,
                adminNotificationLoading: false
            }));
        } catch (error) {
            console.error('Error deleting notification:', error);
            set({
                adminNotificationError: 'Échec de la suppression de la notification',
                adminNotificationLoading: false
            });
        }
    }
}));