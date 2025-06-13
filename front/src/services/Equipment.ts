import ApiService from './apiService';

export class Equipment {
    public id!: string;
    public name!: string;
    public description!: string;
    public quantity!: number;
    public mobile!: boolean;
    public imageUrl!: string;

    private static baseEndpoint: string = `/equipment`;

    public fromJSON(json: any): Equipment {
        this.id = json?.id;
        this.name = json?.name;
        this.description = json?.description;
        this.quantity = json?.quantity;
        this.mobile = json?.mobile;
        this.imageUrl = json?.imageUrl;
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

    // Suppression de l'équipement ET de son image
    public async delete(): Promise<void> {
        try {
            await ApiService.deleteEquipmentWithImage(this.id);
        } catch (error) {
            console.error('Error deleting equipment:', error);
            throw error;
        }
    }

    public async uploadImage(file: File): Promise<{ imageUrl: string }> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await ApiService.postFormData(`${Equipment.baseEndpoint}/${this.id}/image`, formData);
            this.imageUrl = response.imageUrl;
            return response;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    // Suppression de l'image du storage
    public async deleteImage(): Promise<void> {
        try {
            if (!this.hasImage()) {
                return;
            }

            // Appel API pour supprimer l'image du storage
            await ApiService.delete(`${Equipment.baseEndpoint}/${this.id}/image`);

            // Mettre à jour l'objet local
            this.imageUrl = '';
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    // Méthode pour supprimer une image par URL (pour le cas direct)
    public static async deleteImageByUrl(imageUrl: string): Promise<void> {
        try {
            if (!imageUrl || imageUrl.trim() === '') {
                return;
            }

            await ApiService.deleteWithBody('/images/equipments', { imageUrl });
        } catch (error) {
            console.error('Error deleting image by URL:', error);
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

    public getImageUrl(): string {
        return this.imageUrl;
    }

    public hasImage(): boolean {
        return this.imageUrl != null && this.imageUrl.trim() !== '';
    }
}