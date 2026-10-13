import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { DashboardScreen } from '../../components/DashboardScreen';

// Mock the useDashboard hook

afterEach(() => {
  cleanup();
});
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: () => ({
    data: {
      revenue_this_month: 1000000,
      active_memberships_count: 5,
      expiring_within_7_days_count: 2,
      daily_revenue_30_days: [],
      check_in_frequency_by_hour: [],
      peak_check_in_hour: null,
    },
    loading: false,
    error: null,
    load: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('DashboardScreen', () => {
  it('renders AnalyticsCharts for admin users', () => {
    render(<DashboardScreen currentStaff={null} />); // null means admin per component logic
    const chartHeader = screen.getByText(/Phân tích & Thống kê Kinh doanh/i);
    expect(chartHeader).toBeInTheDocument();
  });
    cleanup();

  it('does not render AnalyticsCharts for non‑admin staff', () => {
    const staff = { role: 'staff' } as any;
    render(<DashboardScreen currentStaff={staff} />);
    const chartHeader = screen.queryByText(/Phân tích & Thống kê Kinh doanh/i);
    expect(chartHeader).not.toBeInTheDocument();
  });
});
