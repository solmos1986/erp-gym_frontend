export function formatDate(date) {
    if (!date) return '-';

    return new Date(date).toLocaleString('es-BO', {
        timeZone: 'America/La_Paz'
    });
}
export function formatDateTimeNoTZ(date) {
    if (!date) return '-';

    return new Date(date).toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',

        hour: '2-digit',
        minute: '2-digit',

        hour12: false
    });
}
export function formatDateTimeNoTZ2(date) {
    if (!date) return '-';

    return new Date(date).toLocaleString('es-BO', {
        timeZone: 'America/La_Paz',

        day: '2-digit',
        month: '2-digit',
        year: 'numeric',

        hour: '2-digit',
        minute: '2-digit',

        hour12: false
    });
}
