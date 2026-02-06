import React from "react";
import { Box, Camera, CheckCircle } from "lucide-react";
import StatusBadge from "../UI/StatusBadge";
import { HWB } from "./types";
import { OrderStatus } from "../../types";
import { Order } from "@/api/types/orders";
import { AuthUser } from "@/api/types/auth";

interface ReceiptFlowProps {
  currentLocation: string;
  getLocName: (code: string) => string;
  setIsScannerOpen: (open: boolean) => void;
  handleReceipt: (e: React.FormEvent) => void;
  selectedOrderId: string;
  handleOrderSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  pendingOrders: Order[];
  receiptDesc: string;
  setReceiptDesc: (value: string) => void;
  receiptWeight: string;
  setReceiptWeight: (value: string) => void;
  receiptValue: string;
  setReceiptValue: (value: string) => void;
  receiptLength: string;
  setReceiptLength: (value: string) => void;
  receiptWidth: string;
  setReceiptWidth: (value: string) => void;
  receiptHeight: string;
  setReceiptHeight: (value: string) => void;
  inventory: HWB[];
  users: AuthUser[];
  selectedUserId: string;
  setSelectedUserId: (value: string) => void;
  isLoading: boolean;
}

const ReceiptFlow: React.FC<ReceiptFlowProps> = ({
  currentLocation,
  getLocName,
  setIsScannerOpen,
  handleReceipt,
  selectedOrderId,
  handleOrderSelect,
  pendingOrders,
  receiptDesc,
  setReceiptDesc,
  receiptWeight,
  setReceiptWeight,
  receiptValue,
  setReceiptValue,
  receiptLength,
  setReceiptLength,
  receiptWidth,
  setReceiptWidth,
  receiptHeight,
  setReceiptHeight,
  inventory,
  users,
  selectedUserId,
  setSelectedUserId,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Box className="mr-2" size={20} /> Receive New Package
          </h3>
          {/* <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 text-xs font-bold shadow-sm transition"
          >
            <Camera size={14} className="mr-1.5" /> Scan Barcode
          </button> */}
        </div>

        <form onSubmit={handleReceipt} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-4">
            <label className="block text-sm font-bold text-blue-900 mb-2">
              Link to Shipment
            </label>
            <select
              value={selectedOrderId}
              onChange={handleOrderSelect}
              className="w-full border border-blue-200 rounded p-2 bg-white text-slate-900"
            >
              <option value="">-- Manual Entry / No Pre-Alert --</option>
              {pendingOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Shipment #{order.tracking_number} - {order.user.full_name}
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
              disabled={!!selectedOrderId}
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
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Length (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={receiptLength}
                onChange={(e) => setReceiptLength(e.target.value)}
                className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Width (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={receiptWidth}
                onChange={(e) => setReceiptWidth(e.target.value)}
                className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={receiptHeight}
                onChange={(e) => setReceiptHeight(e.target.value)}
                className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
                placeholder="0.0"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 flex justify-center items-center font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  {selectedOrderId
                    ? "Verify & Receive Package"
                    : "Generate HWB & Receive"}
                </>
              )}
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
                i.status === OrderStatus.RECEIVED &&
                i.origin === currentLocation,
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
              i.status === OrderStatus.RECEIVED && i.origin === currentLocation,
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
