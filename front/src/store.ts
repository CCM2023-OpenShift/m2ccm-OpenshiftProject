import { create } from 'zustand';
import { AppState, Room, Equipment } from './types';
import { Room as RoomService } from './services/Room';
import { Equipment as EquipmentService } from './services/Equipment';

export const useStore = create<AppState>((set) => ({
    rooms: [],
    equipment: [],
    bookings: [],
    fetchRooms: async () => {
        const response = await fetch('http://localhost:8080/rooms');
        const data = await response.json();
        set({ rooms: data });
    },
    fetchEquipment: async () => {
        const response = await fetch('http://localhost:8080/equipment');
        const data = await response.json();
        set({ equipment: data });
    },
    fetchEquipmentFixed: async () => {
        const response = await fetch('http://localhost:8080/equipment');
        const data = await response.json();
        const fixedEquipment = data.filter((equip: Equipment) => !equip.mobile);
        set({ equipment: fixedEquipment });
    },
    fetchBookings: async () => {
        const response = await fetch('http://localhost:8080/bookings');
        const data = await response.json();
        set({ bookings: data });
    },
    addRoom: async (room: Partial<Room>) => {
        const newRoom = new RoomService();
        Object.assign(newRoom, room);
        const createdRoom = await newRoom.create();
        set((state) => ({ rooms: [...state.rooms, createdRoom] }));
    },
    updateRoom: async (room: Room) => {
        const roomInstance = new RoomService();
        Object.assign(roomInstance, room);
        const updatedRoom = await roomInstance.update();
        set((state) => ({
            rooms: state.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)),
        }));
    },
    deleteRoom: async (roomId: string) => {
        const roomService = new RoomService();
        roomService.id = roomId;
        await roomService.delete();
        set((state) => ({
            rooms: state.rooms.filter((r) => r.id !== roomId),
        }));
    },
    addEquipment: async (equipment: Partial<Equipment>) => {
        const newEquipment = new EquipmentService();
        Object.assign(newEquipment, equipment);
        const createdEquipment = await newEquipment.create();
        set((state) => ({ equipment: [...state.equipment, createdEquipment] }));
    },
    updateEquipment: async (equipment: Equipment) => {
        const equipmentService = new EquipmentService();
        Object.assign(equipmentService, equipment);
        const updatedEquipment = await equipmentService.update();
        set((state) => ({
            equipment: state.equipment.map((e) => (e.id === updatedEquipment.id ? updatedEquipment : e)),
        }));
    },
    deleteEquipment: async (equipmentId: string) => {
        const equipmentService = new EquipmentService();
        equipmentService.id = equipmentId;
        await equipmentService.delete();
        set((state) => ({
            equipment: state.equipment.filter((e) => e.id !== equipmentId),
        }));
    },
}));