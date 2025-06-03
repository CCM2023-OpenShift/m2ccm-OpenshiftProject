import ApiService from './apiService';
import { RoomEquipment } from './RoomEquipment';

export class Room {
    public id!: string;
    public name!: string;
    public capacity!: number;
    public roomEquipments: RoomEquipment[] = [];

    errors!: object;

    private static baseEndpoint: string = `/rooms`;

    public resetErrors(): void {
        this.errors = {};
    }

    public fromJSON(json: any): Room {
        this.id = json?.id;
        this.name = json?.name;
        this.capacity = json?.capacity;
        this.roomEquipments = (json?.roomEquipments || []).map((re: any) => ({
            id: re.id ?? null,
            quantity: re.quantity,
            equipmentId: re.equipmentId ?? null,
        }));
        return this;
    }

    public toUpdate(): object {
        return {
            name: this.name,
            capacity: this.capacity,
            equipmentWithQuantities: this.roomEquipments.map(eq => ({
                equipmentId: eq.equipmentId,
                quantity: eq.quantity
            }))
        };
    }

    public async create(): Promise<Room> {
        try {
            const payload = {
                name: this.name,
                capacity: this.capacity,
                equipmentWithQuantities: this.roomEquipments.map(eq => ({
                    equipmentId: eq.equipmentId,
                    quantity: eq.quantity
                }))
            };

            const json = await ApiService.post(Room.baseEndpoint, payload);
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    public async update(): Promise<Room> {
        try {
            const payload = {
                name: this.name,
                capacity: this.capacity,
                equipmentWithQuantities: this.roomEquipments.map(eq => ({
                    equipmentId: eq.equipmentId,
                    quantity: eq.quantity
                }))
            };

            const json = await ApiService.put(`${Room.baseEndpoint}/${this.id}`, payload);
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    }

    public async delete(): Promise<void> {
        try {
            await ApiService.delete(`${Room.baseEndpoint}/${this.id}`);
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    }

    public static async getAll(): Promise<Room[]> {
        try {
            const list = await ApiService.get(Room.baseEndpoint);
            return (list || []).map((item: any) => new Room().fromJSON(item));
        } catch (error) {
            console.error('Error fetching rooms:', error);
            throw error;
        }
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getCapacity(): number {
        return this.capacity;
    }

    public getRoomEquipment(): RoomEquipment[] {
        return this.roomEquipments;
    }
}
