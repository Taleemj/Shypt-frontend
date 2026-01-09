import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Phone,
  Edit,
  Plus,
  Eye,
  Lock,
  Unlock,
  Briefcase,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { User } from "../../types";
import { DataTable, Column } from "../../components/UI/DataTable";
import useAuth from "@/api/auth/useAuth";
import { RegisterPayload } from "@/api/types/auth";

const Users: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchCrmCustomers, register } = useAuth();

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchCrmCustomers();
      const mappedUsers = response.data.map(
        (
          user: {
            balance: number;
            email: string;
            phone: string;
            status: string;
          },
          index
        ): User => {
          const nameFromEmail = user.email.split("@")[0];
          const capitalizedName =
            nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          return {
            id: `CL-${index + 1}`,
            name: capitalizedName,
            email: user.email,
            phone: user.phone,
            companyName: "",
            tinNumber: "",
            address: {
              line1: "N/A",
              city: "",
              country: "",
            },
            // @ts-ignore
            role: "CLIENT",
            // @ts-ignore
            status: user.status.toUpperCase(),
            preferredWarehouse: "CN",
            joinedDate: new Date().toISOString().split("T")[0],
            balance: user.balance,
          };
        }
      );
      setUsers(mappedUsers);
    } catch (error) {
      showToast("Failed to fetch customers", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCrmCustomers, showToast]);

  useEffect(() => {
    loadCustomers();
  }, []);

  // Navigation Helper
  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  // Handlers
  const handleEdit = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setSelectedUser(user);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const toggleStatus = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, status: newStatus as any } : u
      )
    );
    showToast(
      `User ${user.name} is now ${newStatus}`,
      newStatus === "ACTIVE" ? "success" : "warning"
    );
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);

    if (isEditMode) {
      const updatedUser: User = {
        id: selectedUser!.id,
        name: formData.get("fullName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        companyName: formData.get("companyName") as string,
        tinNumber: formData.get("tinNumber") as string,
        address: {
          line1: formData.get("addressLine1") as string,
          city: formData.get("city") as string,
          region: formData.get("region") as string,
          country: "Uganda",
        },
        role: "CLIENT" as any,
        status: (formData.get("status") as any) || "ACTIVE",
        preferredWarehouse: "CN" as any,
        joinedDate: selectedUser!.joinedDate,
        balance: selectedUser!.balance,
      };
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      showToast("Client profile updated successfully", "success");
      setIsFormOpen(false);
      setIsSubmitting(false);
    } else {
      const payload: RegisterPayload = {
        full_name: formData.get("fullName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        password: formData.get("password") as string,
        password_confirmation: formData.get("password_confirmation") as string,
        tin: formData.get("tinNumber") as string,
        street: formData.get("addressLine1") as string,
        city: formData.get("city") as string,
        region: formData.get("region") as string,
        country: "Uganda",
      };
      payload.address = `${payload.street}, ${payload.city}, ${payload.region}, ${payload.country}`;

      try {
        const response = await register(payload);
        if (response && response.data) {
          showToast(
            response.message || "New client registered successfully",
            "success"
          );
          setIsFormOpen(false);
          loadCustomers();
          form.reset();
        } else {
          showToast(
            response.message || "Failed to register new client.",
            "error"
          );
        }
      } catch (error: any) {
        showToast(
          error?.response?.data?.message ||
            "An unexpected error occurred during registration.",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // --- COLUMN DEFINITIONS ---
  const columns: Column<User>[] = [
    {
      header: "Client ID",
      accessor: (user) => (
        <span className="font-mono text-xs text-primary-600 font-bold hover:underline">
          {user.id}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Identity",
      accessor: (user) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold mr-3 text-sm border border-slate-200">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-slate-900">{user.name}</div>
            {user.companyName && (
              <div className="text-xs text-slate-500 flex items-center">
                <Briefcase size={10} className="mr-1" /> {user.companyName}
              </div>
            )}
          </div>
        </div>
      ),
      sortKey: "name",
      sortable: true,
    },
    {
      header: "Contact Info",
      accessor: (user) => (
        <div>
          <div className="text-sm text-slate-600 flex items-center">
            <Mail size={12} className="mr-2 text-slate-400" /> {user.email}
          </div>
          <div className="text-sm text-slate-600 flex items-center mt-1">
            <Phone size={12} className="mr-2 text-slate-400" /> {user.phone}
          </div>
        </div>
      ),
    },
    {
      header: "Balance",
      sortKey: "balance",
      sortable: true,
      accessor: (user) => (
        <span
          className={`font-mono font-medium ${
            user.balance < 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {/* {user.balance < 0
            ? `-${Math.abs(user.balance).toFixed(2)}`
            : `${user.balance.toFixed(2)}`} */}
          {user.balance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      sortable: true,
      accessor: (user) => <StatusBadge status={user.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (user) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerNav(`/admin/users/${user.id}`);
            }}
            className="p-1.5 text-slate-400 hover:text-primary-600 rounded transition"
            title="View Ledger"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => handleEdit(e, user)}
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition"
            title="Edit Profile"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => toggleStatus(e, user)}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded transition"
            title={user.status === "ACTIVE" ? "Suspend" : "Activate"}
          >
            {user.status === "ACTIVE" ? (
              <Lock size={16} />
            ) : (
              <Unlock size={16} />
            )}
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-8 w-8 text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="ml-3 text-slate-500">Loading clients...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            CRM & Client Management
          </h2>
          <p className="text-slate-500 text-sm">
            Manage client profiles, onboarding, and status.
          </p>
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onRowClick={(user) => triggerNav(`/admin/users/${user.id}`)}
        title="Active Clients"
        searchPlaceholder="Search Clients..."
        primaryAction={
          <button
            onClick={handleAdd}
            className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Add New Client
          </button>
        }
      />

      {/* COMPREHENSIVE ADD/EDIT CLIENT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          isEditMode
            ? `Edit Client: ${selectedUser?.name}`
            : "Register New Client"
        }
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Section 1: Personal / Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="fullName"
                  defaultValue={selectedUser?.name}
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="email"
                  defaultValue={selectedUser?.email}
                  type="email"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="phone"
                  defaultValue={selectedUser?.phone}
                  type="tel"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                  placeholder="+256..."
                />
              </div>
            </div>
          </div>

          {!isEditMode && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">
                Set Password
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="password"
                    type="password"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="password_confirmation"
                    type="password"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Business Info */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">
              Business & Billing Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Company Name
                </label>
                <input
                  name="companyName"
                  defaultValue={selectedUser?.companyName}
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  URA TIN Number
                </label>
                <input
                  name="tinNumber"
                  defaultValue={selectedUser?.tinNumber}
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                  placeholder="For tax purposes"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Address */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">
              Physical Address (Uganda)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Street Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="addressLine1"
                  defaultValue={selectedUser?.address?.line1}
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  City / Town <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="city"
                  defaultValue={selectedUser?.address?.city}
                  type="text"
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Region
                </label>
                <select
                  name="region"
                  defaultValue={selectedUser?.address?.region || "Central"}
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded p-2 mt-1"
                >
                  <option value="Central">Central</option>
                  <option value="Western">Western</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Northern">Northern</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: System Status */}
          {isEditMode && (
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Status
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    defaultChecked={selectedUser?.status === "ACTIVE"}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">Active</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="SUSPENDED"
                    defaultChecked={selectedUser?.status === "SUSPENDED"}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">Suspended</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 shadow-sm font-medium disabled:bg-slate-500"
            >
              {isSubmitting
                ? "Submitting..."
                : isEditMode
                ? "Update Client"
                : "Register Client"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
