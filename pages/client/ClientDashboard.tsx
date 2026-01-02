import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  Search,
  Plus,
  DollarSign,
  Globe,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { AuthUser } from "@/api/types/auth";
import useAuth from "@/api/auth/useAuth";
import useCargo from "@/api/cargo/useCargo";
import { useToast } from "@/context/ToastContext";
import { CargoDeclaration } from "@/api/types/cargo";

const ClientDashboard: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { getUserProfile } = useAuth();
  const [packages, setPackages] = useState<CargoDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const { listCargoDeclarations } = useCargo();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserProfile();
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const response = await listCargoDeclarations();
        setPackages(response.data.slice(0, 3));
      } catch (error) {
        showToast("Failed to fetch packages", "error");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    fetchPackages();
  }, []);

  // Navigation Helper
  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user ? user.full_name.split(" ")[0] : "..."}!
            </h1>
            <p className="text-slate-300 mb-6 max-w-xl">
              You have {packages.length} packages being tracked.
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
            <p className="text-slate-300 text-xs uppercase font-bold tracking-wider mb-1">
              My Address
            </p>
            <p className="font-mono text-sm">
              {user ? `${user.full_name} (CL-${user.id})` : "..."}
            </p>
            <p className="text-sm w-[80%]">{user?.address}</p>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => triggerNav("/client/orders")}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-primary-500 transition group"
          >
            <div className="bg-blue-50 p-4 rounded-full mb-3 group-hover:bg-blue-100 transition">
              <Plus className="text-blue-600" size={24} />
            </div>
            <span className="font-semibold text-slate-800 group-hover:text-blue-700">
              Create Pre-Alert
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Declaring incoming cargo
            </span>
          </button>

          <button
            onClick={() => triggerNav("/client/shopping")}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-purple-500 transition group"
          >
            <div className="bg-purple-50 p-4 rounded-full mb-3 group-hover:bg-purple-100 transition">
              <ShoppingBag className="text-purple-600" size={24} />
            </div>
            <span className="font-semibold text-slate-800 group-hover:text-purple-700">
              Shop For Me
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Request assisted purchase
            </span>
          </button>

          <button
            onClick={() => triggerNav("/client/invoices")}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-green-500 transition group"
          >
            <div className="bg-green-50 p-4 rounded-full mb-3 group-hover:bg-green-100 transition">
              <CreditCard className="text-green-600" size={24} />
            </div>
            <span className="font-semibold text-slate-800 group-hover:text-green-700">
              Pay Invoices
            </span>
            <span className="text-xs text-slate-500 mt-1">
              View outstanding bills
            </span>
          </button>

          <button
            onClick={() => triggerNav("/client/tracking")}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-orange-500 transition group"
          >
            <div className="bg-orange-50 p-4 rounded-full mb-3 group-hover:bg-orange-100 transition">
              <Globe className="text-orange-600" size={24} />
            </div>
            <span className="font-semibold text-slate-800 group-hover:text-orange-700">
              Track Package
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Check shipment status
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Package Tracking List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 text-lg">Your Packages</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-full focus:outline-none focus:border-primary-500 bg-white"
              />
              <Search
                className="absolute left-3 top-2 text-slate-400"
                size={14}
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Loading packages...
              </div>
            ) : packages.length > 0 ? (
              packages.map((pkg, i) => (
                <div
                  key={i}
                  className="p-4 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer group"
                  onClick={() => triggerNav(`/client/orders/${pkg.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                      <Package className="text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 group-hover:text-primary-600 transition">
                        {pkg.cargo_details}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {pkg.id} •{" "}
                        {new Date(pkg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={pkg.status.toUpperCase()} />
                    <ChevronRight className="text-slate-300" size={20} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                You have no packages being tracked currently.
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
            <button
              onClick={() => triggerNav("/client/orders")}
              className="text-primary-600 font-bold text-sm hover:underline"
            >
              View Full History
            </button>
          </div>
        </div>

        {/* Recent Updates / Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center">
            Latest Updates
            <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
              3 New
            </span>
          </h3>
          <div className="space-y-6">
            <div className="flex space-x-3">
              <div className="mt-1 min-w-[10px] min-h-[10px] rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
              <div>
                <p className="text-sm text-slate-800 font-bold">
                  Package Arrived at Warehouse
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  HWB-8832 is now ready for payment and release.
                </p>
                <span className="text-xs text-slate-400 mt-1 block">
                  2 hours ago
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="mt-1 min-w-[10px] min-h-[10px] rounded-full bg-green-500 ring-4 ring-green-50"></div>
              <div>
                <p className="text-sm text-slate-800 font-bold">
                  Quotation Approved
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Your request for "Gaming Monitor" has been purchased.
                </p>
                <span className="text-xs text-slate-400 mt-1 block">
                  1 day ago
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="mt-1 min-w-[10px] min-h-[10px] rounded-full bg-yellow-500 ring-4 ring-yellow-50"></div>
              <div>
                <p className="text-sm text-slate-800 font-bold">
                  Invoice Generated
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  New invoice #INV-9921 for $45.00 is available.
                </p>
                <span className="text-xs text-slate-400 mt-1 block">
                  2 days ago
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => triggerNav("/client/notifications")}
            className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
