import {useEffect, useState} from 'react';
import {useStore} from '../store';
import {
    ArrowLeft, Users, Search, UserCircle, ExternalLink, X, UserCheck, UserX, Mail, Filter,
    ChevronUp, ChevronDown, ChevronsUpDown, Loader, UserPlus, Lock, Key
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {UserType} from '../types';

type SortField = 'name' | 'username' | 'email' | 'status' | 'role';
type SortDirection = 'asc' | 'desc' | null;

interface NewUserForm {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    role: string;
    enabled: boolean;
}

export const UserManagementProfile = () => {
    const {
        currentUser,
        allUsers,
        loading,
        fetchAllUsers,
        updateUserStatus,
        sendPasswordResetEmail,
        createKeycloakUser
    } = useStore(state => ({
        currentUser: state.currentUser,
        allUsers: state.availableOrganizers,
        loading: {
            users: state.loading.organizers,
        },
        fetchAllUsers: state.fetchAllUsers,
        updateUserStatus: state.updateUserStatus,
        sendPasswordResetEmail: state.sendPasswordResetEmail,
        createKeycloakUser: state.createKeycloakUser
    }));

    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showInactive, setShowInactive] = useState(true);
    const [users, setUsers] = useState<UserType[]>([]);

    // New state for create user modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUserForm, setNewUserForm] = useState<NewUserForm>({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        enabled: true
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewUserForm, string>>>({});

    // État pour le tri
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // État pour le filtre de rôle
    const [roleFilter, setRoleFilter] = useState<string | null>(null);

    // Charger les utilisateurs depuis le store
    useEffect(() => {
        async function loadAllUsers() {
            try {
                setError(null);
                await fetchAllUsers();
            } catch (err) {
                setError('Impossible de charger la liste des utilisateurs');
                console.error('Error fetching users:', err);
            }
        }

        void loadAllUsers();
    }, [fetchAllUsers]);

    useEffect(() => {
        if (allUsers?.length > 0) {
            const adaptedUsers = allUsers.map(user => {
                const adaptedUser: UserType = {
                    getId: () => user.getId(),
                    getUsername: () => user.getUsername(),
                    getEmail: () => user.getEmail() ?? null,
                    getDisplayName: () => user.getDisplayName(),
                    getFirstName: () => user.getFirstName() ?? null,
                    getLastName: () => user.getLastName() ?? null,
                    isEnabled: () => user.isEnabled(),
                    getRoles: () => {
                        const username = user.getUsername();
                        const roles = [];
                        if (username.includes('admin')) roles.push('admin');
                        if (username.includes('prof')) roles.push('professor');
                        if (username.includes('etudiant')) roles.push('student');
                        if (username.includes('staff')) roles.push('staff');
                        if (username.includes('guest')) roles.push('guest');
                        if (roles.length === 0) roles.push('user');
                        return roles;
                    }
                };

                return adaptedUser;
            });

            setUsers(adaptedUsers);
        }
    }, [allUsers]);

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
    const sortUsers = (usersList: UserType[]) => {
        if (!sortField || !sortDirection) return usersList;

        return [...usersList].sort((a, b) => {
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
        if (sortField !== field) return <ChevronsUpDown size={14} className="ml-1 text-gray-400"/>;
        if (sortDirection === 'asc') return <ChevronUp size={14} className="ml-1 text-indigo-500"/>;
        if (sortDirection === 'desc') return <ChevronDown size={14} className="ml-1 text-indigo-500"/>;
        return <ChevronsUpDown size={14} className="ml-1 text-gray-400"/>;
    };

    // Fonction pour rafraîchir les utilisateurs après une modification
    const refreshUsers = async () => {
        try {
            await fetchAllUsers();
        } catch (err) {
            console.error('Error refreshing users:', err);
            setError('Impossible de rafraîchir la liste des utilisateurs');
        }
    };

    const handleEditClick = (user: UserType) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewUserForm({
            username: '',
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            confirmPassword: '',
            role: 'user',
            enabled: true
        });
        setFormErrors({});
    };

    const toggleUserStatus = async () => {
        if (!selectedUser) return;

        try {
            setIsUpdating(true);
            const newStatus = !selectedUser.isEnabled();

            await updateUserStatus(selectedUser.getId(), newStatus);

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

    const handleSendPasswordResetEmail = async () => {
        if (!selectedUser || !selectedUser.getEmail()) return;

        try {
            setIsUpdating(true);
            await sendPasswordResetEmail(selectedUser.getId());
            alert(`Un email de réinitialisation de mot de passe a été envoyé à ${selectedUser.getEmail()}`);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
            alert(`Erreur: Impossible d'envoyer l'email de réinitialisation.\n\nDétails techniques: ${error instanceof Error ? error.message : 'Erreur de communication avec le serveur'}\n\nVeuillez vérifier les configurations d'email dans Keycloak ou utiliser directement la console Keycloak.`);
        } finally {
            setIsUpdating(false);
        }
    };

    const getKeycloakUserLink = (userId: string) => {
        return `${import.meta.env.VITE_KEYCLOAK_URL}/admin/master/console/#/${import.meta.env.VITE_KEYCLOAK_REALM}/users/${userId}/settings`;
    };

    // Handle input change for new user form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        setNewUserForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));

        // Clear error for this field when user starts typing again
        if (formErrors[name as keyof NewUserForm]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    // Validate the form
    const validateForm = () => {
        const errors: Partial<Record<keyof NewUserForm, string>> = {};

        if (!newUserForm.username.trim()) {
            errors.username = "Le nom d'utilisateur est requis";
        } else if (newUserForm.username.includes(' ')) {
            errors.username = "Le nom d'utilisateur ne peut pas contenir d'espaces";
        }

        if (!newUserForm.email.trim()) {
            errors.email = "L'email est requis";
        } else if (!/^\S+@\S+\.\S+$/.test(newUserForm.email)) {
            errors.email = "Format d'email invalide";
        }

        if (!newUserForm.firstName.trim()) {
            errors.firstName = "Le prénom est requis";
        }

        if (!newUserForm.lastName.trim()) {
            errors.lastName = "Le nom de famille est requis";
        }

        if (!newUserForm.password) {
            errors.password = "Le mot de passe est requis";
        } else if (newUserForm.password.length < 8) {
            errors.password = "Le mot de passe doit contenir au moins 8 caractères";
        }

        if (newUserForm.password !== newUserForm.confirmPassword) {
            errors.confirmPassword = "Les mots de passe ne correspondent pas";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle create user form submission
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsCreating(true);

            // Construct the user object based on the form data
            const newUser = {
                username: newUserForm.username,
                email: newUserForm.email,
                firstName: newUserForm.firstName,
                lastName: newUserForm.lastName,
                password: newUserForm.password,
                role: newUserForm.role,
                enabled: newUserForm.enabled
            };

            // Call the createKeycloakUser function from your store
            await createKeycloakUser(newUser);

            // Refresh the user list
            await refreshUsers();

            // Close the modal and show success message
            closeCreateModal();
            alert(`L'utilisateur ${newUserForm.firstName} ${newUserForm.lastName} a été créé avec succès.`);
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de l\'utilisateur'}`);
        } finally {
            setIsCreating(false);
        }
    };

    // Liste des rôles pour les filtres
    const roles = ['Admin', 'Professeur', 'Étudiant', 'Personnel', 'Invité', 'User'];

    // Rôles disponibles pour la création d'utilisateur
    const availableRoles = [
        { id: 'user', label: 'Utilisateur standard' },
        { id: 'admin', label: 'Administrateur' },
        { id: 'professor', label: 'Professeur' },
        { id: 'student', label: 'Étudiant' },
        { id: 'staff', label: 'Personnel' },
        { id: 'guest', label: 'Invité' }
    ];

    // Affichage du chargement
    if (loading.users && users.length === 0) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-center items-center h-64">
                    <Loader className="h-12 w-12 text-blue-500 animate-spin"/>
                    <span className="ml-3 text-gray-600 text-lg">Chargement des utilisateurs...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link to="/profile" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20}/>
                    </Link>
                    <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mr-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                    >
                        <UserPlus size={18} className="mr-2" />
                        Créer un utilisateur
                    </button>
                    <div className="flex items-center text-sm text-gray-500">
                        <Users size={16} className="mr-1"/>
                        <span>{filteredUsers.length} utilisateurs</span>
                    </div>
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
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                    </div>

                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`flex items-center px-4 py-2 rounded-lg border ${
                            showInactive
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                    >
                        <Filter size={16} className="mr-2"/>
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
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"/>
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

            {loading.users && users.length > 0 ? (
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
                            const isCurrentUserView = currentUser ? user.getUsername() === currentUser.username : false;
                            const showEditButton = !isAdmin || isCurrentUserView;

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
                                                `}/>
                                            </div>
                                            <div className="ml-4">
                                                <div className={`
                                                    text-sm font-medium 
                                                    ${isAdmin ? 'text-purple-900 font-semibold' : user.isEnabled() ? 'text-gray-900' : 'text-gray-500'}
                                                `}>
                                                    {user.getDisplayName()}
                                                    {isCurrentUserView && <span
                                                        className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Vous</span>}
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
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isEnabled() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.isEnabled() ? 'Actif' : 'Désactivé'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                                                <Search size={24}/>
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
                <p>Pour effectuer des modifications complètes, veuillez utiliser l'interface d'administration de
                    Keycloak.</p>
            </div>

            {/* Modal Edit User */}
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
                                <X size={20}/>
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
                                    } transition-colors ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {selectedUser.isEnabled() ? (
                                        <>
                                            <UserX size={18} className="mr-2"/>
                                            Désactiver l'utilisateur
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={18} className="mr-2"/>
                                            Activer l'utilisateur
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSendPasswordResetEmail}
                                    disabled={isUpdating || !selectedUser.getEmail()}
                                    className={`flex items-center justify-center px-4 py-2 rounded-md 
                                        bg-blue-100 text-blue-700 hover:bg-blue-200 
                                        ${(!selectedUser.getEmail() || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Mail size={18} className="mr-2"/>
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
                                    <ExternalLink size={16} className="mr-1"/>
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
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Create User */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white flex justify-between items-center">
                            <h3 className="text-lg font-medium flex items-center">
                                <UserPlus size={20} className="mr-2"/>
                                Créer un nouvel utilisateur
                            </h3>
                            <button
                                onClick={closeCreateModal}
                                className="text-white hover:text-gray-200 focus:outline-none"
                            >
                                <X size={20}/>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6">
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom d'utilisateur *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            name="username"
                                            id="username"
                                            value={newUserForm.username}
                                            onChange={handleInputChange}
                                            className={`block w-full pr-10 sm:text-sm rounded-md
                                                ${formErrors.username
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }
                                            `}
                                            placeholder="john.doe"
                                        />
                                        {formErrors.username && (
                                            <div className="mt-1 text-sm text-red-600">
                                                {formErrors.username}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={newUserForm.email}
                                            onChange={handleInputChange}
                                            className={`block w-full pr-10 sm:text-sm rounded-md
                                                ${formErrors.email
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }
                                            `}
                                            placeholder="john.doe@example.com"
                                        />
                                        {formErrors.email && (
                                            <div className="mt-1 text-sm text-red-600">
                                                {formErrors.email}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Prénom *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            name="firstName"
                                            id="firstName"
                                            value={newUserForm.firstName}
                                            onChange={handleInputChange}
                                            className={`block w-full pr-10 sm:text-sm rounded-md
                                                ${formErrors.firstName
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }
                                            `}
                                            placeholder="John"
                                        />
                                        {formErrors.firstName && (
                                            <div className="mt-1 text-sm text-red-600">
                                                {formErrors.firstName}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom de famille *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            name="lastName"
                                            id="lastName"
                                            value={newUserForm.lastName}
                                            onChange={handleInputChange}
                                            className={`block w-full pr-10 sm:text-sm rounded-md
                                                ${formErrors.lastName
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }
                                            `}
                                            placeholder="Doe"
                                        />
                                        {formErrors.lastName && (
                                            <div className="mt-1 text-sm text-red-600">
                                                {formErrors.lastName}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Mot de passe *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="password"
                                            name="password"
                                            id="password"
                                            value={newUserForm.password}
                                            onChange={handleInputChange}
                                            className={`block w-full pr-10 sm:text-sm rounded-md
                                                ${formErrors.password
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }
                                            `}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <Key size={16} className="text-gray-400" />
                                        </div>
                                        {formErrors.password && (
                                            <div className="mt-1 text-sm text-red-600">
                                                {formErrors.password}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmation du mot de passe *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            id="confirmPassword"
                                            value={newUserForm.confirmPassword}
                                            onChange={handleInputChange}
                                            className={`block w-full pr-10 sm:text-sm rounded-md
                                                ${formErrors.confirmPassword
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }
                                            `}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <Lock size={16} className="text-gray-400" />
                                        </div>
                                        {formErrors.confirmPassword && (
                                            <div className="mt-1 text-sm text-red-600">
                                                {formErrors.confirmPassword}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                        Rôle
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={newUserForm.role}
                                        onChange={handleInputChange}
                                    >
                                        {availableRoles.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center h-full">
                                    <div className="flex items-center">
                                        <input
                                            id="enabled"
                                            name="enabled"
                                            type="checkbox"
                                            checked={newUserForm.enabled}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                                            Compte actif
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1 md:flex md:justify-between">
                                        <p className="text-sm text-blue-700">
                                            Le mot de passe doit contenir au moins 8 caractères. L'utilisateur pourra le changer ultérieurement.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                    disabled={isCreating}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader size={16} className="inline mr-2 animate-spin" />
                                            Création en cours...
                                        </>
                                    ) : (
                                        'Créer l\'utilisateur'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagementProfile;
