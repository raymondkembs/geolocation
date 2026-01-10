// src/components/WeeklyGraph.jsx
import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">
          {payload[0].value} customers
        </p>
      </div>
    );
  }
  return null;
};

export default function WeeklyGraph({ title, data = [] }) {
  const formatted = DAYS.map((d, i) => ({
    day: d,
    value: data[i] ?? 0,
  }));

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 h-72">
      <h3 className="text-sm font-medium text-gray-900 mb-4">
        {title}
      </h3>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={formatted}
          margin={{ top: 5, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#E5E7EB"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#2d95c2"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#ffffff" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

