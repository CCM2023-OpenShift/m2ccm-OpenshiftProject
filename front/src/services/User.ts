import ApiService from './apiService';

interface UsernameValidation {
    username: string;
    valid: boolean;
    message: string;
}

export class User {
    public id!: string;
    public username!: string;
    public firstName?: string;
    public lastName?: string;
    public email?: string;
    public displayName!: string;
    public enabled!: boolean;

    private static baseEndpoint: string = `/api/users`;

    public fromJSON(json: any): User {
        this.id = json?.id || '';
        this.username = json?.username || '';
        this.firstName = json?.firstName;
        this.lastName = json?.lastName;
        this.email = json?.email;
        this.displayName = json?.displayName || '';
        this.enabled = Boolean(json?.enabled ?? true);
        return this;
    }

    public toCreate(): object {
        return {
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            displayName: this.displayName,
            enabled: this.enabled,
        };
    }

    public toUpdate(): object {
        return {
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            displayName: this.displayName,
            enabled: this.enabled,
        };
    }

    // ========== MÉTHODES STATIQUES ==========

    /**
     * Récupère l'utilisateur actuellement connecté
     */
    public static async getCurrent(): Promise<User> {
        try {
            const userData = await ApiService.get(`${User.baseEndpoint}/current`);
            return new User().fromJSON(userData);
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw new Error('Impossible de récupérer les informations de l\'utilisateur actuel');
        }
    }

    /**
     * Récupère la liste des organisateurs possibles (admin seulement)
     */
    public static async getBookingOrganizers(): Promise<User[]> {
        try {
            const usersData = await ApiService.get(`${User.baseEndpoint}/booking-organizers`);
            return (usersData || []).map((userData: any) => new User().fromJSON(userData));
        } catch (error) {
            console.error('Error fetching booking organizers:', error);

            // Essayer de récupérer au moins l'utilisateur actuel
            try {
                const currentUser = await User.getCurrent();
                const displayName = currentUser.getDisplayName() || `${currentUser.getUsername()} (Vous)`;
                currentUser.setDisplayName(displayName);
                return [currentUser];
            } catch (fallbackError) {
                console.error('Fallback failed:', fallbackError);
                throw new Error('Impossible de récupérer la liste des organisateurs');
            }
        }
    }

    /**
     * Mise à jour du statut d'un utilisateur (actif/inactif)
     */
    public static async updateUserStatus(userId: string, enabled: boolean): Promise<User> {
        try {
            const response = await ApiService.patch(`${User.baseEndpoint}/${userId}/status`, { enabled });
            return new User().fromJSON(response);
        } catch (error) {
            console.error('Error updating user status:', error);
            throw new Error(`Impossible de mettre à jour le statut de l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    /**
     * Envoi d'un email de réinitialisation de mot de passe
     */
    public static async sendPasswordResetEmail(userId: string): Promise<void> {
        try {
            await ApiService.post(`${User.baseEndpoint}/${userId}/reset-password`, {});
        } catch (error) {
            console.error('Error sending password reset email:', error);

            // Message d'erreur plus descriptif
            let errorMessage = "Impossible d'envoyer l'email de réinitialisation";

            // Essayons de récupérer plus d'informations sur l'erreur
            if (error instanceof Error) {
                if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
                    errorMessage += ". Erreur interne du serveur: le service d'email n'est peut-être pas configuré dans Keycloak ou les permissions sont insuffisantes.";
                } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                    errorMessage += ". Permissions insuffisantes pour effectuer cette action.";
                } else {
                    errorMessage += `: ${error.message}`;
                }
            }

            throw new Error(errorMessage);
        }
    }

    /**
     * Récupère tous les utilisateurs (admin seulement)
     */
    public static async getAll(): Promise<User[]> {
        try {
            const list = await ApiService.get(User.baseEndpoint);
            return (list || []).map((item: any) => new User().fromJSON(item));
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    /**
     * Valide un nom d'utilisateur (admin seulement)
     */
    public static async validateUsername(username: string): Promise<UsernameValidation> {
        try {
            return await ApiService.post(`${User.baseEndpoint}/validate-username`, username);
        } catch (error) {
            console.error('Error validating username:', error);

            // Validation côté client corrigée
            const isValid = Boolean(
                username &&
                username.length >= 2 &&
                username.length <= 50 &&
                /^[a-zA-Z0-9._-]+$/.test(username)
            );

            return {
                username,
                valid: isValid,
                message: isValid ? 'Username valide (validation locale)' : 'Username invalide'
            };
        }
    }

    /**
     * Récupère les informations utilisateur depuis le token Keycloak (côté client)
     */
    public static getCurrentFromToken(): User | null {
        try {
            const keycloak = (window as any).keycloak;

            if (!keycloak?.tokenParsed) {
                return null;
            }

            const token = keycloak.tokenParsed;

            const userData = {
                id: token.sub || '',
                username: token.preferred_username || 'Utilisateur',
                firstName: token.given_name || undefined,
                lastName: token.family_name || undefined,
                email: token.email || undefined,
                enabled: true
            };

            const user = new User().fromJSON(userData);

            // Construction du nom d'affichage avec vérifications
            const firstName = user.getFirstName();
            const lastName = user.getLastName();
            const username = user.getUsername();

            if (firstName && lastName) {
                user.setDisplayName(`${firstName} ${lastName}`);
            } else if (firstName) {
                user.setDisplayName(firstName);
            } else {
                user.setDisplayName(username);
            }

            return user;

        } catch (error) {
            console.error('Error getting user from token:', error);
            return null;
        }
    }

    /**
     * Alias pour getBookingOrganizers (pour compatibilité)
     */
    public static async getSuggestions(): Promise<User[]> {
        return User.getBookingOrganizers();
    }

    // ========== MÉTHODES D'INSTANCE ==========

    /**
     * Met à jour le statut de l'utilisateur courant
     */
    public async updateStatus(enabled: boolean): Promise<User> {
        try {
            const response = await User.updateUserStatus(this.id, enabled);
            return this.fromJSON(response.toJSON());
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }

    /**
     * Envoie un email de réinitialisation de mot de passe pour l'utilisateur courant
     */
    public async sendPasswordReset(): Promise<void> {
        try {
            await User.sendPasswordResetEmail(this.id);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }

    /**
     * Crée un nouvel utilisateur (si implémenté côté backend)
     */
    public async create(): Promise<User> {
        try {
            const payload = this.toCreate();
            const json = await ApiService.post(User.baseEndpoint, payload);
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Met à jour l'utilisateur (si implémenté côté backend)
     */
    public async update(): Promise<User> {
        try {
            const json = await ApiService.put(`${User.baseEndpoint}/${this.id}`, this.toUpdate());
            return this.fromJSON(json);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Supprime l'utilisateur (si implémenté côté backend)
     */
    public async delete(): Promise<void> {
        try {
            await ApiService.delete(`${User.baseEndpoint}/${this.id}`);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // ========== GETTERS ==========
    public getId(): string {
        return this.id;
    }

    public getUsername(): string {
        return this.username;
    }

    public getFirstName(): string | undefined {
        return this.firstName;
    }

    public getLastName(): string | undefined {
        return this.lastName;
    }

    public getEmail(): string | undefined {
        return this.email;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    // ========== SETTERS ==========
    public setId(id: string): void {
        this.id = id;
    }

    public setUsername(username: string): void {
        this.username = username;
    }

    public setFirstName(firstName?: string): void {
        this.firstName = firstName;
    }

    public setLastName(lastName?: string): void {
        this.lastName = lastName;
    }

    public setEmail(email?: string): void {
        this.email = email;
    }

    public setDisplayName(displayName: string): void {
        this.displayName = displayName;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    // ========== UTILITY METHODS ==========

    /**
     * Retourne une représentation objet simple
     */
    public toJSON(): any {
        return {
            id: this.id,
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            displayName: this.displayName,
            enabled: this.enabled
        };
    }

    /**
     * Clone l'utilisateur
     */
    public clone(): User {
        return new User().fromJSON(this.toJSON());
    }

    /**
     * Vérifie si c'est l'utilisateur actuel
     */
    public isCurrent(currentUsername: string): boolean {
        return this.username === currentUsername;
    }

    /**
     * Vérifie si l'utilisateur a un nom complet
     */
    public hasFullName(): boolean {
        return !!(this.firstName && this.lastName);
    }

    /**
     * Génère automatiquement le displayName
     */
    public generateDisplayName(): void {
        if (this.firstName && this.lastName) {
            this.displayName = `${this.firstName} ${this.lastName}`;
        } else if (this.firstName) {
            this.displayName = this.firstName;
        } else {
            this.displayName = this.username;
        }
    }

    /**
     * Récupère tous les utilisateurs (actifs et inactifs)
     */
    public static async getAllUsers(): Promise<User[]> {
        try {
            const usersData = await ApiService.get(`${User.baseEndpoint}/all`);
            return (usersData || []).map((userData: any) => new User().fromJSON(userData));
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw new Error('Impossible de récupérer la liste complète des utilisateurs');
        }
    }
}

export default User;