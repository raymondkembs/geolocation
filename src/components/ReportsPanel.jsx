import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getWeeklyBookingStats, getWeeklyEarningsStats, getIncomePerCleaner, getRatingsPerCleaner } from '../services/reportService';
import DataTable from './CleanerTableModal';
import BookIcon from '@mui/icons-material/Book';
import PaidIcon from '@mui/icons-material/Paid';
import StarIcon from '@mui/icons-material/Star';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

<button
  onClick={fetch}
  className="ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
>
  <ArrowPathIcon className="h-4 w-4" />
  Refresh
</button>


export default function ReportsPanel({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [weeklyBookings, setWeeklyBookings] = useState(new Array(7).fill(0));
  const [weeklyEarnings, setWeeklyEarnings] = useState(new Array(7).fill(0));
  const [incomePerCleaner, setIncomePerCleaner] = useState([]);
  const [ratingsPerCleaner, setRatingsPerCleaner] = useState([]);
  // Default to last 7 days to match dashboard weekly totals
  const defaultTo = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultTo.getDate() - 6);
  defaultFrom.setHours(0,0,0,0);
  defaultTo.setHours(23,59,59,999);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const fetch = async () => {
    setLoading(true);
    try {
      const wb = await getWeeklyBookingStats();
      const we = await getWeeklyEarningsStats();
      const inc = await getIncomePerCleaner(fromDate, toDate);
      const ratings = await getRatingsPerCleaner(fromDate, toDate);

      // Resolve cleaner names for nicer display
      let cleanerMap = {};
      try {
        const { getUsersByRole } = await import('../services/userService');
        const cleaners = await getUsersByRole('cleaner');
        cleanerMap = cleaners.reduce((m, c) => ({ ...m, [c.uid || c.id]: c }), {});
      } catch (e) {
        console.warn('Failed to fetch cleaners for name resolution', e);
      }

      setWeeklyBookings(wb);
      setWeeklyEarnings(we);
      setIncomePerCleaner(inc.map(i => ({ id: i.cleanerId, cleanerId: i.cleanerId, total: i.total, cleanerName: (cleanerMap[i.cleanerId]?.name || cleanerMap[i.cleanerId]?.fullName || cleanerMap[i.cleanerId]?.email || i.cleanerId) })));
      setRatingsPerCleaner(ratings.map(r => ({ ...r, cleanerName: (cleanerMap[r.cleanerId]?.name || cleanerMap[r.cleanerId]?.fullName || cleanerMap[r.cleanerId]?.email || r.cleanerId) })));
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [fromDate, toDate]);

  // Compose dataset for chart based on date range (day label = Mon 12)
  const dayLabels = [];
  const ptr = new Date(fromDate);
  while (ptr <= toDate) {
    const short = ptr.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    dayLabels.push(short);
    ptr.setDate(ptr.getDate() + 1);
  }

  const chartData = dayLabels.map((label, i) => ({
    day: label,
    bookings: weeklyBookings[i] || 0,
    earnings: weeklyEarnings[i] || 0
  }));

  const totalBookings = weeklyBookings.reduce((a,b) => a + Number(b || 0), 0);
  const totalEarnings = weeklyEarnings.reduce((a,b) => a + Number(b || 0), 0);
  const avgRating = ratingsPerCleaner.length ? (ratingsPerCleaner.reduce((a,r) => a + Number(r.average || 0), 0) / ratingsPerCleaner.length).toFixed(2) : '—';

  // Combine income and rating data for table
  const topCleaners = incomePerCleaner.map(i => {
    const r = ratingsPerCleaner.find(x => x.cleanerId === i.cleanerId) || {};
    return {
      id: i.cleanerId,
      cleanerId: i.cleanerId,
      cleanerName: i.cleanerName || i.cleanerId,
      total: i.total,
      average: Number(r.average || 0).toFixed(2),
      count: r.count || 0
    };
  }).sort((a,b) => b.total - a.total);

  return (
    <div className="p-4 ">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-end gap-4 w-full rounded-lg bg-slate-50 border border-gray-200 bg-white px-4 py-3 shadow-sm">
          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              From
            </label>
            <input
              type="date"
              className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={fromDate ? fromDate.toISOString().slice(0, 10) : ''}
              onChange={(e) =>
                setFromDate(e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              To
            </label>
            <input
              type="date"
              className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={toDate ? toDate.toISOString().slice(0, 10) : ''}
              onChange={(e) =>
                setToDate(
                  e.target.value ? new Date(e.target.value + 'T23:59:59') : null
                )
              }
            />
          </div>

          {/* Action */}
          <button
            onClick={fetch}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100 px-4 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 my-7">
        {/* Card */}
        <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex shadow-sm h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
              <BookIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Bookings
                <span className="ml-1 text-gray-400">(week)</span>
              </div>
              <div className="mt-0.5 text-2xl font-semibold text-indigo-700">
                {loading ? (
                  <span className="animate-pulse text-gray-300">—</span>
                ) : (
                  totalBookings
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex shadow-sm h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 ring-1 ring-inset ring-yellow-200">
              <PaidIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Revenue
                <span className="ml-1 text-gray-400">(week)</span>
              </div>
              <div className="mt-0.5 text-2xl font-semibold text-yellow-700">
                {loading ? (
                  <span className="animate-pulse text-gray-300">—</span>
                ) : (
                    new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES',
                    maximumFractionDigits: 0,
                  }).format(totalEarnings)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex shadow-sm h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 ring-1 ring-green-100">
              <StarIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Average Rating
              </div>
              <div className="mt-0.5 text-2xl font-semibold text-green-700">
                {avgRating}
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-4">

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Bookings vs Revenue
            </h3>
            <span className="text-xs text-gray-500">This week</span>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 24, left: 0, bottom: 24 }}
            >
              {/* Grid */}
              <CartesianGrid
                stroke="#E5E7EB"
                strokeDasharray="3 3"
                vertical={false}
              />

              {/* Axes */}
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />

              {/* Tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#374151', fontWeight: 500 }}
                formatter={(value, name) =>
                  name === 'earnings'
                    ? [`KSh ${value.toLocaleString()}`, 'Revenue']
                    : [value, 'Bookings']
                }
              />

              {/* Bars */}
              <Bar
                yAxisId="left"
                dataKey="bookings"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
                barSize={20}
              />

              {/* Line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="earnings"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f3f0ec' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>


        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="text-md font-semibold mb-2">Top Cleaners (by revenue)</h3>
          {topCleaners.length === 0 ? (
            <div className="text-sm text-gray-500">No data available</div>
          ) : (
            <DataTable
              columns={[
                { key: 'cleanerName', label: 'Cleaner' },
                { key: 'total', label: 'Total Income', cellClass: 'whitespace-nowrap text-right' },
                { key: 'average', label: 'Average Rating', cellClass: 'whitespace-nowrap' },
                { key: 'count', label: 'Rating Count', cellClass: 'whitespace-nowrap' }
              ]}
              data={topCleaners}
              exportFilename="top_cleaners.csv"
            />
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="text-md font-semibold mb-2">Ratings Overview</h3>
        <div className="text-sm text-gray-500 mb-2">Ratings per cleaner (average & count)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left">Cleaner</th>
                <th className="p-2 text-left">Average</th>
                <th className="p-2 text-left">Count</th>
              </tr>
            </thead>
            <tbody>
              {ratingsPerCleaner.map(r => (
                <tr key={r.cleanerId} className="border-b">
                  <td className="p-2">{r.cleanerName || r.cleanerId}</td>
                  <td className="p-2 whitespace-nowrap">{Number(r.average).toFixed(2)}</td>
                  <td className="p-2 whitespace-nowrap">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}