import api from './api';

class InventoryKardexService {
    static async getByProduct(productId) {
        const { data } = await api.get('/inventory-movements/kardex', {
            params: {
                productId
            }
        });

        return data;
    }
}

export default InventoryKardexService;
