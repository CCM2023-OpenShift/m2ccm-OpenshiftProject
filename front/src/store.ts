import {create} from 'zustand';
import {AppState, Room, Equipment} from './types';
import {Room as RoomService} from './services/Room';
import {Equipment as EquipmentService} from './services/Equipment';
import User from "./services/User.ts";
import {Booking} from "./services/Booking.ts";

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
        organizers: false
    },

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
            set(state => ({loading: {...state.loading, rooms: true}}));
            const data = await RoomService.getAll();
            set(state => ({
                rooms: data,
                loading: {...state.loading, rooms: false}
            }));
        } catch (error) {
            console.error('Error fetching rooms:', error);
            set(state => ({loading: {...state.loading, rooms: false}}));
        }
    },

    fetchEquipment: async () => {
        try {
            set(state => ({loading: {...state.loading, equipment: true}}));
            const data = await EquipmentService.getAll();
            set(state => ({
                equipment: data,
                loading: {...state.loading, equipment: false}
            }));
        } catch (error) {
            console.error('Error fetching equipment:', error);
            set(state => ({loading: {...state.loading, equipment: false}}));
        }
    },

    fetchEquipmentFixed: async () => {
        try {
            set(state => ({loading: {...state.loading, equipment: true}}));
            const allEquipment = await EquipmentService.getAll();
            const fixedEquipment = allEquipment.filter((equip: EquipmentService) => !equip.getMobile());
            set(state => ({
                equipment: fixedEquipment,
                loading: {...state.loading, equipment: false}
            }));
        } catch (error) {
            console.error('Error fetching fixed equipment:', error);
            set(state => ({loading: {...state.loading, equipment: false}}));
        }
    },

    fetchBookings: async () => {
        try {
            set(state => ({loading: {...state.loading, bookings: true}}));

            const data = await Booking.getAll();

            set(state => ({
                bookings: data || [],
                loading: {...state.loading, bookings: false}
            }));
        } catch (error) {
            console.error('Error fetching bookings:', error);
            set(state => ({
                bookings: [],
                loading: {...state.loading, bookings: false}
            }));
        }
    },

    fetchCurrentUser: async () => {
        try {
            set(state => ({loading: {...state.loading, currentUser: true}}));
            const currentUser = await User.getCurrent();
            set(state => ({
                currentUser,
                loading: {...state.loading, currentUser: false}
            }));
        } catch (error) {
            console.error('Store: Error fetching current user:', error);
            set(state => ({
                currentUser: null,
                loading: {...state.loading, currentUser: false}
            }));
        }
    },

    fetchBookingOrganizers: async () => {
        try {
            set(state => ({loading: {...state.loading, organizers: true}}));
            const organizers = await User.getBookingOrganizers();
            set(state => ({
                availableOrganizers: organizers,
                loading: {...state.loading, organizers: false}
            }));
        } catch (error) {
            console.error('Store: Error fetching booking organizers:', error);
            set(state => ({
                availableOrganizers: [],
                loading: {...state.loading, organizers: false}
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
            set(state => ({loading: {...state.loading, equipment: true}}));
            const data = await Booking.getAvailableEquipments(startTime, endTime);
            set(state => ({loading: {...state.loading, equipment: false}}));
            return data;
        } catch (error) {
            console.error('Error fetching available equipment:', error);
            set(state => ({loading: {...state.loading, equipment: false}}));
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
            set(state => ({
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
            set(state => ({
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
            set(state => ({loading: {...state.loading, organizers: true}}));
            const users = await User.getAllUsers();
            set(state => ({
                availableOrganizers: users, // Réutilisation du même champ pour stocker tous les utilisateurs
                loading: {...state.loading, organizers: false}
            }));
            return users;
        } catch (error) {
            console.error('Error fetching all users:', error);
            set(state => ({loading: {...state.loading, organizers: false}}));
            throw error;
        }
    },

    updateUserStatus: async (userId: string, status: boolean) => {
        try {
            const updatedUser = await User.updateUserStatus(userId, status);

            // Mettre à jour la liste des organisateurs si l'utilisateur existe dans la liste
            set(state => ({
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
    }
}));