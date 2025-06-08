export interface Room {
    id: string;
    name: string;
    capacity: number;
    imageUrl?: string;
    roomEquipments: RoomEquipment[];
}

export interface RoomEquipment {
    id: string;
    quantity: number;
    equipmentId: string;
    roomId: string;
}

export interface Equipment {
    id: string;
    name: string;
    description: string;
    quantity: number;
    mobile: boolean;
    imageUrl?: string;
}

export interface Booking {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: number;
    organizer: string;
    room: Room;
    bookingEquipments: BookingEquipment[];
}

export interface BookingEquipment {
    id: string;
    quantity: number;
    equipmentId: string;
    bookingId: string;
    startTime: string;
    endTime: string;
}

export interface AppState {
    rooms: Room[];
    equipment: Equipment[];
    bookings: Booking[];
    fetchRooms: () => Promise<void>;
    fetchEquipment: () => Promise<void>;
    fetchEquipmentFixed: () => Promise<void>;
    fetchBookings: () => Promise<void>;
    addRoom: (room: Partial<Room>) => Promise<void>;
    updateRoom: (room: Room) => Promise<void>;
    deleteRoom: (roomId: string) => Promise<void>;
    addEquipment: (equipment: Partial<Equipment>) => Promise<Equipment>;
    updateEquipment: (equipment: Equipment) => Promise<Equipment>;
    deleteEquipment: (equipmentId: string) => Promise<void>;
    uploadEquipmentImage: (equipmentId: string, file: File) => Promise<void>;
    deleteEquipmentImage: (equipmentId: string) => Promise<void>;
    uploadRoomImage: (roomId: string, file: File) => Promise<void>;
    deleteRoomImage: (roomId: string) => Promise<void>;
}