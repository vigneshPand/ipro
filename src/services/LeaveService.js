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

    // --- Manager / Admin Flow ---

    async getManagerPendingLeaves(params) {
        try {
            const response = await apiClient.get('/leave/managerOrAdminPendingTable', { params });
            return response.data;
        } catch (error) {
            console.error('getManagerPendingLeaves Error:', error);
            throw error;
        }
    }

    async getManagerHistoryLeaves(params) {
        try {
            const response = await apiClient.get('/leave/managerOrAdminHistoryTable', { params });
            return response.data;
        } catch (error) {
            console.error('getManagerHistoryLeaves Error:', error);
            throw error;
        }
    }

    async getManagersDropDown(requestingUserId) {
        try {
            const response = await apiClient.get('/regularizationRecord/getManagersDropDown', {
                params: { requestingUserId, managersOnly: true }
            });
            // Assume response is array of { userId, displayName, mail }
            return response.data;
        } catch (error) {
            console.error('getManagersDropDown Error:', error);
            return [];
        }
    }

    async transferLeave(requestId, managerId) {
        try {
            const response = await apiClient.put(
                '/leave/transferTo',
                null,
                {
                    params: {
                        requestId,
                        managerId
                    }
                }
            );

            return {
                success: true,
                message: response?.data?.message || 'Transferred Successfully'
            };
        } catch (error) {
            console.error('transferLeave Error:', error);
            return {
                success: false,
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    'Error transferring leave'
            };
        }
    }

    async approveLeave(requestId, managerId) {
        try {
            const response = await apiClient.put(
                '/leave/approve',
                null,
                {
                    params: {
                        requestId,
                        managerId,
                        remarks: '' // No remarks for approval
                    }
                }
            );
            return {
                success: true,
                message: response?.data?.message || 'Approved Successfully'
            };
        } catch (error) {
            console.error('approveLeave Error:', error);
            return {
                success: false,
                message: error?.response?.data?.message || error?.message || 'Error approving leave'
            };
        }
    }

    async rejectLeave(requestId, managerId, remarks) {
        try {
            const response = await apiClient.put(
                '/leave/reject',
                null,
                {
                    params: {
                        requestId,
                        managerId,
                        remarks
                    }
                }
            );
            return {
                success: true,
                message: response?.data?.message || 'Rejected Successfully'
            };
        } catch (error) {
            console.error('rejectLeave Error:', error);
            return {
                success: false,
                message: error?.response?.data?.message || error?.message || 'Error rejecting leave'
            };
        }
    }
}

export default new LeaveService();
