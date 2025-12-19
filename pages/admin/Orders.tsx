import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Plane,
  Ship,
  Trash2,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { DataTable, Column } from "../../components/UI/DataTable";
import useOrders from "../../api/orders/useOrders";
import { Order, PlaceOrderPayload } from "../../api/types/orders";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouse } from "../../api/types/warehouse";

const Orders: React.FC = () => {
  const { showToast } = useToast();
  const { getOrders, placeOrder, updateOrder, deleteOrder, updateOrderStatus } =
    useOrders();
  const { fetchWareHouses } = useWareHouse();

  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<WareHouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"ADD" | "EDIT">("ADD");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Bulk Action State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      setOrders(response.data.data);
    } catch (error) {
      showToast("Failed to fetch orders", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const loadWarehouses = async () => {
      try {
        const response = await fetchWareHouses();
        setWarehouses(response.data);
      } catch (error) {
        showToast("Failed to fetch warehouses", "error");
        console.error(error);
      }
    };
    loadWarehouses();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(id);
        setOrders((prev) => prev.filter((o) => o.id !== id));
        showToast("Order deleted successfully", "success");
      } catch (error) {
        showToast("Failed to delete order", "error");
      }
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormMode("EDIT");
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setFormMode("ADD");
    setIsFormOpen(true);
  };

  // --- BULK ACTIONS ---
  const handleBulkAction = async (status: string) => {
    // A proper implementation for bulk status updates would require user_id and location.
    // This is a simplified example.
    const confirmationText =
      status === "CANCELLED"
        ? `Are you sure you want to cancel ${selectedIds.length} orders?`
        : `Mark ${selectedIds.length} orders as ${status}?`;

    if (window.confirm(confirmationText)) {
      try {
        await Promise.all(
          selectedIds.map((order_id) =>
            updateOrderStatus({
              order_id,
              status,
              notes: "Bulk update",
              user_id: 1,
              location: "Admin Dashboard",
            })
          )
        );
        fetchOrders(); // Re-fetch to get updated data
        showToast(`${selectedIds.length} orders updated`, "success");
        setSelectedIds([]);
      } catch (err) {
        showToast("Some orders could not be updated.", "error");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (
      confirm(
        `Permanently delete ${selectedIds.length} orders? This cannot be undone.`
      )
    ) {
      try {
        await Promise.all(selectedIds.map((id) => deleteOrder(id)));
        setOrders((prev) => prev.filter((o) => !selectedIds.includes(o.id)));
        showToast(`${selectedIds.length} orders deleted`, "success");
        setSelectedIds([]);
      } catch (error) {
        showToast("Failed to delete some orders", "error");
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      if (formMode === "ADD") {
        await placeOrder(payload);
        showToast("New Order created successfully", "success");
      } else if (editingOrder) {
        await updateOrder(editingOrder.id, payload);
        showToast("Order updated successfully", "success");
      }
      fetchOrders();
      setIsFormOpen(false);
    } catch (error) {
      showToast(
        `Failed to ${formMode === "ADD" ? "create" : "update"} order`,
        "error"
      );
    }
  };

  // --- COLUMN DEFINITIONS ---
  const columns: Column<Order>[] = [
    {
      header: "Order ID",
      accessor: (order) => (
        <span className="text-primary-600 font-medium hover:underline">
          {order.tracking_number || `ID-${order.id}`}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Client",
      accessor: (order) => (
        <div>
          {/* @ts-ignore */}
          <div className="font-medium text-slate-900">{order.user.name}</div>
          <div className="text-xs text-slate-500">
            {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
      // @ts-ignore
      sortKey: "user.name",
      sortable: true,
    },
    {
      header: "Origin",
      accessor: "origin_country",
      sortKey: "origin_country",
      sortable: true,
      className: "text-sm text-slate-600",
    },
    {
      header: "Destination",
      accessor: (order) => (
        <div>
          <div className="font-medium">{order.receiver_name}</div>
          <div className="text-xs text-slate-500">{order.receiver_address}</div>
        </div>
      ),
      className: "text-sm text-slate-600",
    },
    {
      header: "Status",
      accessor: (order) => <StatusBadge status={order.status} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (order) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(order);
            }}
            className="text-slate-400 hover:text-blue-600 p-1"
            title="Edit Order"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerNav(`/admin/orders/${order.id}`);
            }}
            className="text-slate-400 hover:text-primary-600 p-1"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(order.id);
            }}
            className="text-slate-400 hover:text-red-600 p-1"
            title="Delete Order"
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
          <h2 className="text-2xl font-bold text-slate-800">Client Orders</h2>
          <p className="text-slate-500 text-sm">
            Manage all client orders and shipments.
          </p>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-800 text-white p-4 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2 fade-in shadow-lg">
          <div className="flex items-center">
            <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold mr-3">
              {selectedIds.length} Selected
            </span>
            <span className="text-sm text-slate-300">
              Choose an action for selected items:
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("RECEIVED")}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition"
            >
              <CheckCircle size={16} className="mr-2" /> Mark Received
            </button>
            <button
              onClick={() => handleBulkAction("CANCELLED")}
              className="flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium transition"
            >
              <AlertCircle size={16} className="mr-2" /> Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm font-medium transition"
            >
              <Trash2 size={16} className="mr-2" /> Delete
            </button>
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
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={(order) => triggerNav(`/admin/orders/${order.id}`)}
        title="All Orders"
        searchPlaceholder="Search by tracking #, client, or destination..."
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
            Create Manual Order
          </button>
        }
      />

      {/* CREATE/EDIT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === "ADD" ? "Create New Order" : "Edit Order"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Receiver Name <span className="text-red-500">*</span>
            </label>
            <input
              name="receiver_name"
              type="text"
              defaultValue={editingOrder?.receiver_name}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Receiver Phone
              </label>
              <input
                name="receiver_phone"
                type="tel"
                defaultValue={editingOrder?.receiver_phone}
                className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                placeholder="+1-202-555-0104"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Receiver Email <span className="text-red-500">*</span>
              </label>
              <input
                name="receiver_email"
                type="email"
                defaultValue={editingOrder?.receiver_email}
                className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                placeholder="j.doe@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Receiver Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="receiver_address"
              defaultValue={editingOrder?.receiver_address}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              rows={3}
              placeholder="123 Abc Street, Kampala"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Origin Country
            </label>
            <select
              name="origin_country"
              defaultValue={editingOrder?.origin_country || ""}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              required
            >
              <option value="" disabled>
                Select a warehouse
              </option>
              {warehouses.map((warehouse) => (
                <option
                  key={warehouse.id}
                  value={`${warehouse.country} (${warehouse.code})`}
                >
                  {warehouse.country} ({warehouse.code})
                </option>
              ))}
            </select>
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
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {formMode === "ADD" ? "Create Order" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Orders;
