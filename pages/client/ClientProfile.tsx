import React, { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Mail,
  Phone,
  Wallet,
  Package,
  Shield,
  Copy,
  Key,
  Lock,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import useAuth from "@/api/auth/useAuth";
import { AuthUser } from "@/api/types/auth";
import Modal from "@/components/UI/Modal";

const ClientProfile: React.FC = () => {
  const { showToast } = useToast();
  const { getUserProfile, changePassword } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserProfile();
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
        showToast("Failed to load profile.", "error");
      }
    };
    fetchUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    if (!user) {
      setError("User data not loaded.");
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        password,
        password_confirmation: passwordConfirmation,
        user_id: String(user.id),
      });
      setSuccess("Password updated successfully!");
      showToast("Password updated successfully!", "success");
      setIsModalOpen(false);
      setPassword("");
      setPasswordConfirmation("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "info");
  };

  const getShippingAddress = () => {
    if (!user) return "";
    return `${user.full_name} (CL-${user.id})\n144-25 183rd St, Unit CL-${user.id}\nSpringfield Gardens, NY 11413\nUnited States`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-slate-400">
          <User size={48} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-slate-800">
            {user?.full_name || "..."}
          </h1>
          <p className="text-primary-600 font-mono font-medium text-lg">
            ID: CL-{user?.id || "..."}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm text-slate-500">
            <span className="flex items-center">
              <Mail size={14} className="mr-1" /> {user?.email || "..."}
            </span>
            <span className="flex items-center">
              <Phone size={14} className="mr-1" /> {user?.phone || "..."}
            </span>
            <span className="flex items-center">
              <MapPin size={14} className="mr-1" />{" "}
              {user?.address || "Kampala, Uganda"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-right">
            <p className="text-xs text-green-600 uppercase font-bold">
              Wallet Balance
            </p>
            <p className="text-xl font-bold text-green-800">$0.00</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <Package size={18} className="mr-2 text-blue-600" /> Your Shipping
            Address
          </h3>
          <div
            className="bg-slate-800 text-white p-4 rounded-lg space-y-2 relative group cursor-pointer"
            onClick={() => handleCopy(getShippingAddress())}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <Copy size={16} className="text-slate-400" />
            </div>
            <p className="font-bold">
              {user?.full_name} (CL-{user?.id})
            </p>
            <p>
              144-25 183rd St, Unit CL-{user?.id}
            </p>
            <p>Springfield Gardens, NY 11413</p>
            <p>United States</p>
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
              Use this address when shopping on Amazon, eBay, etc.
            </p>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <Shield size={18} className="mr-2 text-slate-500" /> Account
            Security
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="text-sm font-medium text-slate-800">Password</p>
                <p className="text-xs text-slate-500">
                  Last changed 3 months ago
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Update
              </button>
            </div>
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Notifications
                </p>
                <p className="text-xs text-slate-500">Email & SMS Enabled</p>
              </div>
              <button className="text-sm text-blue-600 hover:underline">
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <input
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientProfile;