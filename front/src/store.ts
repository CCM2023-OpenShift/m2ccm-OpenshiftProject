import { create } from 'zustand';
import { AppState, Room, Equipment } from './types';
import { Room as RoomService } from './services/Room';
import { Equipment as EquipmentService } from './services/Equipment';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const useStore = create<AppState>((set) => ({
    rooms: [],
    equipment: [],
    bookings: [],
    fetchRooms: async () => {
        try {
            const data = await RoomService.getAll();
            set({ rooms: data });
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    },
    fetchEquipment: async () => {
        try {
            const data = await EquipmentService.getAll();
            set({ equipment: data });
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    },
    fetchEquipmentFixed: async () => {
        try {
            const allEquipment = await EquipmentService.getAll();
            const fixedEquipment = allEquipment.filter((equip: EquipmentService) => !equip.getMobile());
            set({ equipment: fixedEquipment });
        } catch (error) {
            console.error('Error fetching fixed equipment:', error);
        }
    },
    fetchBookings: async () => {
        try {
            // Use the API_URL from environment variables
            const response = await fetch(`${API_URL}/bookings`);
            const data = await response.json();
            set({ bookings: data });
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    },
    addRoom: async (room: Partial<Room>) => {
        try {
            const newRoom = new RoomService();
            Object.assign(newRoom, room);
            const createdRoom = await newRoom.create();
            set((state) => ({ rooms: [...state.rooms, createdRoom] }));
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

            set((state) => ({ equipment: [...state.equipment, equipmentData] }));
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
                    e.id === equipmentId ? { ...e, imageUrl: result.imageUrl } : e
                ),
            }));

        } catch (error) {
            console.error('Error uploading equipment image:', error);
            throw error;
        }
    },

    deleteEquipmentImage: async (equipmentId: string) => {
        try {
            // Find equipment in state using a closure over the set function
            let currentEquipment: Equipment | undefined;

            set((state) => {
                // Find the equipment inside the set callback where state is available
                currentEquipment = state.equipment.find(e => e.id === equipmentId);
                // Don't change state yet, just return it as is
                return state;
            });

            if (!currentEquipment || !currentEquipment.imageUrl) {
                return;
            }

            // Create and properly initialize the Equipment instance
            const equipmentInstance = new EquipmentService();
            equipmentInstance.id = equipmentId;
            equipmentInstance.imageUrl = currentEquipment.imageUrl;

            // Now deleteImage() will work correctly because hasImage() will return true
            await equipmentInstance.deleteImage();

            // Update the state
            set((state) => ({
                equipment: state.equipment.map((e) =>
                    e.id === equipmentId ? { ...e, imageUrl: '' } : e
                ),
            }));

            // Optional: Force refresh the equipment data to confirm changes
            await EquipmentService.getAll().then(data => {
                set({ equipment: data });
            });

        } catch (error) {
            console.error('Error deleting equipment image:', error);
            throw error;
        }
    },

    // ========== NOUVELLES MÉTHODES POUR LES IMAGES DES SALLES ==========
    uploadRoomImage: async (roomId: string, file: File) => {
        try {
            const roomInstance = new RoomService();
            roomInstance.id = roomId;

            console.log('Uploading image for room:', roomId);
            const result = await roomInstance.uploadImage(file);
            console.log('Room image upload successful:', result.imageUrl);

            set((state) => ({
                rooms: state.rooms.map((r) =>
                    r.id === roomId ? { ...r, imageUrl: result.imageUrl } : r
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

            console.log('Deleting image for room:', roomId);
            await roomInstance.deleteImage();
            console.log('Room image deleted successfully');

            set((state) => ({
                rooms: state.rooms.map((r) =>
                    r.id === roomId ? { ...r, imageUrl: undefined } : r
                ),
            }));

            // Force refresh room data
            await RoomService.getAll().then(data => {
                set({ rooms: data });
            });
        } catch (error) {
            console.error('Error deleting room image:', error);
            throw error;
        }
    },
}));