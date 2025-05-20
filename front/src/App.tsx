import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { RoomList } from './components/RoomList';
import { EquipmentList } from './components/EquipmentList';
import { BookingForm } from './components/BookingForm';
//import { Login } from './components/Login';
import { BookingHistory } from './components/BookingHistory';
import { BookingCalendar } from './components/BookingCalendar';
import { LayoutGrid, Calendar, BookOpen, Monitor, History } from 'lucide-react';
import { useKeycloak } from '@react-keycloak/web';

function App() {
    const { keycloak, initialized } = useKeycloak();
    const [currentPage, setCurrentPage] = useState<'dashboard' | 'rooms' | 'equipment' | 'booking' | 'history' | 'calendar' >('dashboard');

    if (!initialized) return <div>Chargement…</div>;
    if (!keycloak.authenticated) {
        keycloak.login();
        return null;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'rooms':
                return <RoomList />;
            case 'equipment':
                return <EquipmentList />;
            case 'booking':
                return <BookingForm />;
            case 'history':
                return <BookingHistory />;
            case 'calendar':
                return <BookingCalendar />;
            default:
                return <Dashboard />;
        }
    };

    // if (!isAuthenticated) {
    //     return <Login onLogin={handleLogin} />;
    // }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <div className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-8">Réservation</h1>
                    <nav>
                        <button
                            onClick={() => setCurrentPage('dashboard')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'dashboard'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <LayoutGrid className="w-5 h-5 mr-3"/>
                            Tableau de bord
                        </button>
                        <button
                            onClick={() => setCurrentPage('calendar')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'booking'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Calendar className="w-5 h-5 mr-3"/>
                            Calendrier des réservations
                        </button>
                        <button
                            onClick={() => setCurrentPage('history')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'history'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <History className="w-5 h-5 mr-3"/>
                            Historique
                        </button>
                        <button
                            onClick={() => setCurrentPage('rooms')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'rooms'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <BookOpen className="w-5 h-5 mr-3"/>
                            Salles
                        </button>
                        <button
                            onClick={() => setCurrentPage('equipment')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'equipment'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Monitor className="w-5 h-5 mr-3"/>
                            Équipements
                        </button>
                        <button
                            onClick={() => setCurrentPage('booking')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'booking'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Calendar className="w-5 h-5 mr-3"/>
                            Réserver
                        </button>
                    </nav>
                </div>
            </div>
            <div className="flex-1">{renderPage()}</div>
        </div>
    );
}

const SidebarButton = ({ label, icon, page, currentPage, setCurrentPage }) => (
    <button
        onClick={() => setCurrentPage(page)}
        className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
            currentPage === page ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        <span className="w-5 h-5 mr-3">{icon}</span>
        {label}
    </button>
);

export default App;