import { useKeycloak } from '@react-keycloak/web';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ReactNode } from 'react';

import { Dashboard } from './components/Dashboard';
import { RoomList } from './components/RoomList';
import { EquipmentList } from './components/EquipmentList';
import { BookingForm } from './components/BookingForm';
import { BookingHistory } from './components/BookingHistory';
import { BookingCalendar } from './components/BookingCalendar';
import { NotAuthorized } from './components/NotAuthorized';

import {LayoutGrid, Calendar, BookOpen, Monitor, History, UserIcon} from 'lucide-react';
import ProfilePage from "./components/ProfilePage.tsx";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { keycloak } = useKeycloak();
    const roles = keycloak.tokenParsed?.realm_access?.roles || [];
    const hasAccess = allowedRoles.some((role) => roles.includes(role));

    return hasAccess ? children : <Navigate to="/unauthorized" replace />;
}

function Sidebar() {
    const { keycloak } = useKeycloak();
    const roles = keycloak.tokenParsed?.realm_access?.roles || [];

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
        <div className="w-64 bg-white shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">Réservation</h1>
            <nav className="flex flex-col gap-2">
                <Link to="/" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <LayoutGrid className="w-5 h-5 mr-3" />
                    Tableau de bord
                </Link>

                <Link to="/profile" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <UserIcon className="w-5 h-5 mr-3" />
                    Mon profil
                </Link>

                {(hasRole('user') || hasRole('admin')) && (
                    <>
                        <Link to="/calendar" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Calendar className="w-5 h-5 mr-3" />
                            Calendrier
                        </Link>
                        <Link to="/history" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <History className="w-5 h-5 mr-3" />
                            Historique
                        </Link>
                        <Link to="/booking" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Calendar className="w-5 h-5 mr-3" />
                            Réserver
                        </Link>
                    </>
                )}
                {hasRole('admin') && (
                    <>
                        <Link to="/rooms" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <BookOpen className="w-5 h-5 mr-3" />
                            Salles
                        </Link>
                        <Link to="/equipment" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Monitor className="w-5 h-5 mr-3" />
                            Équipements
                        </Link>
                    </>
                )}
                <button
                    onClick={handleLogout}
                    className="mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                    Se déconnecter
                </button>
            </nav>
        </div>
    );
}

function App() {
    const { keycloak, initialized } = useKeycloak();

    if (!initialized) return <div>Chargement…</div>;
    if (!keycloak.authenticated) {
        void keycloak.login();
        return null;
    }

    return (
        <Router>
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1 p-4">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />

                        <Route path="/profile" element={<ProfilePage />} />

                        <Route
                            path="/calendar"
                            element={
                                <ProtectedRoute allowedRoles={['user', 'admin']}>
                                    <BookingCalendar />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/history"
                            element={
                                <ProtectedRoute allowedRoles={['user', 'admin']}>
                                    <BookingHistory />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking"
                            element={
                                <ProtectedRoute allowedRoles={['user', 'admin']}>
                                    <BookingForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/rooms"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <RoomList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/equipment"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <EquipmentList />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/unauthorized" element={<NotAuthorized />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
