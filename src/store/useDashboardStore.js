import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  refreshWFH: false,
  refreshLeave: false,

  triggerWFHRefresh: () => set((s) => ({ refreshWFH: !s.refreshWFH })),
  triggerLeaveRefresh: () => set((s) => ({ refreshLeave: !s.refreshLeave })),
}));

export default useDashboardStore;
