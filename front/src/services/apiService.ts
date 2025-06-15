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
                return false;
            }

            await keycloak.updateToken(30);
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
                    // Essayer d'extraire le message d'erreur détaillé
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || `Erreur HTTP ${response.status}`;
                    } else {
                        // Pour les réponses textuelles
                        errorMessage = await response.text();
                    }
                } catch (e) {
                    errorMessage = `Erreur HTTP ${response.status}`;
                }

                // Gestion spécifique pour les erreurs 409 (Conflict)
                if (response.status === 409) {
                    // Création d'une erreur spécifique pour les conflits de réservation
                    const error = new Error(errorMessage);
                    error.name = "ConflictError";
                    return Promise.reject(error);
                }

                // Gestion des erreurs d'authentification (comme avant)
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

    public static async deleteWithBody(endpoint: string, data: any): Promise<any> {
        return this.fetchAuthenticated(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
    }

    public static async deleteEquipmentWithImage(equipmentId: string): Promise<void> {
        await this.ensureAuthenticated();

        // First get the equipment to check if it has an image
        const equipment = await this.get(`/equipment/${equipmentId}`);

        if (equipment?.imageUrl) {
            try {
                await this.delete(`/equipment/${equipmentId}/image`);
            } catch (error) {
                console.error('Error deleting image via equipment endpoint:', error);
            }
        }

        // Then delete the equipment
        await this.delete(`/equipment/${equipmentId}`);
    }

    public static async deleteRoomWithImage(roomId: string): Promise<void> {
        await this.ensureAuthenticated();

        // First get the room to check if it has an image
        const room = await this.get(`/rooms/${roomId}`);

        if (room?.imageUrl) {
            try {
                await this.delete(`/rooms/${roomId}/image`);
            } catch (error) {
                console.error('Error deleting room image:', error);
            }
        }

        // Then delete the room
        await this.delete(`/rooms/${roomId}`);
    }

    public static patch(endpoint: string, data: any): Promise<any> {
        return this.fetchAuthenticated(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
}

export default ApiService;
