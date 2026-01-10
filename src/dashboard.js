// src/dashboard.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCog } from "lucide-react";

import ModalPanel from "./components/ModalPanel";
import WeeklyGraph from "./components/WeeklyGraph";
import DataTable from "./components/DataTable";
import CleanerDetailModal from "./components/CleanerDetailModal";
import SidebarNav from "./components/SidebarNav";

import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";

import {
  getIncomePerCleaner,
  getRatingsPerCleaner
} from "./services/reportService";

import { firestore as db } from "./firebaseConfig";
import { updateBookingStatus } from "./services/bookingService";

import {
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

/** ---------- Helpers ---------- */

// Convert Firestore Timestamp / millis / ISO string to JS Date safely
function toDateSafe(ts) {
  if (!ts) return null;
  if (ts.toDate && typeof ts.toDate === "function") {
    return ts.toDate();
  }
  // number (seconds?) or milliseconds
  if (typeof ts === "number") {
    // Heuristic: if seconds (10-digit), convert to ms
    return ts < 1e12 ? new Date(ts * 1000) : new Date(ts);
  }
  // ISO string
  try {
    return new Date(ts);
  } catch {
    return null;
  }
}

// human readable time difference
function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// format currency KSH
function formatKsh(n) {
  if (n == null) return "Ksh 0";
  const v = Number(n) || 0;
  return `Ksh ${v.toLocaleString("en-KE")}`;
}

// status icon
function statusIcon(s) {
  if (!s) return "";
  const st = s.toLowerCase();
  if (st === "closed" || st === "completed") return "✔️";
  if (st === "pending") return "⏳";
  if (st === "accepted" || st === "in-progress" || st === "working" || st === "onjob") return "🔄";
  return "ℹ️";
}

// get start of today (local)
function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** ---------- Component ---------- */

export default function DashboardLayout() {
  const [current, setCurrent] = useState(0);

  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState("dashboard");

  // raw collections
  const [usersMap, setUsersMap] = useState({}); // id -> user
  const [cleaners, setCleaners] = useState([]); // array of cleaner users
  const [bookings, setBookings] = useState([]); // array of bookings
  const [payments, setPayments] = useState([]); // array of payments (if needed)

  // weekly stats
  const [weeklyBookings, setWeeklyBookings] = useState(new Array(7).fill(0));
  const [weeklyEarnings, setWeeklyEarnings] = useState(new Array(7).fill(0));

  // reports
  const [reports, setReports] = useState({
    incomePerCleaner: [],
    ratingsPerCleaner: []
  });

  // admin profile (fetched from users collection where role === 'admin')
  const [adminProfile, setAdminProfile] = useState(null);

  // modal selection
  const [selectedCleaner, setSelectedCleaner] = useState(null);

  // protect admin route
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) navigate("/");
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("adminSessionActive", "true");
  }, []);

  /** ---------- realtime: users (all) ---------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const map = {};
      const cleanersList = [];
      let admin = null;
      snap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        map[d.id] = data;
        if (data.role === "cleaner") cleanersList.push(data);
        if (!admin && data.role === "admin") admin = data;
      });
      setUsersMap(map);
      setCleaners(cleanersList);
      if (admin) setAdminProfile(admin);
    });
    return unsub;
  }, []);

  /** ---------- realtime: bookings ---------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bookings"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBookings(list);
    });
    return unsub;
  }, []);

  /** ---------- realtime: payments (if present) ---------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPayments(list);
    });
    return unsub;
  }, []);

  /** ---------- weekly stats calculation (last 7 days) ---------- */
  useEffect(() => {
    // compute last 7-day window (including today)
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6); // 6 days before today => 7-day window

    const bookingsArr = new Array(7).fill(0);
    bookings.forEach((b) => {
      const d = toDateSafe(b.createdAt || b.created_at || b.timestamp);
      if (!d) return;
      if (d < start || d > now) return;
      const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24)); // 0..6
      if (diffDays >= 0 && diffDays < 7) bookingsArr[diffDays] += 1;
    });
    setWeeklyBookings(bookingsArr);

    const earningsArr = new Array(7).fill(0);
    // use payments if present, else use bookings.price on bookings with paid status
    if (payments && payments.length > 0) {
      payments.forEach((p) => {
        const d = toDateSafe(p.createdAt || p.created_at || p.timestamp);
        if (!d) return;
        if (d < start || d > now) return;
        const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) earningsArr[diffDays] += Number(p.amount || 0);
      });
    } else {
      bookings.forEach((b) => {
        const d = toDateSafe(b.createdAt || b.created_at || b.timestamp);
        if (!d) return;
        if (d < start || d > now) return;
        // treat completed/closed/paid bookings as revenue
        if (["closed", "completed", "paid"].includes(String(b.status).toLowerCase())) {
          const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) earningsArr[diffDays] += Number(b.price || 0);
        }
      });
    }
    setWeeklyEarnings(earningsArr);
  }, [bookings, payments]);

  /** ---------- Reports loader (on demand) ---------- */
  const openReportsPanel = async () => {
    setActivePanel("reports");
    // We still use aggregated service functions for income/ratings
    const income = await getIncomePerCleaner();
    const ratings = await getRatingsPerCleaner();
    setReports({ incomePerCleaner: income, ratingsPerCleaner: ratings });
  };

  const endAdminSession = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminSessionActive");
    navigate("/");
  };

  // generic delete helper
  const handleDeleteDoc = async (collectionName, id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  // Columns for DataTable (kept simple)
  const cleanerColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "rating", label: "Rating" },
    { key: "category", label: "Category" }
  ];

  const bookingColumns = [
    { key: "customerId", label: "Customer ID" },
    { key: "cleanerId", label: "Cleaner ID" },
    { key: "price", label: "Price" },
    { key: "status", label: "Status" }
  ];

  /** ---------- Derived panels data ---------- */

  // find bookings with created date; sort descending by date
  const bookingsWithDate = useMemo(() => {
    return bookings
      .map((b) => {
        const d = toDateSafe(b.createdAt || b.created_at || b.timestamp);
        return { ...b, __date: d };
      })
      .sort((a, b) => {
        const da = a.__date ? a.__date.getTime() : 0;
        const db = b.__date ? b.__date.getTime() : 0;
        return db - da;
      });
  }, [bookings]);

  // 1) Last 3 completed jobs: status === "closed"
  const completedJobs = bookingsWithDate.filter((b) => String(b.status).toLowerCase() === "closed").slice(0, 3);

  // 2) Next 3 active jobs: pending, accepted, in-progress, working, onjob
  const activeJobs = bookingsWithDate.filter((b) => {
    const st = String(b.status || "").toLowerCase();
    return ["pending...", "accepted", "in-progress", "working", "onjob"].includes(st);
  }).slice(0, 3);

  // 3) Top 3 rated cleaners: derived from ratings collection (we'll compute locally from usersMap and bookings)
  // We'll compute ratings by scanning reports.ratingsPerCleaner (if available) else fallback to usersMap rating field
  const topCleaners = useMemo(() => {
    // try reports.ratingsPerCleaner first (structure {cleanerId, average, count})
    if (reports.ratingsPerCleaner && reports.ratingsPerCleaner.length > 0) {
      const arr = reports.ratingsPerCleaner
        .map((r) => {
          const user = usersMap[r.cleanerId] || {};
          const jobsCompleted = bookings.filter((b) => String(b.cleanerId) === String(r.cleanerId) && String(b.status).toLowerCase() === "closed").length;
          return {
            id: r.cleanerId,
            name: user.name || user.fullName || user.email || r.cleanerId,
            average: r.average || 0,
            count: r.count || 0,
            jobsCompleted
          };
        })
        .sort((a, b) => b.average - a.average)
        .slice(0, 3);
      return arr;
    }

    // fallback: use usersMap rating field
    const fallback = Object.values(usersMap)
      .filter((u) => u.role === "cleaner" && (u.rating || u.ratingCount))
      .map((u) => {
        const jobsCompleted = bookings.filter((b) => String(b.cleanerId) === String(u.id) && String(b.status).toLowerCase() === "closed").length;
        return {
          id: u.id,
          name: u.name || u.fullName || u.email || u.id,
          average: u.rating || 0,
          count: u.ratingCount || 0,
          jobsCompleted
        };
      })
      .sort((a, b) => b.average - a.average)
      .slice(0, 3);

    return fallback;
  }, [reports.ratingsPerCleaner, usersMap, bookings]);

  // helper to get user name by id
  const getUserName = (id) => {
    const u = usersMap[id];
    if (!u) return id || "Unknown";
    return u.name || u.fullName || u.email || id;
  };

  // helper to get booking customer name
  const getCustomerName = (booking) => {
    return getUserName(booking.customerId);
  };

  // admin profile display values (fetched from users collection where role === 'admin')
  const adminName = adminProfile?.name || adminProfile?.fullName || "Super Admin";
  const adminEmail = adminProfile?.email || "admin@domain.com";

  /** ---------- Render ---------- */
  

  // https://github.com/raymondkembs/geolocation.git
  return ( 
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-[20%] bg-white shadow-lg p-6 flex flex-col sticky top-0 h-screen gap-6">
        <div className="flex flex-col items-center text-center bg-white">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 p-[2px]">
              <img
                src="https://www.gravatar.com/avatar/?d=mp&s=200"
                alt="Admin Avatar"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>

            {/* Online indicator (optional) */}
            <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>

          {/* Name & Email */}
          <h2 className="text-base font-semibold text-gray-900">
            {adminName}
          </h2>
          <p className="text-sm text-gray-500 mb-4 truncate w-full">
            {adminEmail}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={endAdminSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                        bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              <UserCog size={14} />
              Edit
            </button>

            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                        bg-red-50 text-red-700 hover:bg-red-100 transition"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>


        <SidebarNav
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          openReportsPanel={openReportsPanel}
        />
         
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 p-8 flex flex-col gap-8">
        {/* Dashboard */}
        {activePanel === "dashboard" && (
          <>
            <section>
              <h3 className="mb-3 text-lg font-semibold text-gray-800">
                Dashboard Overview
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Bookings */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center justify-between">
                <div className="flex items-center justify-between w-full gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                      {bookings.length}
                    </h2>
                  </div>

                <div className="flex items-center justify-center shadow w-12 h-12 rounded-lg bg-blue-50 text-blue-600">
                  <CalendarDaysIcon className="w-6 h-6" />
                </div>
                </div>
              </div>

              {/* Cleaners */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center justify-between">
                <div className="flex items-center justify-between w-full gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registered Cleaners</p>
                    <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                      {cleaners.length}
                    </h2>
                  </div>
                  
                  <div className="flex items-center justify-center shadow w-12 h-12 rounded-lg bg-green-50 text-green-600">
                    <UserGroupIcon className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center justify-between">
                <div className="flex items-center justify-between w-full gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Weekly Revenue</p>
                    <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                        Ksh{" "}
                        {new Intl.NumberFormat("en-KE").format(
                          weeklyEarnings.reduce((a, b) => a + Number(b || 0), 0)
                        )}
                    </h2>
                  </div>
                        
                  <div className="flex items-center shadow justify-center w-12 h-12 rounded-lg bg-purple-50 text-purple-600">
                    <CurrencyDollarIcon className="w-6 h-6" />
                  </div>
                </div>
              </div>

            </div>
        </section>
            
              {/* Active Jobs */}
              <div className="bg-white p-4 rounded-2xl shadow h-48 overflow-auto">
                <h3 className="text-md font-semibold mb-3">Active Jobs</h3>
                {activeJobs.length === 0 && <p className="text-gray-400 text-sm">No active jobs at the moment</p>}
                {activeJobs.map((job) => {
                  const cleanerName = getUserName(job.cleanerId);
                  const customerName = getUserName(job.customerId);
                  const date = toDateSafe(job.createdAt || job.created_at || job.timestamp);
                  return (
                    <div key={job.id} className="flex items-center justify-between border-b py-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{cleanerName} • {customerName}</div>
                        <div className="text-xs text-gray-500">{timeAgo(date)} ago</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatKsh(job.price)}</div>
                        <div className="text-xs text-gray-500">{statusIcon(job.status)} {job.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* GRAPH */}
                <div className="bg-gray-50 shadow-xl rounded-2xl border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-900">
                      Weekly Performance
                    </h2>
                    <p className="text-sm text-gray-500">
                      Last 7 days overview
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                    <WeeklyGraph
                      title="Customers Served"
                      data={weeklyBookings}
                    />

                    <WeeklyGraph
                      title="Revenue Earned"
                      data={weeklyEarnings}
                      valuePrefix="$"
                    />
                  </div>
                </div>

              {/* Top Rated Cleaners */}
              <section>
              <h3 className="mb-3 text-lg font-semibold text-gray-800">
                Top Rated Cleaners
              </h3>
                <div className="bg-white p-4 rounded-2xl shadow h-48 ">
                  {topCleaners.length === 0 && <p className="text-gray-400 text-sm">Not enough rating data yet</p>}
                  {topCleaners.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 pr-2 pl-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.count} ratings</div>
                      </div>
                      <div className="text-right mx-6">
                        <div className="text-sm font-semibold text-gray-500">{c.jobsCompleted} jobs</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{Number(c.average).toFixed(1)} ⭐</div>
                      </div> 
                    </div>
                  ))}
                </div>
              </section>
            {/* </div> */}

{/* ----------------------------------------------SECTION TWO------------------------------- */}
          
            <section>
              <h3 className="mb-3 text-lg font-semibold text-gray-800">
                Recent Completed Jobs
              </h3>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm min-h-[220px]">
                {completedJobs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center px-6">
                    <div>
                      <p className="text-base font-medium text-gray-500">
                        No completed jobs yet
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Completed jobs will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-4 space-y-3">
                    {completedJobs.map((job) => {
                      const cleanerName = getUserName(job.cleanerId);
                      const date = toDateSafe(job.createdAt || job.created_at || job.timestamp);

                      return (
                        <div
                          key={job.id}
                          className="pl-2 pr-5"
                        >
                           
                          <div key={job.id} className="flex items-center justify-between border-b py-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{cleanerName}</div>
                              <div className="text-xs text-gray-500">{timeAgo(date)} ago</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatKsh(job.price)}</div>
                              <div className="text-xs text-gray-500">{statusIcon(job.status)} {job.status}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

          </>
        )}

        {/* CLEANERS panel */}
        {activePanel === "cleaners" && (
          <ModalPanel title="Cleaners" onClose={() => setActivePanel("dashboard")}>
            <DataTable
              columns={cleanerColumns}
              data={cleaners}
              onDelete={(id) => handleDeleteDoc("users", id)}
              onEdit={(row) => setSelectedCleaner(row)}
              exportFilename="cleaners.csv"
            />
          </ModalPanel>
        )}

        {/* CLEANER DETAIL */}
        {selectedCleaner && (
          <ModalPanel title="Cleaner Details" onClose={() => setSelectedCleaner(null)}>
            <CleanerDetailModal cleaner={selectedCleaner} onClose={() => setSelectedCleaner(null)} />
          </ModalPanel>
        )}

        {/* BOOKINGS panel */}
        {activePanel === "bookings" && (
          <ModalPanel title="Bookings" onClose={() => setActivePanel("dashboard")}>
            <DataTable
              columns={bookingColumns}
              data={bookings}
              onDelete={(id) => handleDeleteDoc("bookings", id)}
              onEdit={(row) => {
                const newStatus = prompt("Update status (pending, accepted, in-progress, closed, paid):", row.status);
                if (!newStatus) return;
                updateBookingStatus(row.id, newStatus);
              }}
              exportFilename="bookings.csv"
            />
          </ModalPanel>
        )}

        {/* REPORTS */}
        {activePanel === "reports" && (
          <ModalPanel title="Reports & Analytics" onClose={() => setActivePanel("dashboard")}>
            <h3 className="text-lg font-semibold mt-2 mb-2">Income Per Cleaner</h3>
            <DataTable
              columns={[
                { key: "cleanerId", label: "Cleaner ID" },
                { key: "total", label: "Total Income" }
              ]}
              data={reports.incomePerCleaner}
              exportFilename="income_per_cleaner.csv"
            />

            <h3 className="text-lg font-semibold mt-6 mb-2">Ratings Per Cleaner</h3>
            <DataTable
              columns={[
                { key: "cleanerId", label: "Cleaner ID" },
                { key: "average", label: "Average Rating" },
                { key: "count", label: "Rating Count" }
              ]}
              data={reports.ratingsPerCleaner}
              exportFilename="ratings_per_cleaner.csv"
            />
          </ModalPanel>
        )}

        {/* MAPS */}
        {activePanel === "maps" && (
          <ModalPanel title="Maps" onClose={() => setActivePanel("dashboard")}>
            <div className="h-64 flex items-center justify-center text-gray-500">Map Integration Placeholder</div>
          </ModalPanel>
        )}

        {/* CONVERSATIONS */}
        {activePanel === "conversations" && (
          <ModalPanel title="Conversations" onClose={() => setActivePanel("dashboard")}>
            <div className="h-64 flex items-center justify-center text-gray-500">Chat Logs / Conversations Placeholder</div>
          </ModalPanel>
        )}

      </main>
    </div>
  );
}
