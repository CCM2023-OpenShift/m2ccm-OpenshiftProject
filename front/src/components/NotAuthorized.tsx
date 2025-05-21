export function NotAuthorized() {
    return (
        <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Accès refusé</h1>
            <p className="text-gray-700">Vous n’avez pas les droits nécessaires pour accéder à cette page.</p>
        </div>
    );
}
