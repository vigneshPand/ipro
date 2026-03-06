import apiClient from '../api/client';

class LeaveService {
    async getValidLeaveDates({ from, to, userId, leaveType, bereavementLeaveType }) {
        try {
            const params = { from, to, userId, leaveType };
            if (bereavementLeaveType !== undefined) {
                params.bereavementLeaveType = bereavementLeaveType;
            }

            const response = await apiClient.get('/leave/getValidDates', {
                params,
            });
            return response.data;
        } catch (error) {
            console.error('getValidLeaveDates Error:', error);
            // If the backend returns a validation message, throw it so the caller can display it
            const message = error?.response?.data?.message || error?.response?.data;
            if (message && typeof message === 'string') {
                throw new Error(message);
            }
            return [];
        }
    }

    async getBereavementLeaveTypes() {
        try {
            const response = await apiClient.get('/leave/bereavementLeaveTypes');
            return response.data;
        } catch (error) {
            console.error('getBereavementLeaveTypes Error:', error);
            return [];
        }
    }
}

export default new LeaveService();
