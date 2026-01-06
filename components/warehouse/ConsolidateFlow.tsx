import React from "react";
import { Layers, X, Plane, FileText, Printer, Navigation } from "lucide-react";
import StatusBadge from "../UI/StatusBadge";
import { MAWB } from "./types";

interface ConsolidateFlowProps {
  selectedPackages: number[];
  handleBulkConsolidateAction: (action: string) => void;
  handleOpenConsolidate: () => void;
  loading: boolean;
  packagesForConsolidation: {
    id: string;
    packageId: number;
    weight: number;
    desc: string;
    client: string;
    value: number;
    status: string;
    origin: string;
  }[];
  currentLocation: string;
  setSelectedPackages: (ids: number[]) => void;
  togglePackageSelection: (id: number) => void;
  outboundManifests: any[];
  handleManifestAction: (action: string, manifest: MAWB) => void;
}

const ConsolidateFlow: React.FC<ConsolidateFlowProps> = ({
  selectedPackages,
  handleBulkConsolidateAction,
  handleOpenConsolidate,
  loading,
  packagesForConsolidation,
  currentLocation,
  setSelectedPackages,
  togglePackageSelection,
  outboundManifests,
  handleManifestAction,
}) => {
  return (
    <div className="space-y-6">
      {/* Consolidation Selection Area */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Available for Consolidation
            </h3>
            <p className="text-sm text-slate-500">
              Select HWBs to group into a Master Air Waybill.
            </p>
          </div>

          <div className="flex gap-2">
            {/* Bulk Actions for Selection */}
            {selectedPackages.length > 0 && (
              <div className="flex items-center gap-2 mr-4 bg-slate-100 px-3 py-1 rounded-lg">
                <span className="text-xs font-bold text-slate-700">
                  {selectedPackages.length} Selected
                </span>
                <button
                  onClick={() => handleBulkConsolidateAction("REMOVE")}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <button
              onClick={handleOpenConsolidate}
              disabled={selectedPackages.length === 0}
              className="bg-primary-600 disabled:bg-slate-300 text-white py-2 px-6 rounded hover:bg-primary-700 flex items-center transition font-medium shadow-sm"
            >
              <Layers size={18} className="mr-2" /> Consolidate (
              {selectedPackages.length})
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedPackages(
                        packagesForConsolidation.map((i) => i.packageId)
                      );
                    else setSelectedPackages([]);
                  }}
                />
              </th>
              <th className="p-3">HWB ID</th>
              <th className="p-3">Client</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Value ($)</th>
              <th className="p-3 text-right">Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : packagesForConsolidation.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No pending items for consolidation at {currentLocation}
                </td>
              </tr>
            ) : (
              packagesForConsolidation.map((item) => (
                <tr
                  key={item.packageId}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    selectedPackages.includes(item.packageId)
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(item.packageId)}
                      onChange={() => togglePackageSelection(item.packageId)}
                      className="text-primary-600 rounded focus:ring-primary-500"
                    />
                  </td>
                  <td className="p-3 font-mono text-sm font-medium">
                    {item.id}
                  </td>
                  <td className="p-3 text-sm text-slate-600">{item.client}</td>
                  <td className="p-3 text-sm text-slate-600">{item.desc}</td>
                  <td className="p-3 text-sm text-right">{item.value}</td>
                  <td className="p-3 text-sm text-right">{item.weight}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Outbound Manifests Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
          <Plane size={20} className="mr-2 text-slate-500" /> Recent Outbound
          Manifests (From {currentLocation})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">MAWB ID</th>
                <th className="px-4 py-3">Dest</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Load</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outboundManifests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-slate-400 italic"
                  >
                    No manifests created yet.
                  </td>
                </tr>
              ) : (
                outboundManifests.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-primary-600">
                      <button
                        onClick={() => handleManifestAction("VIEW", m)}
                        className="hover:underline text-left"
                      >
                        {m.mawb_number}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">
                      {m.destination}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-slate-800">
                        {m.carrier}
                      </div>
                      <div className="text-xs text-slate-500">
                        {m.flightVessel}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="font-medium">
                        {Number(m.totalWeight).toFixed(2)} kg
                      </div>
                      <div className="text-xs text-slate-500">
                        {m.hwbs.length} pcs
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleManifestAction("VIEW", m)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Full Manifest"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => handleManifestAction("PRINT", m)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"
                          title="Print Master Label"
                        >
                          <Printer size={16} />
                        </button>
                        {m.status === "CONSOLIDATED" && (
                          <button
                            onClick={() => handleManifestAction("DEPART", m)}
                            className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Mark Departed"
                          >
                            <Navigation size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConsolidateFlow;
