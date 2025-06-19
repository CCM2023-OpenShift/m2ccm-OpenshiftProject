import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import SwaggerService from '../services/Swagger';

export const SwaggerPage = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const swaggerUrl = SwaggerService.getSwaggerUiUrl();

    const handleIframeLoad = () => {
        setLoading(false);
        setError(null); // Effacer toute erreur précédente
    };

    const handleIframeError = () => {
        setLoading(false);
        setError("Impossible de charger la documentation API. Vérifiez que le serveur est accessible.");
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Link to="/profile" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold flex items-center">
                        <FileText className="mr-2" size={28} />
                        Documentation API
                    </h1>
                </div>
                <div className="flex items-center">
                    <a
                        href={swaggerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center mr-4 text-indigo-600 hover:text-indigo-800"
                    >
                        <ExternalLink size={16} className="mr-1" />
                        Ouvrir dans une nouvelle fenêtre
                    </a>
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <span className="ml-3 text-gray-600 text-lg">Chargement de la documentation API...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                    <div className="mt-2 text-right">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={() => window.location.reload()}
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-lg"
                 style={{ height: '75vh', display: loading ? 'none' : 'block' }}>
                <iframe
                    src={swaggerUrl}
                    className="w-full h-full"
                    title="Swagger UI"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    style={{ border: 'none' }}
                />
            </div>

            <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t">
                <p>Cette documentation est générée automatiquement à partir des spécifications OpenAPI de votre backend.</p>
                <p>Pour une expérience interactive complète, utilisez le lien "Ouvrir dans une nouvelle fenêtre" ci-dessus.</p>
            </div>
        </div>
    );
};

export default SwaggerPage;