import React, { useState, useEffect } from "react";
import {
  Plane,
  Ship,
  Anchor,
  ArrowRight,
  Calendar,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { DataTable, Column } from "../../components/UI/DataTable";
import useConsolidation from "../../api/consolidation/useConsolidation";
import { Consolidation } from "../../api/types/consolidation";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouseLocation } from "../../api/types/warehouse";

const Freight: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"AIR" | "SEA">("AIR");
  const {
    getConsolidationBatches,
    createConsolidationBatch,
    updateConsolidationBatch,
  } = useConsolidation();
  const { fetchWareHouseLocations } = useWareHouse();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<WareHouseLocation[]>([]);

  // Navigation Helper
  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  // CRUD States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"ADD" | "EDIT">("ADD");
  const [editingShipment, setEditingShipment] = useState<Consolidation | null>(
    null
  );

  const [allShipments, setAllShipments] = useState<Consolidation[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [consolidationsResult, warehousesResult] =
          await Promise.allSettled([
            getConsolidationBatches(),
            fetchWareHouseLocations(),
          ]);

        if (consolidationsResult.status === "fulfilled") {
          setAllShipments(consolidationsResult.value || []);
        } else {
          showToast("Failed to load freight data", "error");
          console.error(consolidationsResult.reason);
        }

        if (warehousesResult.status === "fulfilled") {
          // @ts-ignore
          setWarehouses(warehousesResult.value.data || []);
        } else {
          showToast("Failed to load warehouses", "error");
          console.error(warehousesResult.reason);
        }
      } catch (error) {
        showToast("Failed to load initial data", "error");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const shipments = allShipments.filter((s) => s.transport_mode === activeTab);

  // Handlers
  const handleAdd = () => {
    setEditingShipment(null);
    setFormMode("ADD");
    setIsFormOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, shipment: Consolidation) => {
    e.stopPropagation();
    setEditingShipment(shipment);
    setFormMode("EDIT");
    setIsFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this shipment?")) {
      setAllShipments((prev) => prev.filter((s) => s.id !== id));
      showToast("Shipment record deleted successfully", "success");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const consolidationData: Partial<Consolidation> = {
      transport_mode: activeTab,
      container_flight_number: formData.get("flight_vessel") as string,
      departure_date: formData.get("etd") as string,
      total_weight: Number(formData.get("weight") as string),
      status: formData.get("status") as
        | "OPEN"
        | "FINALIZED"
        | "DEPARTED"
        | "ARRIVED",
      warehouse_location_id: Number(formData.get("warehouse_location_id")),
    };

    setLoading(true);
    try {
      if (formMode === "ADD") {
        const res = await createConsolidationBatch(consolidationData);
        setAllShipments([...allShipments, res.data]);
        showToast(res.message, "success");
      } else if (editingShipment) {
        const res = await updateConsolidationBatch(
          editingShipment.id,
          consolidationData
        );
        setAllShipments((prev) =>
          prev.map((s) => (s.id === editingShipment.id ? res.data : s))
        );
        showToast(res.message, "success");
      }
      setIsFormOpen(false);
    } catch (error) {
      showToast("Operation failed. Check console for details.", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- COLUMN DEFINITIONS ---
  const columns: Column<Consolidation>[] = [
    {
      header: activeTab === "AIR" ? "MAWB Number" : "MBL Number",
      accessor: (s) => (
        <div>
          <div className="font-bold text-primary-700 hover:text-primary-900 hover:underline">
            {s.mawb_number || `ID: ${s.id}`}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {s.transport_mode}
          </div>
        </div>
      ),
      sortKey: "mawb_number",
      sortable: true,
    },
    {
      header: "Route",
      accessor: (s) => (
        <div className="flex items-center text-sm font-semibold text-slate-800">
          <span>{`WH-${s.warehouse_location_id}`}</span>
          <ArrowRight size={14} className="mx-2 text-slate-400" />
          <span>DESTINATION</span>
        </div>
      ),
      sortKey: "warehouse_location_id",
      sortable: true,
    },
    {
      header: "Carrier Info",
      accessor: (s) => (
        <div className="text-sm">
          {/* <div className="font-bold text-slate-900">Unknown Carrier</div> */}
          <div className="text-xs text-slate-600 font-medium">
            {s.transport_mode === "AIR"
              ? `Flight: ${s.container_flight_number}`
              : `Vessel: ${s.container_flight_number}`}
          </div>
          {s.transport_mode === "SEA" && (
            <div className="text-xs text-slate-500 mt-0.5">Voy: N/A</div>
          )}
        </div>
      ),
      sortKey: "container_flight_number",
      sortable: true,
    },
    {
      header: "Schedule",
      accessor: (s) => {
        const formatDateTime = (dateString: string | undefined | null) => {
          if (!dateString) return "N/A";
          try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }).format(date);
          } catch (e) {
            console.error("Error formatting date:", e);
            return dateString;
          }
        };

        return (
          <div className="text-sm text-slate-700 w-32">
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">ETD:</span>
              <span className="font-medium">
                {formatDateTime(s.departure_date)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-500">ETA:</span>
              <span className="font-bold text-slate-900">
                {s.arrived_at || "N/A"}
              </span>
            </div>
          </div>
        );
      },
      sortKey: "departure_date",
      sortable: true,
    },
    {
      header: "Load",
      accessor: (s) => (
        <div>
          <div className="text-slate-900 font-medium">
            {s.package_count} pkgs
          </div>
          <div className="text-xs text-slate-500">{s.total_weight} kg</div>
        </div>
      ),
      sortKey: "package_count",
      sortable: true,
    },
    {
      header: "Status",
      accessor: (s) => <StatusBadge status={s.status || "UNKNOWN"} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (s) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => handleEdit(e, s)}
            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
            title="Edit Shipment"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => handleDelete(e, s.id)}
            className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
            title="Delete Shipment"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Freight Management
          </h2>
          <p className="text-slate-600 text-sm">
            Track and manage Master Shipments (MAWB/MBL).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-800 font-bold text-sm">
                Active {activeTab === "AIR" ? "Flights" : "Voyages"}
              </p>
              <h3 className="text-3xl font-extrabold text-blue-950 mt-2">
                {shipments.length}
              </h3>
            </div>
            <div className="bg-white p-2 rounded-lg bg-opacity-80 border border-blue-100">
              {activeTab === "AIR" ? (
                <Plane className="text-blue-600" />
              ) : (
                <Anchor className="text-blue-600" />
              )}
            </div>
          </div>
        </div>
        {/* <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-800 font-bold text-sm">
                Arriving Today
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-950 mt-2">
                1
              </h3>
            </div>
            <div className="bg-white p-2 rounded-lg bg-opacity-80 border border-emerald-100">
              <Calendar className="text-emerald-600" />
            </div>
          </div>
        </div> */}
        {/* <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-700 font-bold text-sm">Total Weight</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                12.5t
              </h3>
            </div>
            <div className="bg-white p-2 rounded-lg bg-opacity-80 border border-slate-200">
              <Anchor className="text-slate-600" />
            </div>
          </div>
        </div> */}
      </div>

      {/* Data Table with Tabs */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading freight data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 flex px-2">
            <button
              onClick={() => setActiveTab("AIR")}
              className={`flex items-center px-6 py-3 text-sm font-bold border-b-2 transition ${
                activeTab === "AIR"
                  ? "border-primary-600 text-primary-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Plane size={16} className="mr-2" /> Air Freight
            </button>
            <button
              onClick={() => setActiveTab("SEA")}
              className={`flex items-center px-6 py-3 text-sm font-bold border-b-2 transition ${
                activeTab === "SEA"
                  ? "border-primary-600 text-primary-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Ship size={16} className="mr-2" /> Sea Freight
            </button>
          </div>

          <DataTable
            data={shipments}
            columns={columns}
            onRowClick={(s) => triggerNav(`/admin/freight/${s.id}`)}
            title={`Active ${activeTab === "AIR" ? "Air" : "Sea"} Manifests`}
            searchPlaceholder={`Search ${activeTab} Shipments...`}
            primaryAction={
              <button
                onClick={handleAdd}
                className="flex items-center bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition shadow-sm font-medium text-sm"
              >
                <Plus size={16} className="mr-2" />
                New Manifest
              </button>
            }
          />
        </div>
      )}

      {/* ADD/EDIT FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={`${formMode === "ADD" ? "Create" : "Edit"} ${
          activeTab === "AIR" ? "Air" : "Sea"
        } Shipment`}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700">
                Origin Warehouse
              </label>
              <select
                name="warehouse_location_id"
                required
                defaultValue={editingShipment?.warehouse_location_id}
                className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                {activeTab === "AIR" ? "Flight No." : "Vessel Name"}
              </label>
              <input
                name="flight_vessel"
                required
                defaultValue={editingShipment?.container_flight_number}
                className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                ETD
              </label>
              <input
                type="date"
                name="etd"
                required
                defaultValue={editingShipment?.departure_date}
                className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Total Weight (kg)
              </label>
              <input
                name="weight"
                type="number"
                step="0.01"
                defaultValue={
                  editingShipment ? editingShipment.total_weight : ""
                }
                className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Status
              </label>
              <select
                name="status"
                defaultValue={editingShipment?.status || "OPEN"}
                className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="OPEN">Open</option>
                <option value="FINALIZED">Finalized</option>
                <option value="DEPARTED">Departed</option>
                <option value="ARRIVED">Arrived</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-slate-700 mr-2 hover:bg-slate-100 rounded border border-slate-300 bg-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-medium"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : formMode === "ADD"
                ? "Create Shipment"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Freight;
