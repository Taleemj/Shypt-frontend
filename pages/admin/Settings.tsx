import React, { useState, useMemo } from "react";
import {
  Save,
  Globe,
  Bell,
  Shield,
  Database,
  DollarSign,
  Mail,
  Plus,
  Trash2,
  Edit,
  BookOpen,
  Settings as SettingsIcon,
  CheckCircle,
  X,
  Lock,
  Eye,
  ShieldCheck,
  RefreshCw,
  LayoutGrid,
  Layers,
  MapPin,
  MoreVertical,
  Activity,
  Printer,
  ClipboardCheck,
  ArrowRightLeft,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/UI/Modal";
import { DataTable, Column } from "../../components/UI/DataTable";
import StatusBadge from "../../components/UI/StatusBadge";

interface HSCode {
  // Added id for DataTable compatibility
  id: string;
  code: string;
  desc: string;
  duty: number;
  vat: number;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  permissions: string[];
}

interface Warehouse {
  // Added id for DataTable compatibility
  id: string;
  code: string;
  name: string;
  address: string;
  active: boolean;
  rackCount: number;
  manager: string;
}

interface WarehouseRack {
  id: string;
  warehouseCode: string;
  zoneName: string;
  binStart: number;
  binEnd: number;
  capacity: number;
  occupancy: number; // Percentage
  type: "SHELF" | "PALLET" | "BULK" | "COLD" | "FRAGILE";
  lastAudited?: string;
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
  >("GENERAL");

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

  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    {
      id: "CN",
      code: "CN",
      name: "Guangzhou Hub",
      address: "Baiyun District, Guangzhou",
      active: true,
      rackCount: 12,
      manager: "Chen Wei",
    },
    {
      id: "US",
      code: "US",
      name: "New York JKF",
      address: "Jamaica, NY 11430",
      active: true,
      rackCount: 8,
      manager: "James Miller",
    },
    {
      id: "UK",
      code: "UK",
      name: "London Heathrow",
      address: "Hounslow, TW6",
      active: true,
      rackCount: 5,
      manager: "Sarah Smith",
    },
    {
      id: "AE",
      code: "AE",
      name: "Dubai DXB",
      address: "Deira, Dubai",
      active: true,
      rackCount: 15,
      manager: "Ahmed Ali",
    },
  ]);

  const [racks, setRacks] = useState<WarehouseRack[]>([
    {
      id: "R-101",
      warehouseCode: "CN",
      zoneName: "Row A",
      binStart: 1,
      binEnd: 20,
      capacity: 50,
      occupancy: 85,
      type: "SHELF",
      lastAudited: "2025-02-28",
    },
    {
      id: "R-102",
      warehouseCode: "CN",
      zoneName: "Row B",
      binStart: 1,
      binEnd: 10,
      capacity: 20,
      occupancy: 12,
      type: "FRAGILE",
      lastAudited: "2025-03-01",
    },
    {
      id: "R-201",
      warehouseCode: "US",
      zoneName: "Staging Area",
      binStart: 1,
      binEnd: 50,
      capacity: 100,
      occupancy: 45,
      type: "PALLET",
      lastAudited: "2025-02-15",
    },
    {
      id: "R-301",
      warehouseCode: "AE",
      zoneName: "Cold Store 1",
      binStart: 1,
      binEnd: 5,
      capacity: 10,
      occupancy: 90,
      type: "COLD",
      lastAudited: "2025-03-02",
    },
  ]);

  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: 1,
      name: "Sarah Jenkins",
      email: "s.jenkins@shypt.net",
      role: "Super Admin",
      permissions: ["ALL"],
    },
    {
      id: 2,
      name: "Mike Omondi",
      email: "m.omondi@shypt.net",
      role: "Warehouse Mgr",
      permissions: ["RECEIVE", "CONSOLIDATE"],
    },
  ]);

  // Modal States
  const [modalType, setModalType] = useState<
    "WAREHOUSE" | "STAFF" | "HS_CODE" | "PERMISSIONS" | "RACK" | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  // --- ACTIONS ---
  const handleSaveGlobal = () => {
    showToast("System configuration saved successfully", "success");
  };

  // Fix: Added implementation for handleTestSmtp
  const handleTestSmtp = () => {
    setIsTestingSmtp(true);
    setTimeout(() => {
      setIsTestingSmtp(false);
      showToast("SMTP connection successful", "success");
    }, 2000);
  };

  const handleAddWarehouse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = fd.get("code") as string;
    const newWh: Warehouse = {
      // Added id
      id: code,
      code: code,
      name: fd.get("name") as string,
      address: fd.get("address") as string,
      manager: fd.get("manager") as string,
      active: true,
      rackCount: 0,
    };
    setWarehouses([...warehouses, newWh]);
    showToast(`Warehouse ${newWh.code} registered`, "success");
    setModalType(null);
  };

  // Fix: Added implementation for handleAddHSCode
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

  const handleAddRack = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newRack: WarehouseRack = {
      id: `R-${Math.floor(Math.random() * 900) + 100}`,
      warehouseCode: fd.get("wh") as string,
      zoneName: fd.get("zone") as string,
      binStart: Number(fd.get("start")),
      binEnd: Number(fd.get("end")),
      capacity: Number(fd.get("cap")),
      occupancy: 0,
      type: fd.get("type") as any,
      lastAudited: new Date().toISOString().split("T")[0],
    };
    setRacks([...racks, newRack]);
    showToast(`${newRack.zoneName} added to inventory map`, "success");
    setModalType(null);
  };

  // Fix: Added implementation for togglePermission
  const togglePermission = (permId: string) => {
    if (!selectedItem) return;
    const currentPerms = selectedItem.permissions || [];
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((p: string) => p !== permId)
      : [...currentPerms, permId];

    setSelectedItem({ ...selectedItem, permissions: newPerms });
  };

  // Fix: Added implementation for savePermissions
  const savePermissions = () => {
    if (!selectedItem) return;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === selectedItem.id
          ? { ...s, permissions: selectedItem.permissions }
          : s
      )
    );
    showToast("Permissions updated", "success");
    setModalType(null);
  };

  const handleAuditRack = (id: string) => {
    setRacks((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, lastAudited: new Date().toISOString().split("T")[0] }
          : r
      )
    );
    showToast(`Rack ${id} marked as audited`, "success");
  };

  const deleteRack = (id: string) => {
    if (confirm("Permanently remove this rack from warehouse mapping?")) {
      setRacks(racks.filter((r) => r.id !== id));
      showToast("Rack configuration deleted", "info");
    }
  };

  const toggleWhStatus = (code: string) => {
    setWarehouses((prev) =>
      prev.map((w) => (w.code === code ? { ...w, active: !w.active } : w))
    );
    showToast("Warehouse operational status toggled", "info");
  };

  // --- DATATABLE COLUMNS ---

  const warehouseColumns: Column<Warehouse>[] = [
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
          {wh.rackCount} Configured Racks
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
            onClick={() => toggleWhStatus(wh.code)}
            className="p-1.5 text-slate-500 hover:text-primary-600 rounded bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition"
          >
            <Activity size={16} />
          </button>
          <button className="p-1.5 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition">
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
      accessor: "warehouseCode",
      sortKey: "warehouseCode",
      sortable: true,
      className: "font-bold text-primary-700",
    },
    {
      header: "Zone / Type",
      accessor: (r) => (
        <div>
          <div className="font-bold text-slate-800 text-xs uppercase">
            {r.zoneName}
          </div>
          <div className="text-[10px] text-slate-400 font-bold tracking-widest">
            {r.type}
          </div>
        </div>
      ),
      sortKey: "zoneName",
      sortable: true,
    },
    {
      header: "Bins",
      accessor: (r) => (
        <span className="text-xs text-slate-600">
          {r.binStart} - {r.binEnd}
        </span>
      ),
    },
    {
      header: "Occupancy",
      accessor: (r) => (
        <div className="w-32">
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span
              className={r.occupancy > 80 ? "text-red-600" : "text-slate-500"}
            >
              {r.occupancy}%
            </span>
            <span className="text-slate-400">Cap: {r.capacity}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                r.occupancy > 80
                  ? "bg-red-500"
                  : r.occupancy > 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${r.occupancy}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      header: "Last Audit",
      accessor: (r) => (
        <span className="text-xs text-slate-500">
          {r.lastAudited || "Never"}
        </span>
      ),
      sortKey: "lastAudited",
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
            onClick={() => deleteRack(r.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Delete Rack"
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
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4">
                  Company Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-1 w-full border border-slate-300 rounded p-2 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Official Support Email
                    </label>
                    <input
                      type="email"
                      defaultValue="support@shypt.net"
                      className="mt-1 w-full border border-slate-300 rounded p-2 text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4 flex items-center">
                  <DollarSign size={20} className="mr-2 text-green-600" />{" "}
                  Currency & Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Global Exchange Rate (1 USD)
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-slate-500 font-bold">
                        UGX
                      </span>
                      <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 pl-14 text-slate-900 bg-white font-black text-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Shopping Buffer (%)
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={buffer}
                        onChange={(e) => setBuffer(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-slate-900 bg-white font-bold"
                      />
                      <span className="absolute right-3 top-2 text-slate-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "HS_CODES" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-800">
                    HS Codes & Tax Rates
                  </h3>
                  <p className="text-sm text-slate-500">
                    Used for URA tax estimation during deconsolidation.
                  </p>
                </div>
                <button
                  onClick={() => setModalType("HS_CODE")}
                  className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center"
                >
                  <Plus size={16} className="mr-2" /> Add Code
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">HS Code</th>
                      <th className="p-4">Category Description</th>
                      <th className="p-4 text-right">Duty %</th>
                      <th className="p-4 text-right">VAT %</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hsCodes.map((code) => (
                      <tr
                        key={code.code}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {code.code}
                        </td>
                        <td className="p-4 text-slate-600">{code.desc}</td>
                        <td className="p-4 text-right font-medium">
                          {code.duty}%
                        </td>
                        <td className="p-4 text-right font-medium">
                          {code.vat}%
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-slate-400 hover:text-red-600 p-1">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "WAREHOUSES" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-800">
                    Warehouse Network
                  </h3>
                  <p className="text-sm text-slate-500">
                    Manage global origin and destination hubs.
                  </p>
                </div>
              </div>

              <DataTable
                data={warehouses}
                columns={warehouseColumns}
                title="Global Hub Registry"
                primaryAction={
                  <button
                    onClick={() => setModalType("WAREHOUSE")}
                    className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-slate-800 flex items-center shadow-sm"
                  >
                    <Plus size={14} className="mr-1" /> Add Hub
                  </button>
                }
              />
            </div>
          )}

          {activeTab === "LOCATIONS" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-800">
                    Inventory Map & Racks
                  </h3>
                  <p className="text-sm text-slate-500">
                    Define floor zones, rack IDs, and bin ranges across all
                    hubs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    Total Racks
                  </p>
                  <p className="text-2xl font-black text-blue-900">
                    {racks.length}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                    High Occupancy
                  </p>
                  <p className="text-2xl font-black text-red-900">
                    {racks.filter((r) => r.occupancy > 80).length}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                    Pending Audit
                  </p>
                  <p className="text-2xl font-black text-orange-900">2</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Free Space
                  </p>
                  <p className="text-2xl font-black text-slate-900">42%</p>
                </div>
              </div>

              <DataTable
                data={racks}
                columns={rackColumns}
                title="Storage Configuration"
                searchPlaceholder="Search Zone, ID or Warehouse..."
                primaryAction={
                  <button
                    onClick={() => setModalType("RACK")}
                    className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-slate-800 flex items-center shadow-sm"
                  >
                    <Plus size={14} className="mr-1" /> New Rack
                  </button>
                }
              />
            </div>
          )}

          {activeTab === "NOTIFICATIONS" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <Mail className="text-blue-600 mr-4" size={32} />
                  <div>
                    <h4 className="font-bold text-blue-900">
                      Email Infrastructure
                    </h4>
                    <p className="text-sm text-blue-700">
                      Configure how the system sends alerts to clients.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTestSmtp}
                  disabled={isTestingSmtp}
                  className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center"
                >
                  {isTestingSmtp ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                  ) : (
                    <CheckCircle size={16} className="mr-2" />
                  )}
                  Test Connection
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    defaultValue="smtp.sendgrid.net"
                    className="mt-1 w-full border border-slate-300 rounded p-2 bg-white"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700">
                    SMTP Port
                  </label>
                  <input
                    type="text"
                    defaultValue="587"
                    className="w-24 mt-1 border border-slate-300 rounded p-2 bg-white"
                  />
                </div>
              </div>

              <div className="pt-8 border-t">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Event-Driven Alerts
                </h3>
                <div className="space-y-3">
                  {[
                    "Package Receipt",
                    "Manifest Departure",
                    "Customs Arrival",
                    "Invoice Issued",
                  ].map((e) => (
                    <div
                      key={e}
                      className="flex items-center justify-between p-4 border border-slate-100 rounded-lg"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {e}
                      </span>
                      <div className="flex gap-4">
                        <label className="flex items-center text-xs text-slate-500">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="mr-2 rounded text-primary-600"
                          />{" "}
                          Email
                        </label>
                        <label className="flex items-center text-xs text-slate-500">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="mr-2 rounded text-primary-600"
                          />{" "}
                          SMS
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "SECURITY" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                <h4 className="font-bold text-red-800 flex items-center text-lg">
                  <Shield size={24} className="mr-3" /> Critical Operations
                  Security
                </h4>
                <p className="text-sm text-red-700 mt-2 leading-relaxed">
                  Enabling <strong>Strict Compliance Mode</strong> forces a
                  secondary PIN verification whenever a staff member attempts to
                  release cargo flagged by URA or Warehouse Compliance.
                </p>
                <div className="mt-4 flex items-center justify-between bg-white/50 p-3 rounded-lg border border-red-100">
                  <span className="text-sm font-bold text-red-900">
                    Require Supervisor PIN for Release
                  </span>
                  <button className="w-12 h-6 bg-red-600 rounded-full relative">
                    <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-slate-800">
                    Staff Access Control
                  </h3>
                  <button
                    onClick={() => setModalType("STAFF")}
                    className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 font-bold"
                  >
                    + Invite User
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Permissions</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">
                              {s.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {s.email}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {s.role}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {s.permissions.map((p) => (
                                <span
                                  key={p}
                                  className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-bold"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedItem(s);
                                setModalType("PERMISSIONS");
                              }}
                              className="text-primary-600 hover:bg-primary-50 p-1.5 rounded transition"
                              title="Edit Permissions"
                            >
                              <Lock size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

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
                <option key={wh.code} value={wh.code}>
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
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md"
            >
              Add to Inventory Map
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
              {selectedItem?.name.charAt(0)}
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
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold shadow-md"
            >
              Register Hub
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
