import React from "react";
import { Box, Camera, CheckCircle } from "lucide-react";
import StatusBadge from "../UI/StatusBadge";
import { HWB } from "./types";
import { OrderStatus } from "../../types";
import { CargoDeclaration } from "@/api/types/cargo";
import { AuthUser } from "@/api/types/auth";

interface ReceiptFlowProps {
  currentLocation: string;
  getLocName: (code: string) => string;
  setIsScannerOpen: (open: boolean) => void;
  handleReceipt: (e: React.FormEvent) => void;
  selectedDeclarationId: string;
  handleDeclarationSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  pendingDeclarations: CargoDeclaration[];
  receiptDesc: string;
  setReceiptDesc: (value: string) => void;
  receiptWeight: string;
  setReceiptWeight: (value: string) => void;
  receiptValue: string;
  setReceiptValue: (value: string) => void;
  inventory: HWB[];
  users: AuthUser[];
  selectedUserId: string;
  setSelectedUserId: (value: string) => void;
}

const ReceiptFlow: React.FC<ReceiptFlowProps> = ({
  currentLocation,
  getLocName,
  setIsScannerOpen,
  handleReceipt,
  selectedDeclarationId,
  handleDeclarationSelect,
  pendingDeclarations,
  receiptDesc,
  setReceiptDesc,
  receiptWeight,
  setReceiptWeight,
  receiptValue,
  setReceiptValue,
  inventory,
  users,
  selectedUserId,
  setSelectedUserId,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Box className="mr-2" size={20} /> Receive New Package
          </h3>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 text-xs font-bold shadow-sm transition"
          >
            <Camera size={14} className="mr-1.5" /> Scan Barcode
          </button>
        </div>

        <form onSubmit={handleReceipt} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-4">
            <label className="block text-sm font-bold text-blue-900 mb-2">
              Link to Declaration (Pre-Alert)
            </label>
            <select
              value={selectedDeclarationId}
              onChange={handleDeclarationSelect}
              className="w-full border border-blue-200 rounded p-2 bg-white text-slate-900"
            >
              <option value="">-- Manual Entry / No Pre-Alert --</option>
              {pendingDeclarations.map((dec) => (
                <option key={dec.id} value={dec.id}>
                  {dec.id} - {dec.user.full_name} ({dec.cargo_details})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Client Name
            </label>
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
              disabled={!!selectedDeclarationId}
            >
              <option value="">-- Select a Client --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} (CL-{user.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              required
              type="text"
              value={receiptDesc}
              onChange={(e) => setReceiptDesc(e.target.value)}
              className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
              placeholder="e.g. 5x Cartons of Shoes"
              disabled={!!selectedDeclarationId}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Weight (kg)
              </label>
              <input
                required
                type="number"
                step="0.1"
                value={receiptWeight}
                onChange={(e) => setReceiptWeight(e.target.value)}
                className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
                placeholder="0.00"
                disabled={!!selectedDeclarationId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Declared Value ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={receiptValue}
                onChange={(e) => setReceiptValue(e.target.value)}
                className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
                placeholder="0.00"
                disabled={!!selectedDeclarationId}
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 flex justify-center items-center font-medium"
            >
              <CheckCircle size={18} className="mr-2" />
              {selectedDeclarationId
                ? "Verify & Receive Package"
                : "Generate HWB & Receive"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4">
          Recent Receipts at {getLocName(currentLocation)}
        </h3>
        <div className="space-y-2">
          {inventory
            .filter(
              (i) =>
                i.status === OrderStatus.RECEIVED && i.origin === currentLocation
            )
            .slice(-5)
            .reverse()
            .map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 border rounded bg-slate-50"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">{item.id}</p>
                  <p className="text-xs text-slate-500">
                    {item.desc} • {item.weight}kg
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          {inventory.filter(
            (i) =>
              i.status === OrderStatus.RECEIVED && i.origin === currentLocation
          ).length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">
              No recent receipts at this location.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptFlow;