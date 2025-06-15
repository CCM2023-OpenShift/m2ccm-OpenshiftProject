import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { UserCircle, Mail, Tag, Shield, Info, ExternalLink, Users, Settings } from 'lucide-react';

// Fonction pour générer l'URL vers le profil utilisateur dans Keycloak
const getKeycloakUserLink = (userId: string) => {
    return `${import.meta.env.VITE_KEYCLOAK_URL}/admin/master/console/#/${import.meta.env.VITE_KEYCLOAK_REALM}/users/${userId}/settings`;
};

export function ProfilePage() {
    const { currentUser, fetchCurrentUser } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadUserData() {
            try {
                setLoading(true);
                setError(null);
                await fetchCurrentUser();
            } catch (err) {
                setError('Impossible de charger les données de profil');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        }

        void loadUserData();
    }, [fetchCurrentUser]);

    // Fonction pour déterminer le rôle basé sur le nom d'utilisateur
    const determineRole = (username: string): string => {
        if (username.includes('admin')) return 'Admin';
        if (username.includes('prof')) return 'Professeur';
        if (username.includes('etudiant')) return 'Étudiant';
        if (username.includes('staff')) return 'Personnel';
        if (username.includes('guest')) return 'Invité';
        return 'User';
    };

    // Vérification si l'utilisateur est un admin
    const isAdmin = currentUser?.username?.includes('admin') || false;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200">Mon profil utilisateur</h1>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 text-red-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={() => fetchCurrentUser()}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1 rounded font-medium text-sm"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement du profil...</span>
                </div>
            )}

            {!loading && !error && currentUser && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* En-tête du profil avec fond coloré */}
                    <div className={`bg-gradient-to-r ${isAdmin ? 'from-purple-600 to-purple-700' : 'from-blue-500 to-blue-600'} p-6 text-white`}>
                        <div className="flex flex-col md:flex-row md:items-center">
                            <div className="flex-shrink-0 mx-auto md:mx-0 mb-4 md:mb-0">
                                <div className="h-28 w-28 rounded-full bg-white text-blue-500 flex items-center justify-center text-4xl">
                                    <UserCircle size={64} className={isAdmin ? 'text-purple-600' : 'text-blue-500'} />
                                </div>
                            </div>
                            <div className="text-center md:text-left md:ml-6">
                                <h2 className="text-2xl font-bold">{currentUser.displayName}</h2>
                                <p className="opacity-80">@{currentUser.username}</p>
                            </div>
                        </div>
                    </div>

                    {/* Informations du profil */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center text-gray-600 mb-1">
                                        <UserCircle size={18} className="mr-2" />
                                        <span className="text-sm font-medium">Nom, prénom</span>
                                    </div>
                                    <p className="text-gray-800 ml-7">
                                        {currentUser.firstName && currentUser.lastName
                                            ? `${currentUser.firstName} ${currentUser.lastName}`
                                            : '−'}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Mail size={18} className="mr-2" />
                                        <span className="text-sm font-medium">E-mail</span>
                                    </div>
                                    <p className="text-gray-800 ml-7">
                                        {currentUser.email || '−'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Tag size={18} className="mr-2" />
                                        <span className="text-sm font-medium">Rôle</span>
                                    </div>
                                    <div className="ml-7">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            isAdmin
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {determineRole(currentUser.username)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Shield size={18} className="mr-2" />
                                        <span className="text-sm font-medium">Statut</span>
                                    </div>
                                    <div className="ml-7">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            currentUser.enabled
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {currentUser.enabled ? 'Actif' : 'Désactivé'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Message d'information différent selon le rôle (admin ou non) */}
                        {isAdmin ? (
                            <div className="mt-8 bg-purple-50 rounded-lg p-4 flex">
                                <div className="flex-shrink-0 text-purple-500">
                                    <Info size={24} />
                                </div>
                                <div className="ml-4 flex-grow">
                                    <h3 className="text-purple-800 font-medium">Informations synchronisées avec Keycloak</h3>
                                    <p className="mt-1 text-purple-700">
                                        🛠️ Vos informations personnelles sont synchronisées avec le système d'authentification central (Keycloak).
                                        Pour modifier les profils des utilisateurs, utilisez la console d'administration.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <Link
                                            to="/admin/users"
                                            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                                        >
                                            <Users size={16} className="mr-2" />
                                            Accéder à la gestion des utilisateurs
                                        </Link>

                                        <a
                                            href={getKeycloakUserLink(currentUser.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-purple-200 hover:bg-purple-300 text-purple-900 rounded-md transition-colors"
                                        >
                                            <Settings size={16} className="mr-2" />
                                            Accéder à Keycloak Admin
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 bg-blue-50 rounded-lg p-4 flex">
                                <div className="flex-shrink-0 text-blue-500">
                                    <Info size={24} />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-blue-800 font-medium">Informations de profil en lecture seule</h3>
                                    <p className="mt-1 text-blue-700">
                                        🛠️ Les informations de votre profil sont gérées par l'administration. Pour toute modification, contactez l'assistance.
                                    </p>
                                    <a
                                        href="mailto:admin@example.com"
                                        className="mt-3 inline-flex items-center text-blue-700 hover:text-blue-900 font-medium"
                                    >
                                        <ExternalLink size={16} className="mr-1" />
                                        Contacter un administrateur pour mettre à jour vos informations
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;