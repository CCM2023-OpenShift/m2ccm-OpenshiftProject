import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { ArrowLeft, Users, Search, UserCircle, ExternalLink, X, UserCheck, UserX, Mail, Filter,
    ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import User from '../services/User';

// Type pour la gestion du tri
type SortField = 'name' | 'username' | 'email' | 'status' | 'role';
type SortDirection = 'asc' | 'desc' | null;

export function UserManagementPage() {
    const { currentUser } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // État pour la gestion des utilisateurs
    const [users, setUsers] = useState<User[]>([]);
    const [showInactive, setShowInactive] = useState(true);

    // État pour le tri
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // État pour le filtre de rôle
    const [roleFilter, setRoleFilter] = useState<string | null>(null);

    useEffect(() => {
        async function loadAllUsers() {
            try {
                setLoading(true);
                setError(null);
                const allUsers = await User.getAllUsers();
                setUsers(allUsers);
            } catch (err) {
                setError('Impossible de charger la liste des utilisateurs');
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        }

        void loadAllUsers();
    }, []);

    // Fonction pour déterminer le rôle d'un utilisateur
    const getUserRole = (username: string): string => {
        if (username.includes('admin')) return 'Admin';
        if (username.includes('prof')) return 'Professeur';
        if (username.includes('etudiant')) return 'Étudiant';
        if (username.includes('staff')) return 'Personnel';
        if (username.includes('guest')) return 'Invité';
        return 'User';
    };

    // Fonction de tri des utilisateurs
    const sortUsers = (users: User[]) => {
        if (!sortField || !sortDirection) return users;

        return [...users].sort((a, b) => {
            let valueA: string | boolean;
            let valueB: string | boolean;

            switch (sortField) {
                case 'name':
                    valueA = a.getDisplayName().toLowerCase();
                    valueB = b.getDisplayName().toLowerCase();
                    break;
                case 'username':
                    valueA = a.getUsername().toLowerCase();
                    valueB = b.getUsername().toLowerCase();
                    break;
                case 'email':
                    valueA = (a.getEmail() || '').toLowerCase();
                    valueB = (b.getEmail() || '').toLowerCase();
                    break;
                case 'status':
                    valueA = a.isEnabled();
                    valueB = b.isEnabled();
                    break;
                case 'role':
                    valueA = getUserRole(a.getUsername()).toLowerCase();
                    valueB = getUserRole(b.getUsername()).toLowerCase();
                    break;
                default:
                    valueA = a.getDisplayName().toLowerCase();
                    valueB = b.getDisplayName().toLowerCase();
            }

            if (sortDirection === 'asc') {
                if (valueA < valueB) return -1;
                if (valueA > valueB) return 1;
                return 0;
            } else {
                if (valueA > valueB) return -1;
                if (valueA < valueB) return 1;
                return 0;
            }
        });
    };

    // Fonction pour changer le tri
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Cycle through: asc -> desc -> null -> asc
            if (sortDirection === 'asc') setSortDirection('desc');
            else if (sortDirection === 'desc') setSortDirection(null);
            else setSortDirection('asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filtrage des utilisateurs
    const filteredUsers = sortUsers(users)
        .filter(user => showInactive || user.isEnabled())
        .filter(user => roleFilter === null || getUserRole(user.getUsername()) === roleFilter)
        .filter(user =>
            searchTerm.trim() === '' ||
            user.getUsername().toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.getDisplayName().toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.getEmail()?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
        );

    // Fonction pour obtenir l'icône de tri
    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ChevronsUpDown size={14} className="ml-1 text-gray-400" />;
        if (sortDirection === 'asc') return <ChevronUp size={14} className="ml-1 text-indigo-500" />;
        if (sortDirection === 'desc') return <ChevronDown size={14} className="ml-1 text-indigo-500" />;
        return <ChevronsUpDown size={14} className="ml-1 text-gray-400" />;
    };

    // Fonction pour rafraîchir les utilisateurs après une modification
    const refreshUsers = async () => {
        try {
            setLoading(true);
            const allUsers = await User.getAllUsers();
            setUsers(allUsers);
        } catch (err) {
            console.error('Error refreshing users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const toggleUserStatus = async () => {
        if (!selectedUser) return;

        try {
            setIsUpdating(true);
            const newStatus = !selectedUser.isEnabled();
            await User.updateUserStatus(selectedUser.getId(), newStatus);
            await refreshUsers();
            alert(`L'utilisateur ${selectedUser.getDisplayName()} a été ${newStatus ? 'activé' : 'désactivé'} avec succès.`);
            closeModal();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const sendPasswordResetEmail = async () => {
        if (!selectedUser || !selectedUser.getEmail()) return;

        try {
            setIsUpdating(true);
            await User.sendPasswordResetEmail(selectedUser.getId());
            alert(`Un email de réinitialisation de mot de passe a été envoyé à ${selectedUser.getEmail()}`);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
            alert(`Erreur: Impossible d'envoyer l'email de réinitialisation.\n\nDétails techniques: ${error instanceof Error ? error.message : 'Erreur de communication avec le serveur'}\n\nVeuillez vérifier les configurations d'email dans Keycloak ou utiliser directement la console Keycloak.`);
        } finally {
            setIsUpdating(false);
        }
    };

    const getKeycloakUserLink = (userId: string) => {
        return `https://keycloak-dev-gregorydhmccm-dev.apps.rm1.0a51.p1.openshiftapps.com/admin/master/console/#/myrealm-dev/users/${userId}/settings`;
    };

    // Liste des rôles pour les filtres
    const roles = ['Admin', 'Professeur', 'Étudiant', 'Personnel', 'Invité', 'User'];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link to="/profile" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                    <Users size={16} className="mr-1" />
                    <span>{filteredUsers.length} utilisateurs</span>
                </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Rechercher des utilisateurs..."
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>

                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`flex items-center px-4 py-2 rounded-lg border ${
                            showInactive
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                    >
                        <Filter size={16} className="mr-2" />
                        {showInactive ? 'Tous les statuts' : 'Actifs uniquement'}
                    </button>
                </div>

                {/* Filtres par rôle */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setRoleFilter(null)}
                        className={`px-3 py-1 text-sm rounded-full ${
                            roleFilter === null
                                ? 'bg-indigo-100 text-indigo-800 font-medium'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Tous les rôles
                    </button>

                    {roles.map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(roleFilter === role ? null : role)}
                            className={`px-3 py-1 text-sm rounded-full ${
                                roleFilter === role
                                    ? role === 'Admin' ? 'bg-purple-100 text-purple-800 font-medium' :
                                        role === 'Professeur' ? 'bg-blue-100 text-blue-800 font-medium' :
                                            role === 'Étudiant' ? 'bg-green-100 text-green-800 font-medium' :
                                                'bg-indigo-100 text-indigo-800 font-medium'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                    <div className="mt-2 text-right">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={() => refreshUsers()}
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center">
                                    Utilisateur
                                    {getSortIcon('name')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('username')}
                            >
                                <div className="flex items-center">
                                    Nom d'utilisateur
                                    {getSortIcon('username')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('email')}
                            >
                                <div className="flex items-center">
                                    Email
                                    {getSortIcon('email')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center">
                                    Statut
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('role')}
                            >
                                <div className="flex items-center">
                                    Rôle
                                    {getSortIcon('role')}
                                </div>
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Modifier</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => {
                            const role = getUserRole(user.getUsername());
                            const isAdmin = role === 'Admin';
                            const isCurrentUser = currentUser ? user.getUsername() === currentUser.getUsername() : false;
                            const showEditButton = !isAdmin || isCurrentUser;

                            return (
                                <tr
                                    key={user.getId()}
                                    className={`
                                        hover:bg-gray-50 
                                        ${!user.isEnabled() ? 'bg-gray-50' : ''} 
                                        ${isAdmin ? 'bg-purple-50' : ''}
                                    `}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`
                                                flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                                                ${isAdmin ? 'bg-purple-200' : user.isEnabled() ? 'bg-gray-200' : 'bg-red-100'}
                                            `}>
                                                <UserCircle size={24} className={`
                                                    ${isAdmin ? 'text-purple-600' : user.isEnabled() ? 'text-gray-500' : 'text-red-500'}
                                                `} />
                                            </div>
                                            <div className="ml-4">
                                                <div className={`
                                                    text-sm font-medium 
                                                    ${isAdmin ? 'text-purple-900 font-semibold' : user.isEnabled() ? 'text-gray-900' : 'text-gray-500'}
                                                `}>
                                                    {user.getDisplayName()}
                                                    {isCurrentUser && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Vous</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`
                                            text-sm 
                                            ${isAdmin ? 'text-purple-700' : user.isEnabled() ? 'text-gray-900' : 'text-gray-500'}
                                        `}>@{user.getUsername()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{user.getEmail() || '—'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isEnabled() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.isEnabled() ? 'Actif' : 'Désactivé'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                role === 'Professeur' ? 'bg-blue-100 text-blue-800' :
                                                    role === 'Étudiant' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                        }`}>
                                            {role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {showEditButton && (
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className={`${isAdmin ? 'text-purple-600 hover:text-purple-900' : 'text-indigo-600 hover:text-indigo-900'}`}
                                            >
                                                Modifier
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {searchTerm.trim() !== '' || roleFilter !== null ? (
                                        <>
                                            <div className="flex justify-center mb-2">
                                                <Search size={24} />
                                            </div>
                                            <p>Aucun utilisateur ne correspond aux critères de recherche</p>
                                            <button
                                                className="mt-3 text-indigo-600 hover:text-indigo-800 underline"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setRoleFilter(null);
                                                    setShowInactive(true);
                                                }}
                                            >
                                                Réinitialiser tous les filtres
                                            </button>
                                        </>
                                    ) : (
                                        <p>Aucun utilisateur disponible</p>
                                    )}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
                <p>Les informations des utilisateurs sont synchronisées depuis Keycloak.</p>
                <p>Pour effectuer des modifications complètes, veuillez utiliser l'interface d'administration de Keycloak.</p>
            </div>

            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 overflow-hidden">
                        <div className={`p-4 text-white flex justify-between items-center ${
                            getUserRole(selectedUser.getUsername()) === 'Admin'
                                ? 'bg-gradient-to-r from-purple-600 to-purple-800'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-800'
                        }`}>
                            <h3 className="text-lg font-medium">
                                Gérer l'utilisateur: {selectedUser.getDisplayName()}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-white hover:text-gray-200 focus:outline-none"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Nom d'utilisateur</p>
                                    <p className="font-medium">{selectedUser.getUsername()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Nom complet</p>
                                    <p className="font-medium">
                                        {selectedUser.getFirstName() && selectedUser.getLastName()
                                            ? `${selectedUser.getFirstName()} ${selectedUser.getLastName()}`
                                            : "Non défini"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Email</p>
                                    <p className="font-medium">{selectedUser.getEmail() || "Non défini"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Statut</p>
                                    <p className={`font-medium ${selectedUser.isEnabled() ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedUser.isEnabled() ? 'Actif' : 'Désactivé'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                <p className="text-blue-700 text-sm">
                                    Les modifications sont synchronisées avec Keycloak.
                                    Pour des configurations avancées, utilisez la console d'administration Keycloak.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={toggleUserStatus}
                                    disabled={isUpdating}
                                    className={`flex items-center justify-center px-4 py-2 rounded-md
                                        ${selectedUser.isEnabled()
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    } transition-colors`}
                                >
                                    {selectedUser.isEnabled() ? (
                                        <>
                                            <UserX size={18} className="mr-2" />
                                            Désactiver l'utilisateur
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={18} className="mr-2" />
                                            Activer l'utilisateur
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={sendPasswordResetEmail}
                                    disabled={isUpdating || !selectedUser.getEmail()}
                                    className={`flex items-center justify-center px-4 py-2 rounded-md 
                                        bg-blue-100 text-blue-700 hover:bg-blue-200 
                                        ${(!selectedUser.getEmail() || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Mail size={18} className="mr-2" />
                                    Réinitialiser le mot de passe
                                </button>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <a
                                    href={getKeycloakUserLink(selectedUser.getId())}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-indigo-600 hover:text-indigo-800"
                                >
                                    <ExternalLink size={16} className="mr-1" />
                                    <span>
                                        Accéder à la configuration complète dans Keycloak
                                    </span>
                                </a>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                            <button
                                type="button"
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                onClick={closeModal}
                            >
                                Fermer
                            </button>
                        </div>

                        {isUpdating && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagementPage;