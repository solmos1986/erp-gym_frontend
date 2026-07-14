import api from './api';

class ReportService {
    static async getSales(params) {
        const { data } = await api.get('/reports/sales', { params });

        return data;
    }
}

export default ReportService;
