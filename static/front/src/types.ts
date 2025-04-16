export interface Room {
    id: string;
    name: string;
    capacity: number;
    equipment: Equipment[];
}

export interface Equipment {
    id: string;
    name: string;
    description: string;
}

export interface Booking {
    id: string;
    roomId: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: number;
    equipment: string[];
    organizer: string;
}

export interface AppState {
    rooms: Room[];
    equipment: Equipment[];
    bookings: Booking[];
}