/**
 * System Control Panel - Main Dashboard
 * 
 * SECURITY: Aggregated data only - NO sensitive patient information  
 * ACCESS: Admin users only via obscured /sys-control URL
 */

'use client';

import { useEffect, useState } from 'react';
// import { useAuth } from '@/hooks/useAuth';

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  totalAssessments: number;
  avgPatientsPerUser: number;
  scalesPopularity: Array<{
    name: string;
    count: number;
  }>;
}

interface FinanceMetrics {
  revenue: {
    dailyAverage: number;
    weeklyTotal: number;
    monthlyTotal: number;
    yearlyProjection: number;
  };
  subscriptions: {
    totalActive: number;
    newThisMonth: number;
    churnRate: number;
    renewalRate: number;
  };
  paymentMethods: {
    creditCard: number;
    paypal: number;
    bankTransfer: number;
    crypto: number;
    other: number;
  };
}

export default function AdminDashboard() {
  // const { getAccessToken } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [financeMetrics, setFinanceMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // const token = await getAccessToken();

      // Backend API URL - Use Next.js API Routes
      const apiBaseUrl = '';

      // Load platform statistics
      const [platformResponse, financeResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/analytics/platform-stats`, {
          headers: {
            // 'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${apiBaseUrl}/api/admin/analytics/finance-metrics`, {
          headers: {
            // 'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!platformResponse.ok || !financeResponse.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const platformData = await platformResponse.json();
      const financeData = await financeResponse.json();

      setPlatformStats(platformData.data);
      setFinanceMetrics(financeData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-4 text-gray-600">Loading admin dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">❌</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Platform overview and aggregated metrics (no sensitive patient data)
        </p>
      </div>

      {/* Platform Statistics */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">👥</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {platformStats.totalUsers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">✅</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {platformStats.activeUsers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🏥</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Patients
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {platformStats.totalPatients.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📊</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Assessments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {platformStats.totalAssessments.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finance Overview */}
      {financeMetrics && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Financial Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Daily Average</dt>
                <dd className="text-2xl font-semibold text-green-600">
                  ${financeMetrics.revenue.dailyAverage.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Monthly Total</dt>
                <dd className="text-2xl font-semibold text-green-600">
                  ${financeMetrics.revenue.monthlyTotal.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Active Subscriptions</dt>
                <dd className="text-2xl font-semibold text-blue-600">
                  {financeMetrics.subscriptions.totalActive.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Renewal Rate</dt>
                <dd className="text-2xl font-semibold text-blue-600">
                  {financeMetrics.subscriptions.renewalRate}%
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Scales */}
      {platformStats && platformStats.scalesPopularity.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Most Used Scales</h3>
            <div className="space-y-3">
              {platformStats.scalesPopularity.slice(0, 5).map((scale, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{scale.name}</span>
                  <span className="text-sm text-gray-500">{scale.count} uses</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/admin/analytics'}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-xl mb-2">📊</div>
              <div className="font-medium">Detailed Analytics</div>
              <div className="text-sm text-gray-500">View comprehensive metrics</div>
            </button>
            <button 
              onClick={() => window.location.href = '/admin/users'}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-xl mb-2">👥</div>
              <div className="font-medium">User Management</div>
              <div className="text-sm text-gray-500">View user statistics</div>
            </button>
            <button 
              onClick={() => window.location.href = '/admin/system'}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-xl mb-2">⚙️</div>
              <div className="font-medium">System Health</div>
              <div className="text-sm text-gray-500">Check system status</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}