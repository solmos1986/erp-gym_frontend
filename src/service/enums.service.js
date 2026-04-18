import api from '../service/api';

class enumsService {
    static async getProductTypes() {
        const response = await api.get('/enums/product-types');
        return response.data;
    }
}

export default enumsService;
