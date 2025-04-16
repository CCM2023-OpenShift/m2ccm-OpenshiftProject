import { create } from 'zustand';
import { AppState, Room, Equipment, Booking } from './types';

// Données initiales pour les salles
const initialRooms: Room[] = [
    {
        id: '1',
        name: 'Salle A101',
        capacity: 30,
        equipment: ['1', '2'],
    },
    {
        id: '2',
        name: 'Salle B202',
        capacity: 20,
        equipment: ['1'],
    },
];

// Données initiales pour les équipements
const initialEquipment: Equipment[] = [
    {
        id: '1',
        name: 'Projecteur',
        description: 'Projecteur HD avec connexion HDMI',
    },
    {
        id: '2',
        name: 'Tableau blanc',
        description: 'Tableau blanc magnétique 2m x 1.5m',
    },
];

export const useStore = create<AppState>((set) => ({
    rooms: initialRooms,
    equipment: initialEquipment,
    bookings: [],
}));

// Actions
export const addBooking = (booking: Booking) => {
    useStore.setState((state) => ({
        bookings: [...state.bookings, booking],
    }));
};

export const deleteBooking = (bookingId: string) => {
    useStore.setState((state) => ({
        bookings: state.bookings.filter((booking) => booking.id !== bookingId),
    }));
};