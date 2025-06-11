import keycloak from '../../keycloak.js';

class ApiService {
    private static baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    /**
     * Vérifie l'authentification et rafraîchit le token si nécessaire.
     */
    private static async ensureAuthenticated(): Promise<void> {
        if (!keycloak.authenticated) {
            console.error('Utilisateur non authentifié');
            await keycloak.login();
            throw new Error('Authentification requise');
        }

        const tokenValid = await this.refreshToken();
        if (!tokenValid) {
            console.error('Token invalide ou expiré');
            await keycloak.login();
            throw new Error('Session expirée, veuillez vous reconnecter');
        }
    }

    /**
     * Méthode pour rafraîchir le token si nécessaire
     */
    private static async refreshToken(): Promise<boolean> {
        try {
            if (!keycloak.authenticated) {
                console.log('Utilisateur non authentifié');
                return false;
            }

            const refreshed = await keycloak.updateToken(30);
            if (refreshed) {
                console.log('Token rafraîchi avec succès');
            }
            return true;
        } catch (error) {
            console.error('Erreur lors du rafraîchissement du token:', error);
            return false;
        }
    }

    /**
     * Méthode pour les appels API authentifiés
     */
    public static async fetchAuthenticated(endpoint: string, options: RequestInit = {}): Promise<any> {
        await this.ensureAuthenticated();

        const url = endpoint.startsWith('https') ? endpoint : `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                let errorMessage: string;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `Erreur HTTP ${response.status}`;
                } catch (e) {
                    errorMessage = `Erreur HTTP ${response.status}`;
                }

                if (response.status === 401 || response.status === 403) {
                    try {
                        await keycloak.updateToken(0);
                        if (keycloak.authenticated) {
                            return Promise.reject(new Error("Vous n'avez pas les autorisations nécessaires"));
                        } else {
                            await keycloak.login();
                            return Promise.reject(new Error("Votre session a expiré"));
                        }
                    } catch (refreshError) {
                        await keycloak.login();
                        return Promise.reject(new Error("Session invalide, reconnexion nécessaire"));
                    }
                }

                return Promise.reject(new Error(errorMessage));
            }

            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'appel API:', error);
            throw error;
        }
    }

    public static get(endpoint: string): Promise<any> {
        return this.fetchAuthenticated(endpoint);
    }

    public static post(endpoint: string, data: any): Promise<any> {
        return this.fetchAuthenticated(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    public static put(endpoint: string, data: any): Promise<any> {
        return this.fetchAuthenticated(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    public static delete(endpoint: string): Promise<any> {
        return this.fetchAuthenticated(endpoint, {
            method: 'DELETE'
        });
    }

    public static async postFormData(endpoint: string, formData: FormData): Promise<any> {
        await this.ensureAuthenticated();

        const url = `${this.baseUrl}${endpoint}`;
        console.log(`API call (FormData) to: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${keycloak.token}`
                // Ne pas définir Content-Type : laissé au navigateur
            },
            body: formData,
        });

        if (!response.ok) {
            console.error(`Upload error: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    public static async deleteEquipmentWithImage(equipmentId: string): Promise<void> {
        await this.ensureAuthenticated();

        // First get the equipment to check if it has an image
        const equipment = await this.get(`/equipment/${equipmentId}`);

        if (equipment?.imageUrl) {
            // Delete the image first
            console.log(`🗑️ Deleting image for equipment ${equipmentId}: ${equipment.imageUrl}`);
            try {
                await this.delete(`/equipment/${equipmentId}/image`);

                // Also try to delete the physical file using the direct image endpoint
                // This might fail depending on your backend implementation
                const fileName = equipment.imageUrl.split('/').pop();
                if (fileName) {
                    try {
                        await this.delete(`/images/equipments/${fileName}`);
                        console.log('✅ Physical image file deleted successfully');
                    } catch (imageError) {
                        console.warn('⚠️ Could not delete physical image file:', imageError);
                        // Continue anyway
                    }
                }
            } catch (error) {
                console.error('❌ Error deleting image:', error);
                // Continue with equipment deletion even if image deletion fails
            }
        }

        // Then delete the equipment
        await this.delete(`/equipment/${equipmentId}`);
    }
}

export default ApiService;
