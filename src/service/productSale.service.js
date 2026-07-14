import api from './api';

class ProductSaleService {
    /**
     * 🛒 Registrar venta de productos
     */
    static async create(payload) {
        const { data } = await api.post('/product-sales', payload);

        return data;
    }
}

export default ProductSaleService;
