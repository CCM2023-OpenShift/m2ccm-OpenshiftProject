import ApiService from './apiService';
import { RoomEquipment } from './RoomEquipment';

export class Room {
    public id!: string;
    public name!: string;
    public capacity!: number;
    public imageUrl?: string;
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
        this.imageUrl = json?.imageUrl;
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
            imageUrl: this.imageUrl,
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
                imageUrl: this.imageUrl,
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
                imageUrl: this.imageUrl,
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

    // ========== MÉTHODES POUR GÉRER LES IMAGES AVEC APISERVICE ==========

    public async uploadImage(file: File): Promise<{ message: string; imageUrl: string }> {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const result = await ApiService.postFormData(`${Room.baseEndpoint}/${this.id}/image`, formData);
            this.imageUrl = result.imageUrl;
            return result;
        } catch (error) {
            console.error('Error uploading room image:', error);
            throw error;
        }
    }

    public async deleteImage(): Promise<{ message: string }> {
        try {
            const result = await ApiService.delete(`${Room.baseEndpoint}/${this.id}/image`);
            this.imageUrl = undefined;
            return result;
        } catch (error) {
            console.error('Error deleting room image:', error);
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

    public getImageUrl(): string | undefined {
        return this.imageUrl;
    }

    public getRoomEquipment(): RoomEquipment[] {
        return this.roomEquipments;
    }
}