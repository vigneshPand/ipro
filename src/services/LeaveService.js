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

    async getCCList(userId) {
        try {
            const response = await apiClient.get(`/projects/employees/${userId}/cc-list`);
            return response.data;
        } catch (error) {
            console.error('getCCList Error:', error);
            return [];
        }
    }

    async getNameList(userId) {
        try {
            const response = await apiClient.get(`/projects/employees/${userId}/managers/names`);
            return response.data;
        } catch (error) {
            console.error('getNameList Error:', error);
            return [];
        }
    }

    async getManagerInfo(emailId) {
        try {
            const response = await apiClient.get(`/userMasterController/getMyManager?emailId=${emailId}`);
            return response.data;
        } catch (error) {
            console.error('getManagerInfo Error:', error);
            return null;
        }
    }
}

export default new LeaveService();
