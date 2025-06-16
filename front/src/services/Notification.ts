import ApiService from './apiService';

export class Notification {
    public id!: string;
    public userId!: string;
    public type!: string;
    public title!: string;
    public message!: string;
    public bookingId?: string;
    public read!: boolean;
    public createdAt!: string;

    // Routes mises à jour sans /api/
    private static baseEndpoint: string = `/notifications`;
    // Route admin mise à jour
    private static adminEndpoint: string = `/notifications/admin`;

    public fromJSON(json: any): Notification {
        this.id = json?.id;
        this.userId = json?.userId;
        this.type = json?.type;
        this.title = json?.title;
        this.message = json?.message;
        this.bookingId = json?.bookingId;
        this.read = json?.read || false;
        this.createdAt = json?.createdAt;
        return this;
    }

    public toUpdate(): object {
        return {
            id: this.id,
            userId: this.userId,
            type: this.type,
            title: this.title,
            message: this.message,
            bookingId: this.bookingId,
            read: this.read
        };
    }

    /**
     * Récupère les notifications de l'utilisateur courant
     * Accessible par les rôles user et admin
     */
    public static async getAll(): Promise<Notification[]> {
        try {
            const response = await ApiService.get(Notification.baseEndpoint);
            // Traitement de la nouvelle structure de réponse avec pagination
            const notifications = response?.notifications || [];
            return notifications.map((item: any) => new Notification().fromJSON(item));
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return this.getMockNotifications();
        }
    }

    /**
     * Récupère les notifications de l'utilisateur avec filtrage et pagination
     */
    public static async getAllWithParams(
        params: {
            read?: boolean,
            limit?: number,
            offset?: number,
            type?: string
        }
    ): Promise<{ notifications: Notification[], total: number, limit: number, offset: number }> {
        try {
            // Construction des paramètres de requête
            const queryParams = new URLSearchParams();
            if (params.read !== undefined) {
                queryParams.append('read', params.read.toString());
            }
            if (params.limit) {
                queryParams.append('limit', params.limit.toString());
            }
            if (params.offset) {
                queryParams.append('offset', params.offset.toString());
            }
            if (params.type) {
                queryParams.append('type', params.type);
            }

            const queryStr = queryParams.toString();
            const url = `${Notification.baseEndpoint}${queryStr ? '?' + queryStr : ''}`;

            const response = await ApiService.get(url);

            return {
                notifications: (response?.notifications || []).map((item: any) => new Notification().fromJSON(item)),
                total: response?.total || 0,
                limit: response?.limit || 50,
                offset: response?.offset || 0
            };
        } catch (error) {
            console.error('Error fetching notifications with params:', error);

            // En cas d'erreur, renvoyer des données mockées
            const mockNotifs = this.getMockNotifications();
            return {
                notifications: mockNotifs,
                total: mockNotifs.length,
                limit: 50,
                offset: 0
            };
        }
    }

    /**
     * Récupère le nombre de notifications non lues
     */
    public static async getUnreadCount(): Promise<number> {
        try {
            const response = await ApiService.get(`${Notification.baseEndpoint}/unread-count`);
            return response?.count || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            // Si erreur, on compte les notifications non lues des données mockées
            const mockNotifs = this.getMockNotifications();
            return mockNotifs.filter(n => !n.read).length;
        }
    }

    /**
     * Récupère la liste des types de notifications disponibles
     */
    public static async getNotificationTypes(): Promise<any[]> {
        try {
            return await ApiService.get(`${Notification.baseEndpoint}/types`);
        } catch (error) {
            console.error('Error fetching notification types:', error);
            return [];
        }
    }

    /**
     * Récupère toutes les notifications (fonction réservée aux admins)
     */
    public static async getAllForAdmin(
        params: {
            limit?: number,
            offset?: number,
            type?: string,
            organizer?: string
        } = {}
    ): Promise<{ notifications: Notification[], total: number, limit: number, offset: number }> {
        try {
            // Construction des paramètres de requête
            const queryParams = new URLSearchParams();
            if (params.limit) {
                queryParams.append('limit', params.limit.toString());
            }
            if (params.offset) {
                queryParams.append('offset', params.offset.toString());
            }
            if (params.type) {
                queryParams.append('type', params.type);
            }
            if (params.organizer) {
                queryParams.append('organizer', params.organizer);
            }

            const queryStr = queryParams.toString();
            const url = `${Notification.adminEndpoint}${queryStr ? '?' + queryStr : ''}`;

            const response = await ApiService.get(url);

            return {
                notifications: (response?.notifications || []).map((item: any) => new Notification().fromJSON(item)),
                total: response?.total || 0,
                limit: response?.limit || 100,
                offset: response?.offset || 0
            };
        } catch (error) {
            console.error('Error fetching admin notifications:', error);
            return {
                notifications: [],
                total: 0,
                limit: 100,
                offset: 0
            };
        }
    }

    /**
     * Récupère une notification par son ID
     */
    public static async getById(id: string): Promise<Notification> {
        try {
            const json = await ApiService.get(`${Notification.baseEndpoint}/${id}`);
            return new Notification().fromJSON(json);
        } catch (error) {
            console.error(`Error fetching notification with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Marque une notification spécifique comme lue
     */
    public static async markAsRead(notificationId: string): Promise<void> {
        try {
            await ApiService.put(`${Notification.baseEndpoint}/${notificationId}/read`, {});
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Marque une notification spécifique comme non lue
     */
    public static async markAsUnread(notificationId: string): Promise<void> {
        try {
            await ApiService.put(`${Notification.baseEndpoint}/${notificationId}/unread`, {});
        } catch (error) {
            console.error('Error marking notification as unread:', error);
            throw error;
        }
    }

    /**
     * Marque toutes les notifications de l'utilisateur courant comme lues
     */
    public static async markAllAsRead(): Promise<void> {
        try {
            await ApiService.put(`${Notification.baseEndpoint}/read-all`, {});
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Marque toutes les notifications comme lues (fonction admin)
     */
    public static async markAllAsReadAdmin(): Promise<void> {
        try {
            await ApiService.put(`${Notification.adminEndpoint}/read-all`, {});
        } catch (error) {
            console.error('Error marking all notifications as read (admin):', error);
            throw error;
        }
    }

    /**
     * Supprime une notification par son ID
     */
    public static async delete(notificationId: string): Promise<void> {
        try {
            await ApiService.delete(`${Notification.baseEndpoint}/${notificationId}`);
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Supprime une notification par son ID (fonction admin)
     */
    public static async deleteAdmin(notificationId: string): Promise<void> {
        try {
            await ApiService.delete(`${Notification.adminEndpoint}/${notificationId}`);
        } catch (error) {
            console.error('Error deleting notification (admin):', error);
            throw error;
        }
    }

    /**
     * Crée une notification manuelle (admin uniquement)
     */
    public static async createManualNotification(notificationData: {
        title: string;
        message: string;
        targetUsers?: string[];
        forAllUsers?: boolean;
    }): Promise<any> {
        try {
            return await ApiService.post(`${Notification.adminEndpoint}`, notificationData);
        } catch (error) {
            console.error('Error creating manual notification:', error);
            throw error;
        }
    }

    /**
     * Modifie une notification existante (admin uniquement)
     */
    public static async updateNotification(
        notificationId: string,
        updates: {
            title?: string;
            message?: string;
            notificationType?: string;
            read?: boolean;
        }
    ): Promise<any> {
        try {
            return await ApiService.patch(`${Notification.baseEndpoint}/${notificationId}`, updates);
        } catch (error) {
            console.error('Error updating notification:', error);
            throw error;
        }
    }

    /**
     * Marquer cette notification comme lue (méthode d'instance)
     */
    public async markAsRead(): Promise<void> {
        try {
            await Notification.markAsRead(this.id);
            this.read = true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Marquer cette notification comme non lue (méthode d'instance)
     */
    public async markAsUnread(): Promise<void> {
        try {
            await Notification.markAsUnread(this.id);
            this.read = false;
        } catch (error) {
            console.error('Error marking notification as unread:', error);
            throw error;
        }
    }

    /**
     * Supprimer cette notification (méthode d'instance)
     */
    public async delete(): Promise<void> {
        try {
            await Notification.delete(this.id);
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    // Getters
    public getId(): string {
        return this.id;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getType(): string {
        return this.type;
    }

    public getTitle(): string {
        return this.title;
    }

    public getMessage(): string {
        return this.message;
    }

    public getBookingId(): string | undefined {
        return this.bookingId;
    }

    public isRead(): boolean {
        return this.read;
    }

    public getCreatedAt(): string {
        return this.createdAt;
    }

    // Fonction temporaire pour tests sans backend
    public static getMockNotifications(): Notification[] {
        // Date fixe pour correspondre au système: 2025-06-16 17:05:04
        const currentDate = new Date('2025-06-16T17:05:04Z');

        return [
            new Notification().fromJSON({
                id: '1',
                userId: 'M0rd0rian',  // Corrigé la casse
                type: 'BOOKING_REMINDER',
                title: 'Rappel: Votre réservation demain',
                message: 'Votre réservation "Atelier développement Web" dans la salle L102 est prévue demain.',
                bookingId: '22',
                read: false,
                createdAt: new Date(currentDate.getTime() - 4 * 60 * 60 * 1000).toISOString() // 4 heures avant
            }),
            new Notification().fromJSON({
                id: '2',
                userId: 'M0rd0rian',
                type: 'BOOKING_REMINDER',
                title: '⚠️ Votre réservation commence bientôt',
                message: 'Votre réservation "Test rappel 1h" dans la salle B201 commence dans moins d\'une heure.',
                bookingId: '26',
                read: false,
                createdAt: new Date(currentDate.getTime() - 30 * 60 * 1000).toISOString() // 30 minutes avant
            }),
            new Notification().fromJSON({
                id: '3',
                userId: 'M0rd0rian',
                type: 'BOOKING_REMINDER',
                title: 'Rappel: Votre réservation demain',
                message: 'Votre réservation "Formation React avancé" dans la salle D101 est prévue demain.',
                bookingId: '25',
                read: true,
                createdAt: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 jour avant
            })
        ];
    }
}

export default Notification;