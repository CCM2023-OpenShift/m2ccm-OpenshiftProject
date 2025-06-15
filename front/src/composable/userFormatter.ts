/**
 * Formate un identifiant d'organisateur en nom lisible
 */
export const formatOrganizer = (organizer: string): string => {
    // Si le nom contient déjà un prénom et nom, le renvoyer tel quel
    if (organizer.includes(' ')) return organizer;

    // Déterminer le type d'utilisateur basé sur l'identifiant
    if (organizer.includes('admin')) return `Admin: ${organizer}`;
    if (organizer.includes('prof')) {
        // Convertir prof.nom en Pr. Nom (première lettre majuscule)
        const name = organizer.split('.')[1] || organizer;
        return `Pr. ${name.charAt(0).toUpperCase() + name.slice(1)}`;
    }
    if (organizer.includes('etudiant')) {
        // Convertir etudiant.nom en Étudiant: Nom
        const name = organizer.split('.')[1] || organizer;
        return `Étudiant: ${name.charAt(0).toUpperCase() + name.slice(1)}`;
    }
    if (organizer.includes('staff')) {
        const name = organizer.split('.')[1] || organizer;
        return `Staff: ${name.charAt(0).toUpperCase() + name.slice(1)}`;
    }

    // Par défaut, retourner l'identifiant
    return organizer;
};