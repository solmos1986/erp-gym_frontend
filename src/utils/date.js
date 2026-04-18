export function formatDate(date) {
    if (!date) return '-';

    return new Date(date).toLocaleString('es-BO', {
        timeZone: 'America/La_Paz'
    });
}
