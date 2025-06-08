import keycloak from '../../keycloak.js';

class ApiService {
    private static baseUrl = 'https://quarkus-route-gregorydhmccm-dev.apps.rm1.0a51.p1.openshiftapps.com'; // URL de votre backend

    /**
     * Méthode pour vérifier l'état d'authentification
     */
    // public static isAuthenticated(): boolean {
    //     return !!keycloak.token;
    // }

    /**
     * Méthode pour obtenir le token
     */
    // public static getToken(): string | undefined {
    //     return keycloak.token;
    // }

    /**
     * Méthode pour rafraîchir le token si nécessaire
     */
    private static async refreshToken(): Promise<boolean> {
        try {
            if (!keycloak.authenticated) {
                console.log('Utilisateur non authentifié');
                return false;
            }

            // Rafraîchir le token s'il expire dans moins de 30 secondes
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
        // Vérifier l'authentification
        if (!keycloak.authenticated) {
            console.error('Utilisateur non authentifié');
            await keycloak.login();
            throw new Error('Authentification requise');
        }

        // Rafraîchir le token si nécessaire
        const tokenValid = await this.refreshToken();
        if (!tokenValid) {
            console.error('Token invalide ou expiré');
            await keycloak.login();
            throw new Error('Session expirée, veuillez vous reconnecter');
        }

        // Construire l'URL complète
        // const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const url = endpoint.startsWith('https') ? endpoint : `${this.baseUrl}${endpoint}`;

        // Ajouter l'en-tête d'autorisation avec le token
        const headers = {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };

        try {
            // Effectuer la requête
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Gérer les erreurs HTTP
            if (!response.ok) {
                let errorMessage: string;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `Erreur HTTP ${response.status}`;
                } catch (e) {
                    errorMessage = `Erreur HTTP ${response.status}`;
                }

                // Si 401 ou 403, possible problème de token
                if (response.status === 401 || response.status === 403) {
                    try {
                        // Tenter de rafraîchir le token
                        await keycloak.updateToken(0);

                        // Analyser le résultat après rafraîchissement
                        if (keycloak.authenticated) {
                            // Si toujours authentifié, mais erreur 401/403, c'est un problème de permissions
                            return Promise.reject(new Error("Vous n'avez pas les autorisations nécessaires"));
                        } else {
                            // Session expirée, rediriger vers login
                            await keycloak.login();
                            return Promise.reject(new Error("Votre session a expiré"));
                        }
                    } catch (refreshError) {
                        // Problème lors du rafraîchissement du token
                        await keycloak.login();
                        return Promise.reject(new Error("Session invalide, reconnexion nécessaire"));
                    }
                }

                return Promise.reject(new Error(errorMessage));
            }

            // Si c'est une réponse 204 (No Content)
            if (response.status === 204) {
                return null;
            }

            // Retourner les données JSON
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de lappel API:', error);
            throw error;
        }
    }

    // Méthodes d'aide pour les opérations courantes
    public static get(endpoint: string): Promise<any> {
        return this.fetchAuthenticated(endpoint);
    }

    public static post(endpoint: string, data: any): Promise<any> {
        return this.fetchAuthenticated(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async postFormData(endpoint: string, formData: FormData): Promise<any> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
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
}

export default ApiService;