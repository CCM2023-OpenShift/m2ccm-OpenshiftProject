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

    // Nouvel endpoint utilisateur standard
    private static baseEndpoint: string = `/api/notifications`;
    // Endpoint pour les fonctions admin
    private static adminEndpoint: string = `/api/admin/notifications`;

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
            const list = await ApiService.get(Notification.baseEndpoint);
            return (list || []).map((item: any) => new Notification().fromJSON(item));
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }

    /**
     * Récupère toutes les notifications (fonction réservée aux admins)
     */
    public static async getAllForAdmin(): Promise<Notification[]> {
        try {
            const list = await ApiService.get(Notification.adminEndpoint);
            return (list || []).map((item: any) => new Notification().fromJSON(item));
        } catch (error) {
            console.error('Error fetching admin notifications:', error);
            return [];
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
        const now = new Date();

        return [
            new Notification().fromJSON({
                id: '1',
                userId: 'm0rd0rian',
                type: 'BOOKING_REMINDER',
                title: 'Rappel: Votre réservation demain',
                message: 'Votre réservation "Atelier développement Web" dans la salle L102 est prévue demain.',
                bookingId: '22',
                read: false,
                createdAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString()
            }),
            new Notification().fromJSON({
                id: '2',
                userId: 'm0rd0rian',
                type: 'BOOKING_REMINDER',
                title: '⚠️ Votre réservation commence bientôt',
                message: 'Votre réservation "Test rappel 1h" dans la salle B201 commence dans moins d\'une heure.',
                bookingId: '26',
                read: false,
                createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
            }),
            new Notification().fromJSON({
                id: '3',
                userId: 'm0rd0rian',
                type: 'BOOKING_REMINDER',
                title: 'Rappel: Votre réservation demain',
                message: 'Votre réservation "Formation React avancé" dans la salle D101 est prévue demain.',
                bookingId: '25',
                read: true,
                createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            })
        ];
    }
}

export default Notification;