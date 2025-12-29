import React, { useState, useEffect } from "react";
import { Save, User, Lock, Bell, Shield, Mail, MapPin } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import useAuth from "@/api/auth/useAuth";
import { AuthUser } from "@/api/types/auth";

const ClientSettings: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "PROFILE" | "SECURITY" | "NOTIFICATIONS"
  >("PROFILE");
  const { getUserProfile, updateUserProfile, changePassword } = useAuth();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Profile form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("Central"); // Default or fetched
  const [country, setCountry] = useState("Uganda"); // Default or fetched (disabled in UI)

  // Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserProfile();
        const userData = response.data;
        setUser(userData);
        setFullName(userData.full_name);
        setEmail(userData.email);
        setPhone(userData.phone);

        // Assuming company data might exist, or be empty
        // @ts-ignore
        setCompany(userData.company || "");

        // Attempt to parse address string into granular components
        // This is a simple assumption, more robust parsing might be needed
        const addressParts = userData.address
          ? userData.address.split(",").map((part) => part.trim())
          : [];
        setStreet(addressParts[0] || "");
        setCity(addressParts[1] || "");
        setRegion(addressParts[2] || "Central"); // Fallback to default
        setCountry(addressParts[3] || "Uganda"); // Fallback to default
      } catch (error) {
        showToast("Failed to load user data.", "error");
      }
    };
    fetchUser();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {};

    if (fullName !== user.full_name) {
      payload.full_name = fullName;
    }
    if (phone !== user.phone) {
      payload.phone = phone;
    }
    // @ts-ignore
    if (company !== (user.company || "")) {
      payload.company = company;
    }

    const addressParts = user.address
      ? user.address.split(",").map((part) => part.trim())
      : [];
    const originalStreet = addressParts[0] || "";
    const originalCity = addressParts[1] || "";
    const originalRegion = addressParts[2] || "Central";
    // country is disabled, so no need to check for changes

    if (
      street !== originalStreet ||
      city !== originalCity ||
      region !== originalRegion
    ) {
      payload.street = street;
      payload.city = city;
      payload.region = region;
      payload.country = country; // Send full address block if any part changes
      payload.address = `${street}, ${city}, ${region}, ${country}`;
    }

    if (Object.keys(payload).length === 0) {
      showToast("No changes to save.", "success");
      setIsLoading(false);
      return;
    }

    try {
      await updateUserProfile(payload);
      showToast("Profile updated successfully", "success");
    } catch (error) {
      showToast("Failed to update profile.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (!user) {
      setPasswordError("User not found.");
      return;
    }

    setIsPasswordLoading(true);
    try {
      await changePassword({
        user_id: String(user.id),
        password: newPassword,
        password_confirmation: confirmPassword,
        // Note: API seems to not need current_password, which is unusual but we follow the spec.
      });
      showToast("Password changed successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "PROFILE") {
      handleProfileSave(e);
    } else if (activeTab === "SECURITY") {
      handlePasswordSave(e);
    } else {
      showToast("Settings saved!", "success");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Account Settings
          </h2>
          <p className="text-slate-500 text-sm">
            Manage your profile, shipping address, and preferences.
          </p>
        </div>
        <button
          type="submit"
          form="clientSettingsForm"
          disabled={isLoading || isPasswordLoading}
          className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 flex items-center shadow-sm font-medium disabled:bg-primary-400"
        >
          <Save size={18} className="mr-2" />
          {isLoading || isPasswordLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0">
          <nav className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab("PROFILE")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === "PROFILE"
                  ? "bg-white text-primary-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <User size={18} className="mr-3 text-slate-400" /> Profile &
              Address
            </button>
            <button
              onClick={() => setActiveTab("SECURITY")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === "SECURITY"
                  ? "bg-white text-primary-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Lock size={18} className="mr-3 text-slate-400" /> Security
            </button>
            <button
              onClick={() => setActiveTab("NOTIFICATIONS")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === "NOTIFICATIONS"
                  ? "bg-white text-primary-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Bell size={18} className="mr-3 text-slate-400" /> Notifications
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          <form id="clientSettingsForm" onSubmit={handleSave}>
            {activeTab === "PROFILE" && (
              <div className="space-y-8 animate-in fade-in">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="mt-1 w-full border border-slate-200 rounded p-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4 flex items-center">
                    <MapPin size={20} className="mr-2 text-primary-600" />{" "}
                    Delivery Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street, Plot, or House Number"
                        className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        City / Town
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Region
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                      >
                        <option>Central</option>
                        <option>Western</option>
                        <option>Eastern</option>
                        <option>Northern</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Country
                      </label>
                      <input
                        type="text"
                        value={country}
                        disabled
                        className="mt-1 w-full border border-slate-200 rounded p-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "SECURITY" && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4">
                  Password & Security
                </h3>
                {passwordError && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
                    {passwordError}
                  </div>
                )}
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "NOTIFICATIONS" && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <Mail className="text-slate-400 mr-3" size={20} />
                      <div>
                        <p className="font-medium text-slate-900">
                          Email Notifications
                        </p>
                        <p className="text-sm text-slate-500">
                          Receive updates about your shipments via email.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <Bell className="text-slate-400 mr-3" size={20} />
                      <div>
                        <p className="font-medium text-slate-900">
                          SMS Notifications
                        </p>
                        <p className="text-sm text-slate-500">
                          Receive critical alerts via SMS.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isLoading || isPasswordLoading}
                className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 flex items-center shadow-sm font-medium disabled:bg-primary-400"
              >
                <Save size={18} className="mr-2" />
                {isLoading || isPasswordLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
