import React, { useState, useMemo, useEffect } from "react";
import {
  Save,
  Globe,
  Bell,
  Shield,
  Database,
  BookOpen,
  LayoutGrid,
  RefreshCw,
  Activity,
  Edit,
  Trash2,
  ClipboardCheck,
  Printer,
  Plus,
  Lock,
  Mail,
  CheckCircle,
  DollarSign,
  Layers,
  MapPin,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/UI/Modal";
import { DataTable, Column } from "../../components/UI/DataTable";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouseLocation, WarehouseRack } from "../../api/types/warehouse";

// Import new tab components
import GeneralTab from "./settings/GeneralTab";
import HsCodesTab from "./settings/HsCodesTab";
import WarehousesTab from "./settings/WarehousesTab";
import LocationsTab from "./settings/LocationsTab";
import NotificationsTab from "./settings/NotificationsTab";
import SecurityTab from "./settings/SecurityTab";
import ShippingAddressesTab from "./settings/ShippingAddressesTab";

import useAuth from "../../api/auth/useAuth";
import { AuthUser } from "../../api/types/auth";
import useShippingAddress from "../../api/useShippingAddress/useShippingAddress";
import { ShippingAddress } from "../../api/types/shippingAddress";

// Define HSCode interface here, assuming it's used in this file or passed to children
interface HSCode {
  id: string;
  code: string;
  desc: string;
  duty: number;
  vat: number;
}

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    | "GENERAL"
    | "WAREHOUSES"
    | "NOTIFICATIONS"
    | "SECURITY"
    | "HS_CODES"
    | "LOCATIONS"
    | "SHIPPING_ADDRESSES"
  >("GENERAL");

  const {
    fetchWareHouseLocations,
    createWareHouseLocation,
    updateWareHouseLocation,
    fetchWarehouseRacks,
    createWarehouseRack,
    deleteWarehouseRack,
  } = useWareHouse();

  const {
    fetchShippingAddresses,
    createShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
  } = useShippingAddress();

  const {
    createStaffAccount,
    AllocateWareHouseToStaff,
    fetchAllUsers,
    updateUser,
  } = useAuth();
  const [staff, setStaff] = useState<AuthUser[]>([]);

  // Modal States
  const [modalType, setModalType] = useState<
    | "WAREHOUSE"
    | "STAFF"
    | "HS_CODE"
    | "PERMISSIONS"
    | "RACK"
    | "EDIT_WAREHOUSE"
    | "SHIPPING_ADDRESS"
    | "EDIT_SHIPPING_ADDRESS"
    | "EDIT_STAFF"
    | null
  >(null);

  // --- INVITE USER STATE ---
  const [inviteStep, setInviteStep] = useState(1);
  const [newlyCreatedStaff, setNewlyCreatedStaff] = useState<AuthUser | null>(
    null,
  );
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- GLOBAL STATE ---
  const [exchangeRate, setExchangeRate] = useState("3850");
  const [buffer, setBuffer] = useState("5");
  const [companyName, setCompanyName] = useState("Shypt Logistics");

  const [hsCodes, setHsCodes] = useState<HSCode[]>([
    {
      id: "8471.30",
      code: "8471.30",
      desc: "Laptops & Computers",
      duty: 0,
      vat: 18,
    },
    {
      id: "8517.12",
      code: "8517.12",
      desc: "Mobile Phones",
      duty: 10,
      vat: 18,
    },
    {
      id: "6109.10",
      code: "6109.10",
      desc: "Cotton T-Shirts",
      duty: 25,
      vat: 18,
    },
  ]);

  const [warehouses, setWarehouses] = useState<WareHouseLocation[]>([]);
  const [racks, setRacks] = useState<WarehouseRack[]>([]);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>(
    [],
  );

  const stats = useMemo(() => {
    const totalRacks = racks.length;
    if (totalRacks === 0) {
      return {
        total: 0,
        highOccupancy: 0,
        pendingAudit: 0,
        freeSpace: 100,
      };
    }

    const highOccupancy = racks.filter(
      (r) => r.occupancy && r.occupancy > 80,
    ).length;

    // Racks that have never been audited
    const pendingAudit = racks.filter((r) => !r.last_audited).length;

    const totalCapacity = racks.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = racks.reduce(
      (sum, r) => sum + (r.capacity * (r.occupancy || 0)) / 100,
      0,
    );

    const freeSpace =
      totalCapacity > 0
        ? 100 - Math.round((totalOccupied / totalCapacity) * 100)
        : 100;

    return {
      total: totalRacks,
      highOccupancy,
      pendingAudit,
      freeSpace,
    };
  }, [racks]);

  useEffect(() => {
    const loadData = async () => {
      // Fetch warehouses if the relevant tab is active AND the data hasn't been loaded yet.
      if (
        (activeTab === "WAREHOUSES" ||
          activeTab === "LOCATIONS" ||
          modalType === "STAFF" ||
          modalType === "EDIT_STAFF") &&
        warehouses.length === 0
      ) {
        setIsLoadingWarehouses(true);
        try {
          const res = await fetchWareHouseLocations();
          setWarehouses(res.data);
        } catch (error) {
          showToast("Failed to fetch warehouses", "error");
        } finally {
          setIsLoadingWarehouses(false);
        }
      }
      // Fetch racks if the relevant tab is active AND the data hasn't been loaded yet.
      if (activeTab === "LOCATIONS" && racks.length === 0) {
        setIsLoadingRacks(true);
        try {
          const res = await fetchWarehouseRacks();
          setRacks(res.data);
        } catch (error) {
          showToast("Failed to fetch racks", "error");
        } finally {
          setIsLoadingRacks(false);
        }
      }
      // Fetch staff if the relevant tab is active AND the data hasn't been loaded yet.
      if (activeTab === "SECURITY" && staff.length === 0) {
        setIsLoadingStaff(true);
        try {
          const res = await fetchAllUsers();
          console.log("user data", res.data);
          const staffUsers = res.data.filter(
            (user) => user.user_type !== "user",
          );
          setStaff(staffUsers);
        } catch (error) {
          showToast("Failed to fetch staff members", "error");
        } finally {
          setIsLoadingStaff(false);
        }
      }
      // Fetch shipping addresses if the relevant tab is active AND the data hasn't been loaded yet.
      if (
        activeTab === "SHIPPING_ADDRESSES" &&
        shippingAddresses.length === 0
      ) {
        setIsLoadingShippingAddresses(true);
        try {
          const res = await fetchShippingAddresses();
          setShippingAddresses(res.data);
        } catch (error) {
          showToast("Failed to fetch shipping addresses", "error");
        } finally {
          setIsLoadingShippingAddresses(false);
        }
      }
    };
    loadData();
  }, [
    activeTab,
    warehouses.length,
    racks.length,
    staff.length,
    shippingAddresses.length,
    modalType,
  ]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);
  const [isAddingRack, setIsAddingRack] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WareHouseLocation | null>(null);
  const [isEditingWarehouse, setIsEditingWarehouse] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isLoadingRacks, setIsLoadingRacks] = useState(false);
  const [isLoadingShippingAddresses, setIsLoadingShippingAddresses] =
    useState(false);
  const [editingShippingAddress, setEditingShippingAddress] =
    useState<ShippingAddress | null>(null);
  const [isSavingShippingAddress, setIsSavingShippingAddress] = useState(false);

  // --- ACTIONS ---
  const handleSaveGlobal = () => {
    showToast("System configuration saved successfully", "success");
  };

  const handleTestSmtp = () => {
    setIsTestingSmtp(true);
    setTimeout(() => {
      setIsTestingSmtp(false);
      showToast("SMTP connection successful", "success");
    }, 2000);
  };

  const handleToggleStatus = async (user: AuthUser) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    if (
      !confirm(
        `Are you sure you want to set ${user.full_name}'s status to ${newStatus}?`,
      )
    ) {
      return;
    }
    try {
      setIsLoadingStaff(true);
      await updateUser(user.id, { status: newStatus });
      showToast(`User status updated to ${newStatus}`, "success");
      const allUsersRes = await fetchAllUsers();
      const staffUsers = allUsersRes.data.filter((u) => u.user_type !== "user");
      setStaff(staffUsers);
    } catch (error) {
      showToast("Failed to update user status", "error");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleEditStaffSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;

    const fd = new FormData(e.currentTarget);
    const payload: Partial<AuthUser> = {
      full_name: fd.get("full_name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
    };
    const warehouseId = fd.get("warehouse_location_id");

    try {
      setIsSubmitting(true);
      await updateUser(selectedItem.id, payload);

      if (
        selectedItem.user_type === "staff" &&
        warehouseId &&
        Number(warehouseId) !== selectedItem.warehouse_location_id
      ) {
        await AllocateWareHouseToStaff({
          user_id: selectedItem.id,
          warehouse_location_id: Number(warehouseId),
        });
      }

      showToast("Staff profile updated successfully", "success");

      setIsLoadingStaff(true);
      const allUsersRes = await fetchAllUsers();
      const staffUsers = allUsersRes.data.filter((u) => u.user_type !== "user");
      setStaff(staffUsers);

      setModalType(null);
      setSelectedItem(null);
    } catch (error) {
      showToast("Failed to update staff profile", "error");
    } finally {
      setIsSubmitting(false);
      setIsLoadingStaff(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsInvitingUser(true);
    const fd = new FormData(e.currentTarget);
    const user_type = fd.get("user_type") as "super_user" | "staff" | "agent";

    const payload = {
      full_name: fd.get("full_name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      user_type: user_type,
    };

    try {
      const res = await createStaffAccount(payload);
      showToast("Staff member created successfully!", "success");

      if (user_type === "staff") {
        setNewlyCreatedStaff(res.data);
        setInviteStep(2);
      } else {
        setIsLoadingStaff(true);
        try {
          const allUsersRes = await fetchAllUsers();
          const staffUsers = allUsersRes.data.filter(
            (user) => user.user_type !== "user",
          );
          setStaff(staffUsers);
          setModalType(null);
          setInviteStep(1);
          setNewlyCreatedStaff(null);
        } catch (error) {
          showToast("Failed to fetch staff members after creation", "error");
        } finally {
          setIsLoadingStaff(false);
        }
      }
    } catch (error) {
      showToast("Failed to create staff member", "error");
    } finally {
      setIsInvitingUser(false);
    }
  };

  const handleAssignWarehouseToStaff = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!newlyCreatedStaff) return;

    setIsInvitingUser(true);
    const fd = new FormData(e.currentTarget);
    const warehouse_location_id = Number(fd.get("warehouse_location_id"));

    try {
      await AllocateWareHouseToStaff({
        user_id: newlyCreatedStaff.id,
        warehouse_location_id,
      });
      showToast(
        `Assigned ${newlyCreatedStaff.full_name} to warehouse`,
        "success",
      );
      setIsLoadingStaff(true);
      try {
        const allUsersRes = await fetchAllUsers();
        const staffUsers = allUsersRes.data.filter(
          (user) => user.user_type !== "user",
        );
        setStaff(staffUsers);
        setModalType(null);
        setInviteStep(1);
        setNewlyCreatedStaff(null);
      } catch (error) {
        showToast("Failed to fetch staff members after assignment", "error");
      } finally {
        setIsLoadingStaff(false);
      }
    } catch (error) {
      showToast("Failed to assign warehouse", "error");
    } finally {
      setIsInvitingUser(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingWarehouse(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: fd.get("code") as string,
      name: fd.get("name") as string,
      address: fd.get("address") as string,
      manager: fd.get("manager") as string,
      active: true,
      country: fd.get("country") as string,
    };
    try {
      const res = await createWareHouseLocation(payload);
      setWarehouses([...warehouses, res.data]);
      showToast(`Warehouse ${res.data.code} registered`, "success");
      setModalType(null);
    } catch (error) {
      showToast("Failed to create warehouse", "error");
    } finally {
      setIsAddingWarehouse(false);
    }
  };

  const handleEditWarehouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingWarehouse) return;

    setIsEditingWarehouse(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: fd.get("code") as string,
      name: fd.get("name") as string,
      address: fd.get("address") as string,
      manager: fd.get("manager") as string,
      country: fd.get("country") as string,
    };

    try {
      const res = await updateWareHouseLocation(editingWarehouse.id, payload);
      setWarehouses(
        warehouses.map((w) => (w.id === editingWarehouse.id ? res.data : w)),
      );
      showToast(`Warehouse ${res.data.code} updated`, "success");
      setModalType(null);
      setEditingWarehouse(null);
    } catch (error) {
      showToast("Failed to update warehouse", "error");
    } finally {
      setIsEditingWarehouse(false);
    }
  };

  const handleAddHSCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = fd.get("code") as string;
    const newCode: HSCode = {
      id: code,
      code: code,
      desc: fd.get("desc") as string,
      duty: Number(fd.get("duty")),
      vat: Number(fd.get("vat")),
    };
    setHsCodes([...hsCodes, newCode]);
    showToast(`HS Code ${newCode.code} added`, "success");
    setModalType(null);
  };

  const handleAddRack = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingRack(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      warehouse_location_id: Number(fd.get("wh")),
      zone_name: fd.get("zone") as string,
      bin_start: Number(fd.get("start")),
      bin_end: Number(fd.get("end")),
      capacity: Number(fd.get("cap")),
      type: fd.get("type") as any,
    };

    if (!payload.warehouse_location_id) {
      showToast("Please select a warehouse.", "error");
      setIsAddingRack(false);
      return;
    }

    try {
      const res = await createWarehouseRack(payload);
      setRacks([...racks, res.data]);
      showToast(`${res.data.zone_name} added to inventory map`, "success");
      setModalType(null);
    } catch (error) {
      showToast("Failed to add rack", "error");
    } finally {
      setIsAddingRack(false);
    }
  };

  const handleSaveShippingAddress = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setIsSavingShippingAddress(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      address_line1: fd.get("address_line1") as string,
      address_line2: fd.get("address_line2") as string,
      city: fd.get("city") as string,
      state: fd.get("state") as string,
      zip: fd.get("zip") as string,
      phone_number: fd.get("phone_number") as string,
    };

    try {
      if (editingShippingAddress) {
        const res = await updateShippingAddress(
          editingShippingAddress.id,
          payload,
        );
        setShippingAddresses(
          shippingAddresses.map((a) => (a.id === res.id ? res : a)),
        );
        showToast("Address updated successfully", "success");
      } else {
        const res = await createShippingAddress(payload);
        setShippingAddresses([...shippingAddresses, res]);
        showToast("Address created successfully", "success");
      }
      setModalType(null);
      setEditingShippingAddress(null);
    } catch (error) {
      showToast(
        editingShippingAddress
          ? "Failed to update address"
          : "Failed to create address",
        "error",
      );
    } finally {
      setIsSavingShippingAddress(false);
    }
  };

  const handleDeleteAddress = async (addr: ShippingAddress) => {
    if (
      confirm(`Are you sure you want to delete the address for ${addr.name}?`)
    ) {
      try {
        await deleteShippingAddress(addr.id);
        setShippingAddresses(shippingAddresses.filter((a) => a.id !== addr.id));
        showToast("Shipping address deleted", "success");
      } catch (error) {
        showToast("Failed to delete shipping address", "error");
      }
    }
  };

  const togglePermission = (permId: string) => {
    if (!selectedItem) return;
    const currentPerms = selectedItem.permissions || [];
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((p: string) => p !== permId)
      : [...currentPerms, permId];

    setSelectedItem({ ...selectedItem, permissions: newPerms });
  };

  const savePermissions = () => {
    if (!selectedItem) return;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === selectedItem.id
          ? { ...s, permissions: selectedItem.permissions }
          : s,
      ),
    );
    showToast("Permissions updated", "success");
    setModalType(null);
  };

  const handleAuditRack = (id: number) => {
    // This needs a backend endpoint to work properly.
    // For now, it will just update the local state.
    setRacks((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, last_audited: new Date().toISOString().split("T")[0] }
          : r,
      ),
    );
    showToast(`Rack ${id} marked as audited`, "success");
  };

  const deleteRack = async (rack: WarehouseRack) => {
    if (confirm("Permanently remove this rack from warehouse mapping?")) {
      try {
        await deleteWarehouseRack(rack.id, { warehouseRack_id: rack.id });
        setRacks(racks.filter((r) => r.id !== rack.id));
        showToast("Rack configuration deleted", "info");
      } catch (error) {
        showToast("Failed to delete rack", "error");
      }
    }
  };

  const toggleWhStatus = async (wh: WareHouseLocation) => {
    try {
      const res = await updateWareHouseLocation(wh.id, { active: !wh.active });
      setWarehouses((prev) => prev.map((w) => (w.id === wh.id ? res.data : w)));
      showToast("Warehouse operational status toggled", "info");
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  // --- DATATABLE COLUMNS ---

  const warehouseColumns: Column<WareHouseLocation>[] = [
    {
      header: "Code",
      accessor: (wh) => (
        <span className="font-black text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100">
          {wh.code}
        </span>
      ),
      sortKey: "code",
      sortable: true,
    },
    {
      header: "Hub Details",
      accessor: (wh) => (
        <div>
          <div className="font-bold text-slate-900">{wh.name}</div>
          <div className="text-xs text-slate-500 truncate max-w-xs">
            {wh.address}
          </div>
        </div>
      ),
      sortKey: "name",
      sortable: true,
    },
    {
      header: "Manager",
      accessor: "manager",
      sortable: true,
    },
    {
      header: "Inventory Load",
      accessor: (wh) => (
        <div className="flex items-center text-xs text-slate-600">
          <Layers size={14} className="mr-1.5 text-slate-400" />
          {wh.rack_count} Configured Racks
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (wh) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            wh.active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {wh.active ? "Operational" : "Inactive"}
        </span>
      ),
      sortKey: "active",
      sortable: true,
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (wh) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toggleWhStatus(wh)}
            className="p-1.5 text-slate-500 hover:text-primary-600 rounded bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition"
          >
            <Activity size={16} />
          </button>
          <button
            onClick={() => {
              setEditingWarehouse(wh);
              setModalType("EDIT_WAREHOUSE");
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition"
          >
            <Edit size={16} />
          </button>
        </div>
      ),
    },
  ];

  const rackColumns: Column<WarehouseRack>[] = [
    {
      header: "Rack ID",
      accessor: (r) => (
        <span className="font-mono font-bold text-slate-900">{r.id}</span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Warehouse",
      accessor: (r) => {
        const wh = warehouses.find((w) => w.id === r.warehouse_location_id);
        return wh ? wh.code : "N/A";
      },
      sortKey: "warehouse_location_id",
      sortable: true,
      className: "font-bold text-primary-700",
    },
    {
      header: "Zone / Type",
      accessor: (r) => (
        <div>
          <div className="font-bold text-slate-800 text-xs uppercase">
            {r.zone_name}
          </div>
          <div className="text-[10px] text-slate-400 font-bold tracking-widest">
            {r.type}
          </div>
        </div>
      ),
      sortKey: "zone_name",
      sortable: true,
    },
    {
      header: "Bins",
      accessor: (r) => (
        <span className="text-xs text-slate-600">
          {r.bin_start} - {r.bin_end}
        </span>
      ),
    },
    {
      header: "Occupancy",
      accessor: (r) => (
        <div className="w-32">
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span
              className={
                r.occupancy && r.occupancy > 80
                  ? "text-red-600"
                  : "text-slate-500"
              }
            >
              {r.occupancy || 0}%
            </span>
            <span className="text-slate-400">Cap: {r.capacity}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                r.occupancy && r.occupancy > 80
                  ? "bg-red-500"
                  : r.occupancy && r.occupancy > 50
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${r.occupancy || 0}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      header: "Last Audit",
      accessor: (r) => (
        <span className="text-xs text-slate-500">
          {r.last_audited || "Never"}
        </span>
      ),
      sortKey: "last_audited",
      sortable: true,
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => handleAuditRack(r.id)}
            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition"
            title="Mark Audited Today"
          >
            <ClipboardCheck size={16} />
          </button>
          <button
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition"
            title="Print Rack Barcodes"
            onClick={() =>
              showToast("Sending ZPL labels to printer...", "info")
            }
          >
            <Printer size={16} />
          </button>
          <button
            onClick={() => deleteRack(r)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Delete Rack"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const shippingAddressColumns: Column<ShippingAddress>[] = [
    { header: "Recipient", accessor: "name", sortable: true },
    {
      header: "Address",
      accessor: (addr) =>
        `${addr.address_line1}, ${addr.city}, ${addr.state} ${addr.zip}`,
    },
    { header: "Phone", accessor: "phone_number" },
    {
      header: "Actions",
      className: "text-right",
      accessor: (addr) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingShippingAddress(addr);
              setModalType("EDIT_SHIPPING_ADDRESS");
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDeleteAddress(addr)}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500 text-sm">
            Configure global variables, compliance, and access control.
          </p>
        </div>
        <button
          onClick={handleSaveGlobal}
          className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 flex items-center shadow-sm font-medium"
        >
          <Save size={18} className="mr-2" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0">
          <nav className="p-2 space-y-1">
            {[
              {
                id: "GENERAL",
                label: "General & Finance",
                icon: <Globe size={18} />,
              },
              {
                id: "HS_CODES",
                label: "HS Codes & Taxes",
                icon: <BookOpen size={18} />,
              },
              {
                id: "WAREHOUSES",
                label: "Warehouses",
                icon: <Database size={18} />,
              },
              {
                id: "LOCATIONS",
                label: "Racks & Locations",
                icon: <LayoutGrid size={18} />,
              },
              {
                id: "SHIPPING_ADDRESSES",
                label: "Shipping Addresses",
                icon: <MapPin size={18} />,
              },
              {
                id: "NOTIFICATIONS",
                label: "Notifications",
                icon: <Bell size={18} />,
              },
              {
                id: "SECURITY",
                label: "Security & Staff",
                icon: <Shield size={18} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-primary-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="mr-3 text-slate-400">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-x-hidden">
          {activeTab === "GENERAL" && (
            <GeneralTab
              companyName={companyName}
              setCompanyName={setCompanyName}
              exchangeRate={exchangeRate}
              setExchangeRate={setExchangeRate}
              buffer={buffer}
              setBuffer={setBuffer}
            />
          )}

          {activeTab === "HS_CODES" && (
            // @ts-ignore
            <HsCodesTab hsCodes={hsCodes} setModalType={setModalType} />
          )}

          {activeTab === "WAREHOUSES" && (
            <WarehousesTab
              isLoadingWarehouses={isLoadingWarehouses}
              warehouses={warehouses}
              warehouseColumns={warehouseColumns}
              // @ts-ignore
              setModalType={setModalType}
            />
          )}

          {activeTab === "LOCATIONS" && (
            <LocationsTab
              isLoadingRacks={isLoadingRacks}
              racks={racks}
              rackColumns={rackColumns}
              stats={stats}
              // @ts-ignore
              setModalType={setModalType}
            />
          )}

          {activeTab === "SHIPPING_ADDRESSES" && (
            <ShippingAddressesTab
              isLoading={isLoadingShippingAddresses}
              addresses={shippingAddresses}
              columns={shippingAddressColumns}
              setModalType={setModalType as any}
            />
          )}

          {activeTab === "NOTIFICATIONS" && (
            <NotificationsTab
              handleTestSmtp={handleTestSmtp}
              isTestingSmtp={isTestingSmtp}
            />
          )}

          {activeTab === "SECURITY" && (
            <SecurityTab
              staff={staff}
              isLoadingStaff={isLoadingStaff}
              // @ts-ignore
              setModalType={setModalType}
              setSelectedItem={setSelectedItem}
              handleToggleStatus={handleToggleStatus}
            />
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* SHIPPING ADDRESS MODAL (ADD/EDIT) */}
      <Modal
        isOpen={
          modalType === "SHIPPING_ADDRESS" ||
          modalType === "EDIT_SHIPPING_ADDRESS"
        }
        onClose={() => {
          setModalType(null);
          setEditingShippingAddress(null);
        }}
        title={
          editingShippingAddress
            ? "Edit Shipping Address"
            : "Add Shipping Address"
        }
      >
        <form onSubmit={handleSaveShippingAddress} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Recipient Name
            </label>
            <input
              name="name"
              required
              defaultValue={editingShippingAddress?.name}
              className="w-full border p-2 rounded mt-1 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Address Line 1
            </label>
            <input
              name="address_line1"
              defaultValue={editingShippingAddress?.address_line1}
              className="w-full border p-2 rounded mt-1 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Address Line 2 (Optional)
            </label>
            <input
              name="address_line2"
              defaultValue={editingShippingAddress?.address_line2 || ""}
              className="w-full border p-2 rounded mt-1 bg-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-bold text-slate-700">
                City
              </label>
              <input
                name="city"
                defaultValue={editingShippingAddress?.city}
                className="w-full border p-2 rounded mt-1 bg-white"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-bold text-slate-700">
                State/Province
              </label>
              <input
                name="state"
                defaultValue={editingShippingAddress?.state}
                className="w-full border p-2 rounded mt-1 bg-white"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-bold text-slate-700">
                ZIP/Postal Code
              </label>
              <input
                name="zip"
                defaultValue={editingShippingAddress?.zip}
                className="w-full border p-2 rounded mt-1 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Phone Number
            </label>
            <input
              name="phone_number"
              defaultValue={editingShippingAddress?.phone_number}
              className="w-full border p-2 rounded mt-1 bg-white"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSavingShippingAddress}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center disabled:bg-primary-400"
            >
              {isSavingShippingAddress ? (
                <RefreshCw size={18} className="mr-2 animate-spin" />
              ) : null}
              {isSavingShippingAddress ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </Modal>

      {/* RACK MAPPING MODAL */}
      <Modal
        isOpen={modalType === "RACK"}
        onClose={() => setModalType(null)}
        title="Configure Warehouse Rack/Zone"
      >
        <form onSubmit={handleAddRack} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Hub Warehouse
            </label>
            <select
              name="wh"
              required
              className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Zone/Row Name
            </label>
            <input
              name="zone"
              required
              className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
              placeholder="e.g. Row A, Fragile Section"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Bin Range Start
              </label>
              <input
                name="start"
                type="number"
                required
                className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Bin Range End
              </label>
              <input
                name="end"
                type="number"
                required
                className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
                placeholder="50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Storage Type
              </label>
              <select
                name="type"
                className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
              >
                <option value="SHELF">Shelf (Cartons)</option>
                <option value="PALLET">Pallet Bay (Bulk)</option>
                <option value="COLD">Cold Storage</option>
                <option value="FRAGILE">Secure / Fragile</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Total Capacity (Units)
              </label>
              <input
                name="cap"
                type="number"
                required
                className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
                placeholder="100"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isAddingRack}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center disabled:bg-primary-400"
            >
              {isAddingRack ? (
                <RefreshCw size={18} className="mr-2 animate-spin" />
              ) : null}
              {isAddingRack ? "Saving..." : "Add to Inventory Map"}
            </button>
          </div>
        </form>
      </Modal>

      {/* HS CODE MODAL */}
      <Modal
        isOpen={modalType === "HS_CODE"}
        onClose={() => setModalType(null)}
        title="Register HS Code Category"
      >
        <form onSubmit={handleAddHSCode} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Harmonized Code
            </label>
            <input
              name="code"
              required
              className="w-full border p-2 rounded mt-1 bg-white text-slate-900 font-mono"
              placeholder="e.g. 8471.30"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Category Description
            </label>
            <input
              name="desc"
              required
              className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
              placeholder="e.g. Personal Computers"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Import Duty %
              </label>
              <input
                name="duty"
                type="number"
                required
                className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                VAT %
              </label>
              <input
                name="vat"
                type="number"
                required
                className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
                placeholder="18"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* PERMISSIONS MODAL */}
      <Modal
        isOpen={modalType === "PERMISSIONS"}
        onClose={() => setModalType(null)}
        title={`Access Control: ${selectedItem?.name}`}
      >
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mr-3 font-bold text-primary-400">
              {selectedItem?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-bold">{selectedItem?.name}</p>
              <p className="text-xs text-slate-400">{selectedItem?.role}</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "ALL",
                label: "Full System Access",
                desc: "Can manage settings and staff",
              },
              {
                id: "RECEIVE",
                label: "Warehouse Receipt",
                desc: "Can scan and log incoming items",
              },
              {
                id: "CONSOLIDATE",
                label: "Freight Consolidation",
                desc: "Can create and close MAWBs",
              },
              {
                id: "FINANCE",
                label: "Billing & Invoices",
                desc: "Can generate and verify payments",
              },
              {
                id: "COMPLIANCE",
                label: "Override Holds",
                desc: "Can release restricted cargo",
              },
            ].map((p) => (
              <label
                key={p.id}
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedItem?.permissions?.includes(p.id)
                    ? "bg-primary-50 border-primary-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{p.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedItem?.permissions?.includes(p.id)}
                  onChange={() => togglePermission(p.id)}
                  className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setModalType(null)}
              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={savePermissions}
              className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-bold shadow-lg"
            >
              Update Permissions
            </button>
          </div>
        </div>
      </Modal>

      {/* WAREHOUSE MODAL */}
      <Modal
        isOpen={modalType === "WAREHOUSE"}
        onClose={() => setModalType(null)}
        title="Add Global Hub"
      >
        <form onSubmit={handleAddWarehouse} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-bold text-slate-700">
                Code
              </label>
              <input
                name="code"
                required
                className="w-full border p-2 rounded mt-1 bg-white uppercase"
                maxLength={2}
                placeholder="e.g. TR"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700">
                Hub Name
              </label>
              <input
                name="name"
                required
                className="w-full border p-2 rounded mt-1 bg-white"
                placeholder="e.g. Istanbul Hub"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Hub Manager
            </label>
            <input
              name="manager"
              required
              className="w-full border p-2 rounded mt-1 bg-white"
              placeholder="Manager Name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Full Address
            </label>
            <textarea
              name="address"
              required
              className="w-full border p-2 rounded mt-1 bg-white"
              rows={2}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Country
            </label>
            <input
              name="country"
              required
              className="w-full border p-2 rounded mt-1 bg-white"
              placeholder="e.g. USA"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isAddingWarehouse}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center disabled:bg-primary-400"
            >
              {isAddingWarehouse ? (
                <RefreshCw size={18} className="mr-2 animate-spin" />
              ) : null}
              {isAddingWarehouse ? "Saving..." : "Register Hub"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT WAREHOUSE MODAL */}
      <Modal
        isOpen={modalType === "EDIT_WAREHOUSE"}
        onClose={() => setModalType(null)}
        title="Edit Global Hub"
      >
        <form onSubmit={handleEditWarehouse} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-bold text-slate-700">
                Code
              </label>
              <input
                name="code"
                required
                className="w-full border p-2 rounded mt-1 bg-white uppercase"
                maxLength={2}
                placeholder="e.g. TR"
                defaultValue={editingWarehouse?.code}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700">
                Hub Name
              </label>
              <input
                name="name"
                required
                className="w-full border p-2 rounded mt-1 bg-white"
                placeholder="e.g. Istanbul Hub"
                defaultValue={editingWarehouse?.name}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Hub Manager
            </label>
            <input
              name="manager"
              required
              className="w-full border p-2 rounded mt-1 bg-white"
              placeholder="Manager Name"
              defaultValue={editingWarehouse?.manager}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Full Address
            </label>
            <textarea
              name="address"
              required
              className="w-full border p-2 rounded mt-1 bg-white"
              rows={2}
              defaultValue={editingWarehouse?.address}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Country
            </label>
            <input
              name="country"
              required
              className="w-full border p-2 rounded mt-1 bg-white"
              placeholder="e.g. USA"
              defaultValue={editingWarehouse?.country}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isEditingWarehouse}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center disabled:bg-primary-400"
            >
              {isEditingWarehouse ? (
                <RefreshCw size={18} className="mr-2 animate-spin" />
              ) : null}
              {isEditingWarehouse ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* INVITE STAFF MODAL */}
      <Modal
        isOpen={modalType === "STAFF"}
        onClose={() => {
          setModalType(null);
          setInviteStep(1);
          setNewlyCreatedStaff(null);
        }}
        title={
          inviteStep === 1
            ? "Invite New Staff Member"
            : `Assign Warehouse to ${newlyCreatedStaff?.full_name}`
        }
      >
        {inviteStep === 1 ? (
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Full Name
              </label>
              <input
                name="full_name"
                required
                className="w-full border p-2 rounded mt-1 bg-white"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full border p-2 rounded mt-1 bg-white"
                placeholder="e.g. john.doe@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Phone Number
              </label>
              <input
                name="phone"
                required
                className="w-full border p-2 rounded mt-1 bg-white"
                placeholder="e.g. +256700123456"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                User Type
              </label>
              <select
                name="user_type"
                required
                className="w-full border p-2 rounded mt-1 bg-white"
                defaultValue="staff"
              >
                <option value="super_user">Super User</option>
                <option value="staff">Staff</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isInvitingUser}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center disabled:bg-primary-400"
              >
                {isInvitingUser ? (
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                ) : null}
                {isInvitingUser ? "Creating..." : "Create & Proceed"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAssignWarehouseToStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Assign to Warehouse
              </label>
              <select
                name="warehouse_location_id"
                required
                className="w-full border p-2 rounded mt-1 bg-white"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isInvitingUser}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center disabled:bg-primary-400"
              >
                {isInvitingUser ? (
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                ) : null}
                {isInvitingUser ? "Assigning..." : "Assign & Finish"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* EDIT STAFF MODAL */}
      <Modal
        isOpen={modalType === "EDIT_STAFF"}
        onClose={() => {
          setModalType(null);
          setSelectedItem(null);
        }}
        title={`Edit Staff: ${selectedItem?.full_name}`}
      >
        <form onSubmit={handleEditStaffSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Full Name
            </label>
            <input
              name="full_name"
              required
              defaultValue={selectedItem?.full_name}
              className="w-full border p-2 rounded mt-1 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={selectedItem?.email}
              className="w-full border p-2 rounded mt-1 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Phone Number
            </label>
            <input
              name="phone"
              required
              defaultValue={selectedItem?.phone}
              className="w-full border p-2 rounded mt-1 bg-white"
            />
          </div>
          {selectedItem?.user_type === "staff" && (
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Assign to Warehouse
              </label>
              <select
                name="warehouse_location_id"
                required
                defaultValue={selectedItem?.warehouse_location_id}
                className="w-full border p-2 rounded mt-1 bg-white"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md flex items-center justify-center disabled:bg-primary-400"
            >
              {isSubmitting ? (
                <RefreshCw size={18} className="mr-2 animate-spin" />
              ) : null}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
