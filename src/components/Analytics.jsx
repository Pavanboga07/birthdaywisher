import React, { useState, useEffect } from 'react';
import { TrendingUp, Mail, Users, Calendar, BarChart3, Clock, CheckCircle, XCircle, Inbox } from 'lucide-react';

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const summaryData = await window.electronAPI.getAnalyticsSummary();
      const daily = await window.electronAPI.getDailyAnalytics(30);
      const monthly = await window.electronAPI.getMonthlyAnalytics(12);
      const queue = await window.electronAPI.getQueueStats();
      
      setSummary(summaryData);
      setDailyStats(daily);
      setMonthlyStats(monthly);
      setQueueStats(queue);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your birthday reminders and email performance
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards - All Time Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">📊 All Time Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Mail className="w-6 h-6" />}
            title="Total Emails Sent"
            value={summary?.totals?.emailsSent || 0}
            color="bg-green-500"
            subtitle="Successfully delivered"
          />
          <StatCard
            icon={<XCircle className="w-6 h-6" />}
            title="Failed Emails"
            value={summary?.totals?.emailsFailed || 0}
            color="bg-red-500"
            subtitle="Delivery failed"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Birthdays Celebrated"
            value={summary?.totals?.birthdays || 0}
            color="bg-blue-500"
            subtitle="Total celebrations"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Contacts Added"
            value={summary?.totals?.contactsAdded || 0}
            color="bg-purple-500"
            subtitle="All time contacts"
          />
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            ✅ Email Success Rate
          </h3>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            {summary?.totals?.successRate || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${summary?.totals?.successRate || 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {summary?.totals?.emailsSent || 0} successful out of {(summary?.totals?.emailsSent || 0) + (summary?.totals?.emailsFailed || 0)} total emails
        </p>
      </div>

      {/* Current Month Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">📅 This Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Mail className="w-6 h-6" />}
            title="Emails Sent"
            value={summary?.currentMonth?.emailsSent || 0}
            color="bg-indigo-500"
            subtitle="This month"
          />
          <StatCard
            icon={<XCircle className="w-6 h-6" />}
            title="Failed"
            value={summary?.currentMonth?.emailsFailed || 0}
            color="bg-orange-500"
            subtitle="This month"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Birthdays"
            value={summary?.currentMonth?.birthdays || 0}
            color="bg-pink-500"
            subtitle="This month"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="New Contacts"
            value={summary?.currentMonth?.contactsAdded || 0}
            color="bg-teal-500"
            subtitle="This month"
          />
        </div>
      </div>

      {/* Last 7 Days Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">📈 Last 7 Days</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Mail className="w-6 h-6" />}
            title="Emails Sent"
            value={summary?.last7Days?.emailsSent || 0}
            color="bg-cyan-500"
            subtitle="Past week"
          />
          <StatCard
            icon={<XCircle className="w-6 h-6" />}
            title="Failed"
            value={summary?.last7Days?.emailsFailed || 0}
            color="bg-amber-500"
            subtitle="Past week"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Birthdays"
            value={summary?.last7Days?.birthdays || 0}
            color="bg-rose-500"
            subtitle="Past week"
          />
        </div>
      </div>

      {/* Email Queue Status */}
      {queueStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Inbox className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Email Queue Status
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {queueStats.pending || 0}
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">Pending</p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {queueStats.sent || 0}
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">Sent</p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {queueStats.failed || 0}
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">Failed</p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <Inbox className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {queueStats.total || 0}
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">Total</p>
            </div>
          </div>

          {queueStats.rateLimits && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Rate Limits</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-600 dark:text-blue-400">This Minute</p>
                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                    {queueStats.rateLimits.emailsThisMinute} / {queueStats.rateLimits.maxPerMinute}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 dark:text-blue-400">This Hour</p>
                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                    {queueStats.rateLimits.emailsThisHour} / {queueStats.rateLimits.maxPerHour}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Monthly Email Trends
          </h3>
        </div>
        
        {monthlyStats.length > 0 ? (
          <div className="space-y-3">
            {monthlyStats.slice(0, 6).map((month, index) => {
              const total = month.emails_sent + month.emails_failed;
              const successRate = total > 0 ? (month.emails_sent / total * 100).toFixed(0) : 0;
              
              return (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getMonthName(month.month)} {month.year}
                    </span>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="text-green-600 dark:text-green-400 font-semibold">{month.emails_sent}</span>
                      {' / '}
                      <span className="text-red-600 dark:text-red-400">{month.emails_failed}</span>
                      {' • '}
                      <span className="text-blue-600 dark:text-blue-400">{successRate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${total > 0 ? (month.emails_sent / Math.max(...monthlyStats.map(m => m.emails_sent + m.emails_failed)) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No monthly data available yet
          </p>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, color, subtitle }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: color.replace('bg-', '') }}>
      <div className="flex items-center justify-between mb-3">
        <div className={`${color} p-3 rounded-lg text-white`}>
          {icon}
        </div>
        <span className="text-3xl font-bold text-gray-800 dark:text-white">{value}</span>
      </div>
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

// Utility function to get month name
function getMonthName(month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

export default Analytics;
