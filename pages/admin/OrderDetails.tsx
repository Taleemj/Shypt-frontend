import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  DollarSign,
  Upload,
  Edit,
  CheckCircle,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import {
  Watermark,
  SecureHeader,
  SecurityFooter,
} from "../../components/UI/SecurityFeatures";
import useOrders from "../../api/orders/useOrders";
import {
  Order,
  PlaceOrderPayload,
  UpdateOrderStatusPayload,
} from "../../api/types/orders";
import Modal from "../../components/UI/Modal";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouse } from "../../api/types/warehouse";

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

const ORDER_STATUS_FLOW = [
  "PENDING",
  "RECEIVED",
  "CONSOLIDATED",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "READY_FOR_RELEASE",
  "RELEASED",
  "DELIVERED",
];

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onBack }) => {
  const { showToast } = useToast();
  const { getOrder, updateOrder, updateOrderStatus } = useOrders();
  const { fetchWareHouses } = useWareHouse();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // New state for status update loading
  const [warehouses, setWarehouses] = useState<WareHouse[]>([]);

  const fetchDetails = async () => {
    try {
      const [orderResponse, warehousesResponse] = await Promise.all([
        getOrder(parseInt(orderId, 10)),
        fetchWareHouses(),
      ]);
      setOrder(orderResponse.data);
      setWarehouses(warehousesResponse.data);
    } catch (err) {
      showToast("Failed to fetch order details.", "error");
      console.error(err);
    } finally {
      setLoading(false); // Only set loading for initial fetch
    }
  };

  useEffect(() => {
    if (orderId) {
      setLoading(true); // Only set loading for initial fetch
      fetchDetails();
    }
  }, [orderId]);

  const handleAction = (action: string) => {
    if (action === "EDIT") {
      setIsFormOpen(true);
    } else if (action === "PRINT_LABEL" && order) {
      const originalTitle = document.title;
      document.title = `Waybill_${order.tracking_number || order.id}`;
      window.print();
      document.title = originalTitle;
    } else {
      showToast(`Action Triggered: ${action}`, "info");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order) return;

    const formData = new FormData(e.currentTarget);
    const payload: PlaceOrderPayload = {
      receiver_name: formData.get("receiver_name") as string,
      receiver_phone: formData.get("receiver_phone") as string,
      receiver_email: formData.get("receiver_email") as string,
      receiver_address: formData.get("receiver_address") as string,
      origin_country: formData.get("origin_country") as string,
    };

    if (
      !payload.receiver_name ||
      !payload.receiver_email ||
      !payload.receiver_address
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      // setLoading(true); // Don't use main loader for form submission
      await updateOrder(order.id, payload);
      showToast("Order updated successfully", "success");
      setIsFormOpen(false);
      // Re-fetch details after update
      await fetchDetails();
    } catch (error) {
      showToast("Failed to update order", "error");
    } finally {
      // setLoading(false); // Don't use main loader for form submission
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order) return;

    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as string;
    const notes = formData.get("notes") as string;
    const location = formData.get("location") as string;

    if (!newStatus || !location) {
      showToast("Please select a status and provide a location.", "error");
      return;
    }

    const payload: UpdateOrderStatusPayload = {
      order_id: order.id,
      status: newStatus,
      notes: notes,
      location: location,
      // user_id: 1, // TODO: Replace with authenticated user ID
    };

    try {
      setIsUpdatingStatus(true); // Set local loading for button
      await updateOrderStatus(payload);
      showToast("Order status updated successfully", "success");
      setStatusModalOpen(false);
      await fetchDetails(); // Re-fetch details to update UI
    } catch (error) {
      showToast("Failed to update order status", "error");
    } finally {
      setIsUpdatingStatus(false); // Reset local loading
    }
  };

  if (loading) {
    return <div>Loading order details...</div>;
  }

  if (!order) {
    // ... (error display)
  }

  const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const availableNextStatuses = ORDER_STATUS_FLOW.slice(currentStatusIndex + 1);

  // ... (other calculations and timeline logic)
  const totalWeight =
    order.packages?.reduce((acc, pkg) => acc + Number(pkg.weight), 0) || 0;
  const totalVolume =
    order.packages?.reduce(
      (acc, pkg) =>
        acc + Number(pkg.length) * Number(pkg.width) * Number(pkg.height),
      0
    ) || 0;
  const totalVolumeCBM = (totalVolume / 1_000_000).toFixed(2);
  const totalDeclaredValue =
    order.packages?.reduce((acc, pkg) => acc + Number(pkg.declared_value), 0) ||
    0;
  const formattedTimeline = ORDER_STATUS_FLOW.map((status, index) => {
    const historyEvent = [...order.status_history]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .find((h) => h.status === status);

    const isDone = index <= currentStatusIndex;

    return {
      status: status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      date: historyEvent
        ? new Date(historyEvent.created_at).toLocaleString()
        : status === order.status
        ? new Date(order.created_at).toLocaleString()
        : "-",
      loc: historyEvent ? historyEvent.location : "N/A",
      done: isDone,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Order {order.tracking_number}
            </h2>
            <p className="text-slate-500 text-sm">
              {order.origin_country} <span className="mx-1">&rarr;</span>{" "}
              {order.receiver_address}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={order.status} />
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          <button
            onClick={() => handleAction("PRINT_LABEL")}
            className="flex items-center px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm transition"
            title="Print Waybill"
          >
            <Printer size={16} className="mr-2" /> Waybill
          </button>
          <button
            onClick={() => handleAction("EDIT")}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit Order"
          >
            <Edit size={20} />
          </button>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-sm flex flex-wrap gap-2 items-center print:hidden">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 ml-2">
          Actions:
        </span>
        {availableNextStatuses.length > 0 && (
          <button
            onClick={() => setStatusModalOpen(true)}
            className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm transition font-medium"
          >
            <CheckCircle size={14} className="mr-2" /> Update Status
          </button>
        )}
        <button
          onClick={() => handleAction("GENERATE_INVOICE")}
          className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
        >
          <DollarSign size={14} className="mr-2" /> Generate Invoice
        </button>
        <button
          onClick={() => handleAction("UPLOAD_DOCS")}
          className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
        >
          <Upload size={14} className="mr-2" /> Upload Docs
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        <div className="lg:col-span-2 space-y-6 print:w-full">
          {/* ... Printable Waybill ... */}
          <div className="print:hidden">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Cargo Details</h3>
              </div>
              <div className="p-6">
                {order.packages && order.packages.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-2">HWB</th>
                        <th className="text-left p-2">Contents</th>
                        <th className="text-right p-2">Weight (kg)</th>
                        <th className="text-right p-2">Dimensions (cm)</th>
                        <th className="text-right p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.packages.map((pkg) => (
                        <tr key={pkg.id} className="border-b">
                          <td className="p-2 font-mono">{pkg.hwb_number}</td>
                          <td className="p-2">{pkg.contents}</td>
                          <td className="text-right p-2">
                            {Number(pkg.weight).toFixed(2)}
                          </td>
                          <td className="text-right p-2">{`${pkg.length}x${pkg.width}x${pkg.height}`}</td>
                          <td className="text-right p-2">
                            ${Number(pkg.declared_value).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="font-bold bg-slate-50">
                      <tr>
                        <td colSpan={2} className="text-right p-2">
                          Totals:
                        </td>
                        <td className="text-right p-2">
                          {totalWeight.toFixed(2)} kg
                        </td>
                        <td className="text-right p-2">{totalVolumeCBM} CBM</td>
                        <td className="text-right p-2">
                          ${totalDeclaredValue.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p>No packages in this order yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit print:hidden">
          <h3 className="font-bold text-slate-800 mb-6">Tracking Timeline</h3>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
            {formattedTimeline.map((event, i) => (
              <div key={i} className="relative pl-8">
                <div
                  className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: event.done ? "#22c55e" : "#ffffff",
                    borderColor: event.done ? "#22c55e" : "#cbd5e1",
                  }}
                ></div>
                <div style={{ opacity: event.done ? 1 : 0.4 }}>
                  <p className="text-sm font-bold text-slate-800">
                    {event.status}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.loc}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {event.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={"Edit Order"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* ... form inputs ... */}
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Order Status"
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              New Status
            </label>
            <select
              name="status"
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              required
            >
              <option value="" disabled>
                Select next status
              </option>
              {availableNextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              name="location"
              type="text"
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              placeholder="e.g., Kampala Warehouse"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              placeholder="Add any relevant notes..."
            ></textarea>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrderDetails;
