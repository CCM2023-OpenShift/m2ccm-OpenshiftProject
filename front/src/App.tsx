import {useKeycloak} from '@react-keycloak/web';
import {BrowserRouter as Router, Routes, Route, Navigate, Link} from 'react-router-dom';
import {ReactNode, useState} from 'react';

import {Dashboard} from './components/Dashboard';
import {RoomList} from './components/RoomList';
import {EquipmentList} from './components/EquipmentList';
import {BookingForm} from './components/BookingForm';
import {BookingHistory} from './components/BookingHistory';
import {BookingCalendar} from './components/BookingCalendar';
import {NotAuthorized} from './components/NotAuthorized';
import {RoomFinder} from './components/RoomFinder';

import {LayoutGrid, Calendar, BookOpen, Monitor, History, Users, Search, LogOut} from 'lucide-react';
import ProfilePage from "./components/ProfilePage.tsx";
import UserManagementPage from "./components/UserManagementProfile.tsx";
import NotificationCenter from "./components/NotificationCenter.tsx";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

function ProtectedRoute({children, allowedRoles}: ProtectedRouteProps) {
    const {keycloak} = useKeycloak();
    const roles = keycloak.tokenParsed?.realm_access?.roles || [];
    const hasAccess = allowedRoles.some((role) => roles.includes(role));

    return hasAccess ? children : <Navigate to="/unauthorized" replace/>;
}

function Sidebar() {
    const {keycloak} = useKeycloak();
    const roles = keycloak.tokenParsed?.realm_access?.roles || [];
    const [showUserMenu, setShowUserMenu] = useState(false);

    const hasRole = (role: string): boolean => roles.includes(role);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();

        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name.includes('KEYCLOAK') || name.includes('KC_')) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        });

        const logoutOptions = {
            redirectUri: window.location.origin,
            idToken: keycloak.idToken
        };

        if (keycloak.authServerUrl) {
            const logoutUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/logout`;

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = logoutUrl;

            if (keycloak.idToken) {
                const idTokenInput = document.createElement('input');
                idTokenInput.type = 'hidden';
                idTokenInput.name = 'id_token_hint';
                idTokenInput.value = keycloak.idToken;
                form.appendChild(idTokenInput);
            }

            const redirectInput = document.createElement('input');
            redirectInput.type = 'hidden';
            redirectInput.name = 'post_logout_redirect_uri';
            redirectInput.value = window.location.origin;
            form.appendChild(redirectInput);

            document.body.appendChild(form);
            form.submit();
            return;
        }

        void keycloak.logout(logoutOptions);
    };

    return (
        <div className="w-64 bg-white shadow-md flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-2xl font-bold text-gray-800">Réservation</h1>
                <div className="flex items-center">
                    <NotificationCenter />
                    <div className="relative ml-4">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {keycloak.tokenParsed?.preferred_username?.[0]?.toUpperCase() || 'U'}
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg z-20">
                                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                    Connecté en tant que <strong>{keycloak.tokenParsed?.preferred_username}</strong>
                                </div>
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setShowUserMenu(false)}
                                >
                                    Mon profil
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <span className="flex items-center">
                                        <LogOut size={16} className="mr-2"/>
                                        Se déconnecter
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-2 py-4 overflow-y-auto">
                <div className="space-y-1">
                    <Link to="/" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <LayoutGrid className="w-5 h-5 mr-3"/>
                        Tableau de bord
                    </Link>

                    {(hasRole('user') || hasRole('admin')) && (
                        <>
                            <Link to="/find-room"
                                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Search className="w-5 h-5 mr-3"/>
                                Rechercher une salle
                            </Link>

                            <Link to="/calendar"
                                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Calendar className="w-5 h-5 mr-3"/>
                                Calendrier
                            </Link>
                            <Link to="/history"
                                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <History className="w-5 h-5 mr-3"/>
                                Historique
                            </Link>
                            <Link to="/booking"
                                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Calendar className="w-5 h-5 mr-3"/>
                                Réserver
                            </Link>
                        </>
                    )}
                </div>

                {hasRole('admin') && (
                    <div className="mt-8">
                        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Administration
                        </h3>
                        <div className="mt-2 space-y-1">
                            <Link to="/admin/users"
                                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Users className="w-5 h-5 mr-3"/>
                                Gestion utilisateurs
                            </Link>
                            <Link to="/rooms"
                                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <BookOpen className="w-5 h-5 mr-3"/>
                                Salles
                            </Link>
                            <Link to="/equipment"
                                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Monitor className="w-5 h-5 mr-3"/>
                                Équipements
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}

function App() {
    const {keycloak, initialized} = useKeycloak();

    if (!initialized) return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    if (!keycloak.authenticated) {
        void keycloak.login();
        return null;
    }

    return (
        <Router>
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar/>
                <div className="flex-1 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard/>}/>
                        <Route path="/profile" element={<ProfilePage/>}/>

                        <Route
                            path="/find-room"
                            element={
                                <ProtectedRoute allowedRoles={['user', 'admin']}>
                                    <RoomFinder/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar"
                            element={
                                <ProtectedRoute allowedRoles={['user', 'admin']}>
                                    <BookingCalendar/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/history"
                            element={
                                <ProtectedRoute allowedRoles={['user', 'admin']}>
                                    <BookingHistory/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking"
                            element={
                                <ProtectedRoute allowedRoles={['user', 'admin']}>
                                    <BookingForm/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/rooms"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <RoomList/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/equipment"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <EquipmentList/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <UserManagementPage/>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/unauthorized" element={<NotAuthorized/>}/>
                        <Route path="*" element={<Navigate to="/"/>}/>
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;