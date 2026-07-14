import api from './api';

class StockService {
    /**
     * 📋 Listar productos
     */
    static async getAll() {
        const { data } = await api.get('/inventory-movements/stock');
        return data;
    }
}

export default StockService;
