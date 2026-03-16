import apiClient from '../api/client';

class LeaveService {
    async getValidLeaveDates({ from, to, userId, leaveType, bereavementLeaveType, maternityLeaveCategory }) {
        try {
            const params = { from, to, userId, leaveType };
            if (bereavementLeaveType !== undefined) {
                params.bereavementLeaveType = bereavementLeaveType;
            }
            if (maternityLeaveCategory !== undefined) {
                params.maternityLeaveCategory = maternityLeaveCategory;
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

    async getParentalLeaveCategories(type) {
        try {
            const response = await apiClient.get(`/leave/findParentalLeaveCategories?type=${encodeURIComponent(type)}`);
            return response.data;
        } catch (error) {
            console.error('getParentalLeaveCategories Error:', error);
            return null;
        }
    }

    async getHRList() {
        try {
            const response = await apiClient.get('/user-roles/list/hr');
            return response.data;
        } catch (error) {
            console.error('getHRList Error:', error);
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

    async submitPermissionRequest(payload) {
        try {
            const response = await apiClient.post("/leave/permissionRequest", null, {
                params: payload,
            });
            return {
                success: true,
                message: response?.data?.message || response?.data || 'Permission request submitted successfully',
            };
        } catch (error) {
            const message = error?.response?.data?.message || error?.response?.data || error?.message || 'Error submitting permission request';
            return {
                success: false,
                message: typeof message === 'string' ? message : JSON.stringify(message),
            };
        }
    }
}

export default new LeaveService();
