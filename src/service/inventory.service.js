import api from './api';

class InventoryService {
    //////////////////////////////////////
    // 📊 DASHBOARD
    //////////////////////////////////////
    static async getDashboard() {
        const { data } = await api.get('/inventory/dashboard');

        return data;
    }

    //////////////////////////////////////
    // ⚠️ BAJO STOCK
    //////////////////////////////////////
    static async getLowStock() {
        const { data } = await api.get('/inventory/low-stock');

        return data;
    }

    //////////////////////////////////////
    // 📋 MOVIMIENTOS RECIENTES
    //////////////////////////////////////
    static async getRecentMovements(limit = 5) {
        const { data } = await api.get('/inventory/recent-movements', {
            params: { limit }
        });

        return data;
    }

    //////////////////////////////////////
    // 💰 VALORIZACIÓN
    //////////////////////////////////////
    static async getValuation() {
        const { data } = await api.get('/inventory/valuation');

        return data;
    }

    //////////////////////////////////////
    // 🏆 TOP PRODUCTOS
    //////////////////////////////////////
    static async getTopProducts(limit = 5) {
        const { data } = await api.get('/inventory/top-products', {
            params: { limit }
        });

        return data;
    }

    //////////////////////////////////////
    // 📈 RENTABILIDAD PRODUCTOS
    //////////////////////////////////////
    static async getProductProfitability(params = {}) {
        const { data } = await api.get('/inventory/product-profitability', {
            params
        });

        return data;
    }

    //////////////////////////////////////
    // 💵 RENTABILIDAD GENERAL
    //////////////////////////////////////
    static async getGeneralProfitability(params = {}) {
        const { data } = await api.get('/inventory/general-profitability', {
            params
        });

        return data;
    }

    //////////////////////////////////////
    // 📒 KARDEX
    //////////////////////////////////////
    static async getKardex(params = {}) {
        const { data } = await api.get('/inventory/kardex', {
            params
        });

        return data;
    }

    //////////////////////////////////////
    // 📦 PRODUCTOS
    //////////////////////////////////////
    static async getProducts() {
        const { data } = await api.get('/products', {
            params: {
                isActive: true
            }
        });

        return data;
    }
}

export default InventoryService;
