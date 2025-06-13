import ApiService from './apiService';

export interface ImageConfigData {
    maxFileSize: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
}

class ImageConfig {
    private static equipmentConfig: ImageConfigData | null = null;
    private static roomConfig: ImageConfigData | null = null;

    // Configuration pour les équipements
    public static async getEquipmentImageConfig(): Promise<ImageConfigData> {
        if (!this.equipmentConfig) {
            try {
                this.equipmentConfig = await ApiService.get('/images/equipments/config');
            } catch (error) {
                console.error('Erreur récupération config équipements:', error);
                this.equipmentConfig = {
                    maxFileSize: 5242880, // 5MB
                    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
                };
            }
        }

        return this.equipmentConfig as ImageConfigData;
    }

    // Configuration pour les rooms
    public static async getRoomImageConfig(): Promise<ImageConfigData> {
        if (!this.roomConfig) {
            try {
                this.roomConfig = await ApiService.get('/images/rooms/config');
            } catch (error) {
                console.error('Erreur récupération config rooms:', error);
                this.roomConfig = {
                    maxFileSize: 5242880, // 5MB
                    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
                };
            }
        }

        return this.roomConfig as ImageConfigData;
    }

    // Validation d'un fichier selon la config
    public static validateFile(file: File, config: ImageConfigData): string | null {
        if (!file) {
            return "Aucun fichier sélectionné";
        }

        if (file.size > config.maxFileSize) {
            const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
            return `La taille de l'image ne doit pas dépasser ${maxSizeMB}MB`;
        }

        if (!config.allowedMimeTypes.includes(file.type)) {
            const acceptedList = config.allowedExtensions.join(', ').toUpperCase();
            return `Format non supporté. Utilisez ${acceptedList} uniquement`;
        }

        return null; // Pas d'erreur
    }
}

export default ImageConfig;