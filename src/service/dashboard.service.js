import api from './api';

class DashboardService {
    //////////////////////////////////////
    // 📋 SUMMARY
    //////////////////////////////////////
    static async getSummary() {
        const { data } = await api.get('/dashboard/summary');

        return data;
    }

    //////////////////////////////////////
    // 📈 SALES LAST 7 DAYS
    //////////////////////////////////////
    static async getSalesLast7Days() {
        const { data } = await api.get('/dashboard/sales-last-7-days');

        return data;
    }

    //////////////////////////////////////
    // 💰 REVENUE COMPARISON
    //////////////////////////////////////
    static async getRevenueComparison() {
        const { data } = await api.get('/dashboard/revenue-comparison');

        return data;
    }

    //////////////////////////////////////
    // 📅 REGISTRATIONS COMPARISON
    //////////////////////////////////////
    static async getRegistrationsComparison() {
        const { data } = await api.get('/dashboard/registrations-comparison');

        return data;
    }

    //////////////////////////////////////
    // 🍩 PLAN DISTRIBUTION
    //////////////////////////////////////
    static async getPlanDistribution() {
        const { data } = await api.get('/dashboard/plan-distribution');

        return data;
    }
}

export default DashboardService;
