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
            return [];
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
            return {
                notifications: [],
                total: 0,
                limit: params.limit || 50,
                offset: params.offset || 0
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
            return 0;
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
}

export default Notification;
