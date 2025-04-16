import React from 'react';
import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { RoomList } from './components/RoomList';
import { BookingForm } from './components/BookingForm';
import { LayoutGrid, Calendar, BookOpen } from 'lucide-react';

function App() {
    const [currentPage, setCurrentPage] = useState<'dashboard' | 'rooms' | 'booking'>('dashboard');

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'rooms':
                return <RoomList />;
            case 'booking':
                return <BookingForm />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
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
                            <LayoutGrid className="w-5 h-5 mr-3" />
                            Tableau de bord
                        </button>
                        <button
                            onClick={() => setCurrentPage('rooms')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'rooms'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <BookOpen className="w-5 h-5 mr-3" />
                            Salles
                        </button>
                        <button
                            onClick={() => setCurrentPage('booking')}
                            className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
                                currentPage === 'booking'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Calendar className="w-5 h-5 mr-3" />
                            Réserver
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1">
                {renderPage()}
            </div>
        </div>
    );
}

export default App;