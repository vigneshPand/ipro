import apiClient from '../api/client';

class AttendanceService {
    // Action: Check-In / Check-Out
    async checkInOut(payload) {
        return await apiClient.post('/checkInOutController/checkInOut', payload);
    }

    // API 1: Fetch Today's Activity
    async getUserLoginData(userId, date) {
        return await apiClient.get(`/checkInOutController/getUserLoginData`, {
            params: { userId, date }
        });
    }

    // API 2: Fetch Button State (Check-In or Check-Out)
    async checkEmployeeLastStatusOfToday(userId) {
        return await apiClient.get(`/checkInOutController/checkEmployeeLastStatusOfToday/${userId}`);
    }

}

export default new AttendanceService();
