import React, { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  UserCheck,
  Calendar,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import useDashboard from "@/api/dashboard/useDashboard";
import { Counters } from "@/api/types/dashboard";
import { useLocation } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const [counters, setCounters] = useState<Counters | null>(null);
  const { pathname } = useLocation();
  const { fetchDashboard } = useDashboard();

  useEffect(() => {
    fetchDashboard().then(setCounters).catch(console.error);
  }, [pathname]);

  // Mock Data
  // const stats = [
  //   { title: 'Pending Orders', value: 24, icon: <Package className="text-blue-600" />, trend: '+12%', trendUp: true },
  //   { title: 'Compliance Holds', value: 5, icon: <AlertTriangle className="text-red-600" />, trend: '-2', trendUp: true },
  //   { title: 'Active Consolidations', value: 8, icon: <TrendingUp className="text-purple-600" />, trend: 'Steady', trendUp: true },
  //   { title: 'Pending Revenue', value: '2,450', icon: <DollarSign className="text-green-600" />, trend: '+8%', trendUp: true },
  // ];

  const stats = counters
    ? [
        {
          title: "Total Deliveries",
          value: counters.total,
          icon: <Package className="text-blue-600" />,
        },
        {
          title: "Pending Deliveries",
          value: counters.pending,
          icon: <Clock className="text-orange-600" />,
        },
        {
          title: "Out for Delivery",
          value: counters.out,
          icon: <Truck className="text-purple-600" />,
        },
        {
          title: "Delivered Today",
          value: counters.today_deliveries.length,
          icon: <Calendar className="text-green-600" />,
        },
        {
          title: "Assigned for Delivery",
          value: counters.assigned,
          icon: <UserCheck className="text-indigo-600" />,
        },
        {
          title: "Delivered",
          value: counters.delivered,
          icon: <CheckCircle className="text-green-600" />,
        },
        {
          title: "Failed Deliveries",
          value: counters.failed,
          icon: <AlertTriangle className="text-red-600" />,
        },
      ]
    : [];

  const recentHwbs = [
    {
      id: "HWB-20250301-01",
      user: "Acme Corp",
      mawb: "MAWB-2025-001",
      status: "RECEIVED",
      date: "10 mins ago",
    },
    {
      id: "HWB-20250301-02",
      user: "John Doe",
      mawb: "-",
      status: "PENDING",
      date: "25 mins ago",
    },
    {
      id: "HWB-20250301-03",
      user: "Jane Smith",
      mawb: "MAWB-2025-002",
      status: "CONSOLIDATED",
      date: "1 hour ago",
    },
    {
      id: "HWB-20250301-04",
      user: "Global Trade Ltd",
      mawb: "-",
      status: "ON_HOLD",
      date: "2 hours ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">
          Operational Overview
        </h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition">
            Scan Package
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 transition">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {stat.value}
                </h3>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">{stat.icon}</div>
            </div>
            {/* Trend data is not available in the new API response, so it's commented out */}
            {/* <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
              </span>
              <span className="text-slate-400 ml-2">from last week</span>
            </div> */}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">
              Recent House Waybills (HWBs)
            </h3>
            <a
              href="#"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">
                    HWB Number
                  </th>
                  <th className="px-6 py-3 text-left font-medium">Client</th>
                  <th className="px-6 py-3 text-left font-medium">MAWB</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentHwbs.map((hwb) => (
                  <tr key={hwb.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {hwb.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {hwb.user}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">
                      {hwb.mawb}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={hwb.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 text-right">
                      {hwb.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Required */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Pending Actions</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3 bg-red-50 border border-red-100 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">
                    Compliance Hold
                  </h4>
                  <p className="text-xs text-red-600 mt-1">
                    HWB-9932 requires inspection. Lithium batteries suspected.
                  </p>
                  <button className="mt-2 text-xs font-semibold text-red-700 hover:text-red-800">
                    Review Case &rarr;
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md">
              <div className="flex items-start">
                <DollarSign className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Payment Verification
                  </h4>
                  <p className="text-xs text-yellow-600 mt-1">
                    3 large Sea Freight invoices pending manual check.
                  </p>
                  <button className="mt-2 text-xs font-semibold text-yellow-700 hover:text-yellow-800">
                    Verify Payments &rarr;
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-start">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Consolidation Ready
                  </h4>
                  <p className="text-xs text-blue-600 mt-1">
                    15 Air Freight HWBs ready for MAWB generation.
                  </p>
                  <button className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-800">
                    Create MAWB &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
