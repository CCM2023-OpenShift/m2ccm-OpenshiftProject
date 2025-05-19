export class Equipment {
    public id!: string;
    public name!: string;
    public description!: string;
    public quantity!: number;
    public mobile!: boolean;

    errors!: object;

    private static baseURL: string = `http://localhost:8080/equipment`;

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
            const payload = {
                name: this.name,
                description: this.description,
                quantity: this.quantity,
                mobile: this.mobile,
            };

            const response = await fetch(`${Equipment.baseURL}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                const msg = errorBody.message || `Erreur inconnue (code ${response.status})`;
                throw new Error(msg);
            }

            const json = await response.json();
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error creating equipment:', error);
            throw error;
        }
    }

    public async update(): Promise<Equipment> {
        try {
            const formEquipment = new FormData();
            formEquipment.append('name', this.name);
            formEquipment.append('description', this.description);
            formEquipment.append('quantity', this.quantity.toString()); // Ensure quantity is sent as string
            formEquipment.append('mobile', this.mobile.toString()); // Ensure mobile is sent as string

            const response = await fetch(`${Equipment.baseURL}/${this.id}`, {
                method: 'PUT',
                body: formEquipment
            });

            if (!response.ok) {
                throw new Error(`Failed to update equipment: ${response.status}`);
            }

            const json = await response.json();
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error updating equipment:', error);
            throw error;
        }
    }

    public async delete(): Promise<void> {
        try {
            const response = await fetch(`${Equipment.baseURL}/${this.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete equipment: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting equipment:', error);
            throw error;
        }
    }

    public static async getAll(): Promise<Equipment[]> {
        try {
            const response = await fetch(`${Equipment.baseURL}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch equipment: ${response.status}`);
            }

            const list = await response.json();

            return (list || []).map((item: any) => new Equipment().fromJSON(item));
        } catch (error) {
            console.error('Error fetching equipment:', error);
            return [];
        }
    }

    // Optional getters (can be used in frontend templates)
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
        return this.quantity; // Getter for quantity
    }

    public getMobile(): boolean {
        return this.mobile; // Getter for mobile
    }
}
