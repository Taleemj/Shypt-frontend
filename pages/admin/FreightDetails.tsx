import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  Plane,
  Ship,
  Container,
  Box,
  CheckCircle,
  Navigation,
  FileText,
  Layers,
  MoreVertical,
  Trash2,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import {
  Watermark,
  SecurityFooter,
  SecureHeader,
} from "../../components/UI/SecurityFeatures";
import useConsolidation from "../../api/consolidation/useConsolidation";
import {
  Consolidation,
  ConsolidationPackage,
} from "../../api/types/consolidation";
import { useParams } from "react-router-dom";

const FreightDetails: React.FC = () => {
  const { showToast } = useToast();
  const { freightId } = useParams<{ freightId: string }>();
  const id = freightId;
  const { getConsolidationBatch, updateConsolidationBatch } =
    useConsolidation();

  const [shipment, setShipment] = useState<Consolidation | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation Helper
  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  useEffect(() => {
    console.log("", id);
    const fetchShipment = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getConsolidationBatch(parseInt(id, 10));
        setShipment(data);
      } catch (error) {
        console.error("Failed to fetch shipment details:", error);
        showToast("Failed to load shipment data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [id]);

  const handleAction = async (action: "DEPART" | "ARRIVE" | "PRINT") => {
    if (!shipment) return;

    const performUpdate = async (status: Consolidation["status"]) => {
      try {
        const updated = await updateConsolidationBatch(shipment.id, { status });
        setShipment(updated.data);
        showToast(updated.message, "success");
      } catch (error) {
        console.error(`Failed to mark as ${status}:`, error);
        showToast(`Error updating status.`, "error");
      }
    };

    switch (action) {
      case "DEPART":
        if (
          confirm(
            `Confirm departure of ${
              shipment.mawb_number || `ID: ${shipment.id}`
            }? This may notify clients.`
          )
        ) {
          await performUpdate("DEPARTED");
        }
        break;
      case "ARRIVE":
        if (confirm(`Confirm arrival at destination?`)) {
          await performUpdate("ARRIVED");
        }
        break;
      case "PRINT":
        const originalTitle = document.title;
        document.title = `Shypt_Manifest_${
          shipment.mawb_number || shipment.id
        }`;
        window.print();
        document.title = originalTitle;
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading freight details...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-slate-700">
          Shipment Not Found
        </h3>
        <p className="text-slate-500">
          The requested freight details could not be loaded.
        </p>
        <button
          onClick={() => triggerNav("/admin/freight")}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <button
            onClick={() => triggerNav("/admin/freight")}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              {shipment.mawb_number || `ID: ${shipment.id}`}
              <span className="ml-3">
                <StatusBadge status={shipment.status || "UNKNOWN"} />
              </span>
            </h2>
            <div className="flex items-center text-sm text-slate-500 mt-1">
              {shipment.transport_mode === "AIR" ? (
                <Plane size={14} className="mr-1" />
              ) : (
                <Ship size={14} className="mr-1" />
              )}
              <span>
                {`WH-${shipment.warehouse_location_id}`} &rarr; DESTINATION
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction("PRINT")}
            className="flex items-center px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm"
          >
            <Printer size={16} className="mr-2" /> Manifest
          </button>

          {shipment.status === "FINALIZED" && (
            <button
              onClick={() => handleAction("DEPART")}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow-sm"
            >
              <Navigation size={16} className="mr-2" /> Depart Origin
            </button>
          )}

          {shipment.status === "DEPARTED" && (
            <button
              onClick={() => handleAction("ARRIVE")}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium shadow-sm"
            >
              <CheckCircle size={16} className="mr-2" /> Mark Arrived
            </button>
          )}

          {shipment.status === "ARRIVED" && (
            <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
              <CheckCircle size={16} className="mr-2" /> Arrived at Dest.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Main Content: Manifest List */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
          <div className="print:block hidden">
            <SecureHeader title="Master Manifest" />
            <Watermark text="CONFIDENTIAL" />
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-3 gap-4 print:mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-bold">
                Carrier info
              </p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {shipment.transport_mode === "AIR" ? "Flight" : "Vessel"}
              </p>
              <p className="text-sm text-slate-600">
                {shipment.container_flight_number}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-bold">
                Total Load
              </p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {shipment.packages.reduce((acc, curr) => acc + curr.weight, 0)}{" "}
                kg
              </p>
              <p className="text-sm text-slate-600">
                {shipment.package_count} Packages
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-bold">
                Timeline
              </p>
              <div className="mt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ETD:</span>
                  <span className="font-medium">
                    {formatDateTime(shipment.departure_date)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-500">ETA:</span>
                  <span className="font-medium">
                    {formatDateTime(shipment.arrived_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:bg-transparent print:border-slate-800">
              <h3 className="font-bold text-slate-800">
                Manifested Items ({shipment.packages.length})
              </h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-white text-slate-500 text-xs uppercase font-medium border-b border-slate-100 print:bg-transparent print:border-slate-800">
                <tr>
                  <th className="px-6 py-3 print:px-0">HWB</th>
                  <th className="px-6 py-3 print:px-0">Order Tracking No</th>
                  <th className="px-6 py-3 print:px-0">Client</th>
                  <th className="px-6 py-3 print:px-0">Description</th>
                  <th className="px-6 py-3 text-right print:px-0">Weight</th>
                  <th className="px-6 py-3 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                {shipment.packages.map((pkg: ConsolidationPackage) => (
                  <tr
                    key={pkg.id}
                    className="hover:bg-slate-50 print:hover:bg-transparent"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 print:px-0">
                      {pkg.hwb_number}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-slate-600 print:px-0 hover:underline cursor-pointer"
                      onClick={() =>
                        triggerNav(`/admin/orders/${pkg.order_id}`)
                      }
                    >
                      #{pkg.order.tracking_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 print:px-0">
                      {pkg.order?.user?.full_name || "N/A"}
                      {pkg.order?.user?.email && (
                        <span className="block text-xs text-slate-400">
                          {pkg.order?.user?.email}
                        </span>
                      )}
                      {pkg.order?.user?.phone && (
                        <span className="block text-xs text-slate-400">
                          {pkg.order?.user?.phone}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 print:px-0">
                      {pkg.contents}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium print:px-0">
                      {pkg.weight} kg
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <button
                        className="text-slate-400 hover:text-blue-600 p-1"
                        onClick={() => triggerNav(`/admin/inventory/${pkg.id}`)}
                      >
                        <Box size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="print:block hidden">
            <SecurityFooter
              type="CONFIDENTIAL"
              reference={shipment.mawb_number || `ID: ${shipment.id}`}
            />
          </div>
        </div>

        {/* Sidebar - Hidden on Print */}
        <div className="space-y-6 print:hidden">
          {shipment.transport_mode === "SEA" && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <Container size={18} className="mr-2 text-slate-500" />{" "}
                Container Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Container No.</span>
                  <span className="font-mono font-medium">
                    {shipment.container_flight_number}
                  </span>
                </div>
                {/* <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Seal No.</span>
                  <span className="font-mono font-medium">{shipment.seal}</span>
                </div> */}
              </div>
            </div>
          )}

          {/* <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <FileText size={18} className="mr-2 text-slate-500" /> Documents
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-slate-400 text-center">No documents uploaded.</p>
              <button className="w-full py-2 border border-dashed border-slate-300 rounded text-slate-500 text-xs hover:bg-slate-50 transition">
                + Upload Document
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default FreightDetails;
