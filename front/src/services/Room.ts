import { RoomEquipment } from './RoomEquipment';

export class Room {
    public id!: string;
    public name!: string;
    public capacity!: number;
    public roomEquipments: RoomEquipment[] = [];

    errors!: object;

    private static baseURL: string = `http://localhost:8080/rooms`;

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

            const response = await fetch(`${Room.baseURL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to create room: ${response.status}`);
            }

            const json = await response.json();
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

            const response = await fetch(`${Room.baseURL}/${this.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to update room: ${response.status}`);
            }

            const json = await response.json();
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    }

    public async delete(): Promise<void> {
        try {
            const response = await fetch(`${Room.baseURL}/${this.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete room: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    }

    public static async getAll(): Promise<Room[]> {
        try {
            const response = await fetch(`${Room.baseURL}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch rooms: ${response.status}`);
            }

            const list = await response.json();

            return (list || []).map((item: any) => new Room().fromJSON(item));
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
    }

    // Optional getters
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