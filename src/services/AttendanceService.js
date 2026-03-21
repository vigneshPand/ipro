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

    // API: Fetch Calendar Attendance Status
    async getCalenderStatus(userId, from, to) {
        return await apiClient.get('/userActivity/getCalenderStatus', {
            params: { userId, from, to },
        });
    }

    // API: Fetch user activity by date (Table View for modal)
    async getUserActivityByDateTableView(userId, date) {
        return await apiClient.get('/checkInOutController/userActivityByDateTableView', {
            params: { userId, date },
        });
    }

    // API: Fetch regularization data for editing
    async getRegularizationDataEdit(date, userId) {
        return await apiClient.get('/checkInOutController/getRegularizationDataEdit', {
            params: { date, userId },
        });
    }

    // API: Validate shift timing hours
    async lessShiftTimingWarning(payload) {
        return await apiClient.post('/regularizationRecord/lessShiftTimingWarning', payload);
    }

    // API: Submit regularization
    async addInRegularization(date, payload) {
        return await apiClient.put('/regularizationRecord/addInRegularization', payload, {
            params: { date },
        });
    }
}

export default new AttendanceService();
