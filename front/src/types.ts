import User from "./services/User.ts";

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    bookingId?: string;
    read: boolean;
    createdAt: string;
}

export interface NotificationParams {
    read?: boolean;
    limit?: number;
    offset?: number;
    type?: string;
}

export interface Room {
    id: string;
    name: string;
    capacity: number;
    building: string;
    floor: string;
    type: string;
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

export interface LoadingState {
    rooms: boolean;
    equipment: boolean;
    bookings: boolean;
    currentUser: boolean;
    organizers: boolean;
    notifications: boolean;
}

export interface UserType {
    getId: () => string;
    getUsername: () => string;
    getEmail: () => string | null;
    getDisplayName: () => string;
    getFirstName: () => string | null;
    getLastName: () => string | null;
    isEnabled: () => boolean;
    getRoles: () => string[];
}

export interface AppState {
    rooms: Room[];
    equipment: Equipment[];
    bookings: Booking[];
    currentUser: User | null;
    availableOrganizers: User[];
    loading: LoadingState;
    notifications: Notification[];
    unreadNotificationsCount: number;
    fetchAllData: () => Promise<void>;
    fetchRooms: () => Promise<void>;
    fetchEquipment: () => Promise<void>;
    fetchEquipmentFixed: () => Promise<void>;
    fetchBookings: () => Promise<void>;
    addRoom: (room: Partial<Room>) => Promise<Room>
    updateRoom: (room: Room) => Promise<Room>;
    deleteRoom: (roomId: string) => Promise<void>;
    addEquipment: (equipment: Partial<Equipment>) => Promise<Equipment>;
    updateEquipment: (equipment: Equipment) => Promise<Equipment>;
    deleteEquipment: (equipmentId: string) => Promise<void>;
    uploadEquipmentImage: (equipmentId: string, file: File) => Promise<{ imageUrl: string }>;
    deleteEquipmentImage: (equipmentId: string) => Promise<void>;
    uploadRoomImage: (roomId: string, file: File) => Promise<{ message: string; imageUrl: string }>;
    deleteRoomImage: (roomId: string) => Promise<void>;
    fetchCurrentUser: () => Promise<void>;
    fetchBookingOrganizers: () => Promise<void>;
    validateUsername: (username: string) => Promise<{ valid: boolean, message: string }>;
    getAvailableEquipments: (startTime: string, endTime: string) => Promise<any[]>;
    createBooking: (bookingData: any) => Promise<any>;
    updateBooking: (booking: any) => Promise<any>;
    fetchAllUsers: () => Promise<User[]>;
    updateUserStatus: (userId: string, status: boolean) => Promise<User>;
    sendPasswordResetEmail: (userId: string) => Promise<void>;
    fetchNotifications: () => Promise<void>;
    markNotificationAsRead: (notificationId: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    dismissNotification: (notificationId: string) => Promise<void>;
    fetchUnreadNotificationsCount: () => Promise<number>;
    fetchNotificationsWithParams: (params: {
        read?: boolean,
        limit?: number,
        offset?: number,
        type?: string
    }) => Promise<{ notifications: Notification[], total: number, limit: number, offset: number }>;
    markNotificationAsUnread: (notificationId: string) => Promise<void>;
    fetchNotificationTypes: () => Promise<any[]>;
}
