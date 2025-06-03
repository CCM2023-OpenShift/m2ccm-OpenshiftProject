import ApiService from './apiService';

export class Equipment {
    public id!: string;
    public name!: string;
    public description!: string;
    public quantity!: number;
    public mobile!: boolean;

    errors!: object;

    private static baseEndpoint: string = `/equipment`;

    public resetErrors(): void {
        this.errors = {};
    }

    public fromJSON(json: any): Equipment {
        this.id = json?.id;
        this.name = json?.name;
        this.description = json?.description;
        this.quantity = json?.quantity;
        this.mobile = json?.mobile;
        return this;
    }

    public toCreate(): object {
        return {
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            mobile: this.mobile,
        };
    }

    public toUpdate(): object {
        return {
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            mobile: this.mobile,
        };
    }

    public async create(): Promise<Equipment> {
        try {
            const payload = this.toCreate();

            const json = await ApiService.post(Equipment.baseEndpoint, payload);
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error creating equipment:', error);
            throw error;
        }
    }

    public async update(): Promise<Equipment> {
        try {
            const json = await ApiService.put(`${Equipment.baseEndpoint}/${this.id}`, this.toUpdate());
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error updating equipment:', error);
            throw error;
        }
    }

    public async delete(): Promise<void> {
        try {
            await ApiService.delete(`${Equipment.baseEndpoint}/${this.id}`);
        } catch (error) {
            console.error('Error deleting equipment:', error);
            throw error;
        }
    }

    public static async getAll(): Promise<Equipment[]> {
        try {
            const list = await ApiService.get(Equipment.baseEndpoint);
            return (list || []).map((item: any) => new Equipment().fromJSON(item));
        } catch (error) {
            console.error('Error fetching equipment:', error);
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

    public getDescription(): string {
        return this.description;
    }

    public getQuantity(): number {
        return this.quantity;
    }

    public getMobile(): boolean {
        return this.mobile;
    }
}
