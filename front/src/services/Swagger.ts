export class SwaggerService {
    private static swaggerUiUrl: string = '/swagger-ui';

    /**
     * Récupère l'URL complète du Swagger UI
     */
    public static getSwaggerUiUrl(): string {
        return `${import.meta.env.VITE_API_URL}${this.swaggerUiUrl}`;
    }
}

export default SwaggerService;
