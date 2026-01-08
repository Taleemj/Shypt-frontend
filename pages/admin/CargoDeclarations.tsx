import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Trash2,
  Plus,
  Edit,
  XCircle,
  Package as PackageIcon,
  Info,
  DollarSign,
  Upload,
  Check,
  AlertOctagon,
  Scale,
  Truck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { DataTable, Column } from "../../components/UI/DataTable";
import useCargo from "../../api/cargo/useCargo";
import {
  CargoDeclaration,
  CreateCargoDeclarationPayload,
  UpdateCargoDeclarationPayload,
} from "../../api/types/cargo";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouseLocation } from "../../api/types/warehouse";
import useAuth from "../../api/auth/useAuth";
import { AuthUser } from "../../api/types/auth";

const CargoDeclarations: React.FC = () => {
  const { showToast } = useToast();
  const {
    listCargoDeclarations,
    createCargoDeclaration,
    updateCargoDeclaration,
    deleteCargoDeclaration,
  } = useCargo();
  const { fetchWareHouseLocations } = useWareHouse();
  const { fetchAllUsers } = useAuth();

  const [declarations, setDeclarations] = useState<CargoDeclaration[]>([]);
  const [warehouses, setWarehouses] = useState<WareHouseLocation[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"ADD" | "EDIT">("ADD");
  const [editingDeclaration, setEditingDeclaration] =
    useState<CargoDeclaration | null>(null);

  // Form State for ADD mode
  const [selectedWarehouse, setSelectedWarehouse] = useState("US");
  const [declaredValue, setDeclaredValue] = useState<string>("");
  const [estWeight, setEstWeight] = useState<string>("");
  const [complianceAgreed, setComplianceAgreed] = useState(false);
  const [isInsured, setIsInsured] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Bulk Action State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const resetForm = () => {
    setSelectedWarehouse("US");
    setDeclaredValue("");
    setEstWeight("");
    setComplianceAgreed(false);
    setIsInsured(false);
    setSelectedUserId("");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [declarationsRes, warehousesRes, usersRes] =
        await Promise.allSettled([
          listCargoDeclarations(),
          fetchWareHouseLocations(),
          fetchAllUsers(),
        ]);

      if (declarationsRes.status === "fulfilled") {
        setDeclarations(declarationsRes.value.data);
      } else {
        showToast("Failed to fetch delivery requests", "error");
      }
      if (warehousesRes.status === "fulfilled") {
        setWarehouses(warehousesRes.value.data);
      } else {
        showToast("Failed to fetch warehouses", "error");
      }
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data);
      } else {
        showToast("Failed to fetch users", "error");
      }
    } catch (error) {
      showToast("An error occurred while fetching data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this request?")) {
      try {
        await deleteCargoDeclaration(id);
        setDeclarations((prev) => prev.filter((d) => d.id !== id));
        showToast("Request deleted successfully", "success");
      } catch (error) {
        showToast("Failed to delete request", "error");
      }
    }
  };

  const handleEdit = (declaration: CargoDeclaration) => {
    setEditingDeclaration(declaration);
    setFormMode("EDIT");
    setIsInsured(declaration.is_insured || false);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingDeclaration(null);
    setFormMode("ADD");
    resetForm();
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      if (formMode === "ADD") {
        if (!complianceAgreed) {
          showToast(
            "You must acknowledge the prohibited items policy.",
            "error"
          );
          return;
        }
        if (Number(declaredValue) <= 0) {
          showToast(
            "Please provide a valid declared value for customs.",
            "error"
          );
          return;
        }
        if (!selectedUserId) {
          showToast("Please select a user.", "error");
          return;
        }

        const selectedWh = warehouses.find(
          (wh) => wh.code === selectedWarehouse
        );
        if (!selectedWh) {
          showToast("Please select a destination warehouse.", "error");
          return;
        }

        const payload: CreateCargoDeclarationPayload = {
          user_id: Number(selectedUserId),
          warehouse_location_id: selectedWh.id,
          internal_curier: formData.get("courier") as string,
          tracking_number: formData.get("tracking") as string,
          cargo_details: formData.get("desc") as string,
          value: Number(declaredValue),
          weight: estWeight ? Number(estWeight) : undefined,
          insured: isInsured,
        };

        await createCargoDeclaration(payload);
        showToast("Delivery Request created successfully!", "success");
      } else if (formMode === "EDIT" && editingDeclaration) {
        const payload: UpdateCargoDeclarationPayload = {
          internal_curier: formData.get("internal_curier") as string,
          tracking_number: formData.get("tracking_number") as string,
          cargo_details: formData.get("cargo_details") as string,
          value: formData.get("value")
            ? Number(formData.get("value"))
            : undefined,
          weight: formData.get("weight")
            ? Number(formData.get("weight"))
            : undefined,
          status: formData.get("status") as string,
          is_insured: editingDeclaration.is_insured,
        };
        await updateCargoDeclaration(editingDeclaration.id, payload);
        showToast("Declaration updated successfully", "success");
      }
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      showToast(
        `Failed to ${formMode === "ADD" ? "create" : "update"} request.`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<CargoDeclaration>[] = [
    {
      header: "Request ID",
      accessor: (declaration) => (
        <span className="text-primary-600 font-medium hover:underline">
          {declaration.id}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Client",
      accessor: (declaration) => (
        <div>
          {/* @ts-ignore */}
          <div className="font-medium text-slate-900">
            {/* @ts-ignore */}
            {declaration.user.full_name}
          </div>
          <div className="text-xs text-slate-500">
            {new Date(declaration.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
      // @ts-ignore
      sortKey: "user.name",
      sortable: true,
    },
    {
      header: "Delivery / Tracking",
      accessor: (cd) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-800 truncate">
            {cd.cargo_details}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
              TRK: {cd.tracking_number || "NOT PROVIDED"}
            </span>
          </div>
        </div>
      ),
      sortKey: "cargo_details",
      sortable: true,
    },
    {
      header: "Origin",
      accessor: (cd) => (
        <span className="font-bold text-slate-500">
          {cd.location?.name || "N/A"}
        </span>
      ),
      // @ts-ignore
      sortKey: "location.name",
      sortable: true,
    },
    {
      header: "Status",
      accessor: (declaration) => (
        <StatusBadge status={declaration.status.toUpperCase()} />
      ),
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (declaration) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(declaration);
            }}
            className="text-slate-400 hover:text-blue-600 p-1"
            title="Edit Request"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerNav(`/admin/cargo-declarations/${declaration.id}`);
            }}
            className="text-slate-400 hover:text-primary-600 p-1"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(declaration.id);
            }}
            className="text-slate-400 hover:text-red-600 p-1"
            title="Delete Request"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const renderEditModal = () => (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Internal Courier
        </label>
        <input
          name="internal_curier"
          type="text"
          defaultValue={editingDeclaration?.internal_curier}
          className="mt-1 w-full border border-slate-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Tracking Number
        </label>
        <input
          name="tracking_number"
          type="text"
          defaultValue={editingDeclaration?.tracking_number}
          className="mt-1 w-full border border-slate-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Delivery Details
        </label>
        <textarea
          name="delivery_details"
          defaultValue={editingDeclaration?.cargo_details}
          className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
          rows={3}
        ></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Value
          </label>
          <input
            name="value"
            type="number"
            defaultValue={editingDeclaration?.value}
            className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Weight (kg)
          </label>
          <input
            name="weight"
            type="number"
            step="0.01"
            defaultValue={editingDeclaration?.weight}
            className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          name="status"
          defaultValue={editingDeclaration?.status}
          className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
        >
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="declined">Declined</option>
        </select>
      </div>
      <div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="is_insured"
            checked={editingDeclaration?.is_insured || false}
            onChange={(e) =>
              setEditingDeclaration((prev) =>
                prev ? { ...prev, is_insured: e.target.checked } : null
              )
            }
            className="mt-0.5 w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0"
          />
          <span className="text-sm font-medium text-slate-700">Insured</span>
        </label>
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setIsFormOpen(false)}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center disabled:bg-primary-400"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );

  const renderAddModal = () => (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      {/* STEP 1: Select User */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          1. Select User
        </label>
        <select
          name="user_id"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          required
          className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="" disabled>
            -- Select a client --
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {/* @ts-ignore */}
              {user.full_name || user.name}
            </option>
          ))}
        </select>
      </div>

      {/* STEP 2: ORIGIN HUB SELECTOR */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          2. Select Destination Warehouse
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {warehouses.map((wh) => (
            <button
              key={wh.code}
              type="button"
              onClick={() => setSelectedWarehouse(wh.code)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all group ${
                selectedWarehouse === wh.code
                  ? "border-primary-600 bg-primary-50 ring-4 ring-primary-50"
                  : "border-slate-100 hover:border-slate-200 bg-white"
              }`}
            >
              {selectedWarehouse === wh.code && (
                <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-0.5">
                  <Check size={12} />
                </div>
              )}
              <p
                className={`text-xs font-black uppercase tracking-tighter ${
                  selectedWarehouse === wh.code
                    ? "text-primary-700"
                    : "text-slate-400"
                }`}
              >
                {wh.name}
              </p>
              {/* @ts-ignore */}
              <p className="font-bold text-slate-900 mt-1">{wh.city}</p>
              <p className="text-[10px] text-slate-500 mt-2 font-mono leading-tight group-hover:text-slate-700">
                {wh.address}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: LOGISTICS DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            3. Tracking Information
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Internal Courier (Delivery to Whse)
            </label>
            <div className="relative">
              <Truck
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <select
                name="courier"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>UPS (United Parcel Service)</option>
                <option>FedEx</option>
                <option>USPS (Postal Service)</option>
                <option>Amazon Logistics</option>
                <option>DHL Express</option>
                <option>Other / Private Carrier</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Tracking Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <PackageIcon
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <input
                name="tracking"
                required
                placeholder="e.g. 1Z99... or TBA..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic flex items-center">
              <Info size={10} className="mr-1" /> This helps us identify your
              box immediately on arrival.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            4. Delivery Details
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="desc"
              required
              rows={4}
              placeholder="Please itemize everything inside (e.g. 2x Blue Jeans, 1x Sony Headphones, 3x Vitamin C supplements)"
              className="w-full p-4 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Declared Value ($)
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-3 text-slate-400"
                  size={16}
                />
                <input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Est. Weight (kg)
              </label>
              <div className="relative">
                <Scale
                  className="absolute left-3 top-3 text-slate-400"
                  size={16}
                />
                <input
                  type="number"
                  step="0.01"
                  value={estWeight}
                  onChange={(e) => setEstWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLIANCE & ATTACHMENT */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
        <div className="absolute -right-8 -top-8 text-white/5 rotate-12">
          <AlertOctagon size={160} />
        </div>
        <div className="relative z-10">
          <h4 className="flex items-center text-xs font-black uppercase tracking-widest text-primary-400 mb-4">
            <AlertCircle size={14} className="mr-2" /> Prohibited Items &
            Compliance
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-6">
            By declaring this cargo, you certify that it contains no{" "}
            <strong>
              Liquids, Batteries (loose), Explosives, or Narcotics
            </strong>
            . Undeclared prohibited items will result in a $100 compliance fine
            and cargo seizure.
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            <label className="flex-1 border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center hover:border-primary-500 hover:bg-slate-800 transition cursor-pointer group">
              <Upload
                size={24}
                className="text-slate-500 group-hover:text-primary-400 mb-2"
              />
              <span className="text-[10px] font-bold uppercase tracking-tight">
                Upload Vendor Invoice
              </span>
              <span className="text-[9px] text-slate-500 mt-1">
                PDF or JPG only
              </span>
              <input type="file" className="hidden" />
            </label>
            <div className="flex flex-col w-[40%]">
              <div className="flex-1 flex items-center">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                      isInsured
                        ? "bg-primary-500 border-primary-500"
                        : "border-slate-600 bg-slate-800 group-hover:border-slate-400"
                    }`}
                  >
                    {isInsured && <Check size={14} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isInsured}
                    onChange={() => setIsInsured(!isInsured)}
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    insured?
                  </span>
                </label>
              </div>

              <div className="flex-1 flex items-center">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                      complianceAgreed
                        ? "bg-primary-500 border-primary-500"
                        : "border-slate-600 bg-slate-800 group-hover:border-slate-400"
                    }`}
                  >
                    {complianceAgreed && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={complianceAgreed}
                    onChange={() => setComplianceAgreed(!complianceAgreed)}
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    I confirm these details are accurate for URA Customs and
                    acknowledge the prohibited items list.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setIsFormOpen(false);
            resetForm();
          }}
          className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!complianceAgreed || isSubmitting}
          className={`px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-xl flex justify-center items-center ${
            complianceAgreed
              ? "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-3" /> Submitting...
            </>
          ) : (
            "Submit Delivery Request"
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Delivery Requests
          </h2>
          <p className="text-slate-500 text-sm">
            Manage all client delivery requests.
          </p>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-slate-800 text-white p-4 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2 fade-in shadow-lg">
          <div className="flex items-center">
            <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold mr-3">
              {selectedIds.length} Selected
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}

      <DataTable
        data={declarations}
        columns={columns}
        loading={loading}
        onRowClick={(declaration) =>
          triggerNav(`/admin/requests/${declaration.id}`)
        }
        title="All Requests"
        searchPlaceholder="Search by tracking #, client, or description..."
        selectable={true}
        // @ts-ignore
        selectedRowIds={selectedIds}
        // @ts-ignore
        onSelectionChange={setSelectedIds}
        primaryAction={
          <button
            onClick={handleAdd}
            className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Create Delivery Request
          </button>
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === "ADD" ? "Create New Request" : "Edit Request"}
        size="lg"
      >
        {formMode === "ADD" ? renderAddModal() : renderEditModal()}
      </Modal>
    </div>
  );
};

export default CargoDeclarations;
