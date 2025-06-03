import { create } from 'zustand';
import { AppState, Room, Equipment } from './types';
import { Room } from './services/Room';
import { Equipment } from './services/Equipment';

export const useStore = create<AppState>((set) => ({
    rooms: [],
    equipment: [],
    bookings: [],
    fetchRooms: async () => {
        try {
            // Assuming Room class has a similar getAll static method
            const data = await Room.getAll();
            set({ rooms: data });
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    },
    fetchEquipment: async () => {
        try {
            const data = await Equipment.getAll();
            set({ equipment: data });
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    },
    fetchEquipmentFixed: async () => {
        try {
            const allEquipment = await Equipment.getAll();
            const fixedEquipment = allEquipment.filter((equip: Equipment) => !equip.getMobile());
            set({ equipment: fixedEquipment });
        } catch (error) {
            console.error('Error fetching fixed equipment:', error);
        }
    },
    fetchBookings: async () => {
        try {
            // Assuming a similar Booking service with getAll method
            const response = await fetch('https://quarkus-route-gregorydhmccm-dev.apps.rm1.0a51.p1.openshiftapps.com/bookings');
            const data = await response.json();
            set({ bookings: data });
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    },
    addRoom: async (room: Partial<Room>) => {
        try {
            const newRoom = new Room();
            Object.assign(newRoom, room);
            const createdRoom = await newRoom.create();
            set((state) => ({ rooms: [...state.rooms, createdRoom] }));
        } catch (error) {
            console.error('Error adding room:', error);
        }
    },
    updateRoom: async (room: Room) => {
        try {
            const roomInstance = new Room();
            Object.assign(roomInstance, room);
            const updatedRoom = await roomInstance.update();
            set((state) => ({
                rooms: state.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)),
            }));
        } catch (error) {
            console.error('Error updating room:', error);
        }
    },
    deleteRoom: async (roomId: string) => {
        try {
            const roomService = new Room();
            roomService.id = roomId;
            await roomService.delete();
            set((state) => ({
                rooms: state.rooms.filter((r) => r.id !== roomId),
            }));
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    },
    addEquipment: async (equipment: Partial<Equipment>) => {
        try {
            const newEquipment = new Equipment();
            Object.assign(newEquipment, equipment);
            const createdEquipment = await newEquipment.create();
            set((state) => ({ equipment: [...state.equipment, createdEquipment] }));
        } catch (error) {
            console.error('Error adding equipment:', error);
        }
    },
    updateEquipment: async (equipment: Equipment) => {
        try {
            const equipmentInstance = new Equipment();
            Object.assign(equipmentInstance, equipment);
            const updatedEquipment = await equipmentInstance.update();
            set((state) => ({
                equipment: state.equipment.map((e) =>
                    e.id === updatedEquipment.getId() ? updatedEquipment : e
                ),
            }));
        } catch (error) {
            console.error('Error updating equipment:', error);
        }
    },
    deleteEquipment: async (equipmentId: string) => {
        try {
            const equipmentInstance = new Equipment();
            equipmentInstance.id = equipmentId;
            await equipmentInstance.delete();
            set((state) => ({
                equipment: state.equipment.filter((e) => e.id !== equipmentId),
            }));
        } catch (error) {
            console.error('Error deleting equipment:', error);
        }
    },
}));