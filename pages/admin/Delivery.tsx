import React, { useState, useEffect } from "react";
import { Plus, Eye, Loader2, User, Phone } from "lucide-react"; // Added User, Phone
import { DataTable, Column } from "../../components/UI/DataTable";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import useDelivery from "../../api/delivery/useDelivery";
import { Delivery, CreateDeliveryOrderPayload } from "../../api/types/delivery";
import useOrders from "../../api/orders/useOrders";
import { Order } from "../../api/types/orders";
import StatusBadge from "../../components/UI/StatusBadge";
import { Truck } from "lucide-react";

const DeliveryOrders: React.FC = () => {
  const { showToast } = useToast();
  const { listDeliveryOrders, createDeliveryOrder, updateDeliveryOrderStatus } =
    useDelivery();
  const { getOrders } = useOrders();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingCreateDelivery, setIsSubmittingCreateDelivery] =
    useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // New states for dispatch modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedDeliveryForDispatch, setSelectedDeliveryForDispatch] =
    useState<Delivery | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("Mike (Boda)"); // Static driver for now
  const [isDispatching, setIsDispatching] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deliveriesRes, ordersRes] = await Promise.allSettled([
        listDeliveryOrders(),
        getOrders(),
      ]);

      if (deliveriesRes.status === "fulfilled") {
        setDeliveries(deliveriesRes.value.data);
      } else {
        showToast("Failed to fetch delivery orders", "error");
      }

      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value.data.data);
      } else {
        showToast("Failed to fetch orders", "error");
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

  const handleCreateDelivery = async () => {
    if (!selectedOrderId || !deliveryAddress || !deliveryDate) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setIsSubmittingCreateDelivery(true);
    try {
      const payload: CreateDeliveryOrderPayload = {
        order_id: Number(selectedOrderId),
        delivery_address: deliveryAddress,
        delivery_date: deliveryDate,
        delivery_notes: deliveryNotes,
      };
      await createDeliveryOrder(payload);
      showToast("Delivery order created successfully!", "success");
      setIsCreateModalOpen(false);
      // reset form
      setSelectedOrderId(null);
      setDeliveryAddress("");
      setDeliveryDate("");
      setDeliveryNotes("");
      fetchData();
    } catch (error) {
      console.error(error);
      showToast("Failed to create delivery order.", "error");
    } finally {
      setIsSubmittingCreateDelivery(false);
    }
  };

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryForDispatch) return;

    setIsDispatching(true);
    try {
      const riderId = 1; // Placeholder for a real rider ID from selectedDriver
      await updateDeliveryOrderStatus(selectedDeliveryForDispatch.id, {
        status: "ASSIGNED",
        rider_id: riderId,
      });
      showToast("Driver Assigned & Dispatched", "success");
      setIsDispatchModalOpen(false);
      fetchData();
    } catch (error) {
      showToast("Failed to dispatch delivery.", "error");
      console.error(error);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCompleteDelivery = async (deliveryId: number) => {
    try {
      await updateDeliveryOrderStatus(deliveryId, { status: "DELIVERED" });
      showToast("Delivery Marked as Completed", "success");
      fetchData();
    } catch (error) {
      showToast("Failed to complete delivery.", "error");
      console.error(error);
    }
  };

  const handleDispatchClick = (e: React.MouseEvent, delivery: Delivery) => {
    e.stopPropagation();
    setSelectedDeliveryForDispatch(delivery);
    setIsDispatchModalOpen(true);
  };

  const columns: Column<Delivery>[] = [
    {
      header: "Delivery No.",
      accessor: (delivery) => (
        <span className="text-primary-600 font-medium hover:underline">
          {delivery.delivery_number}
        </span>
      ),
      sortKey: "delivery_number",
    },
    {
      header: "Order Ref",
      accessor: (delivery) => delivery.order?.tracking_number || "N/A",
      // @ts-ignore
      sortKey: "order.tracking_number",
    },
    {
      header: "Client Address",
      accessor: (delivery) => (
        <div>
          <div className="font-medium text-slate-900">
            {delivery.order?.user?.full_name}
          </div>
          <div className="text-xs text-slate-500">
            {delivery.delivery_address}
          </div>
        </div>
      ),
      sortKey: "delivery_address",
    },
    {
      header: "Driver",
      accessor: (delivery) =>
        delivery.rider_id ? `Rider ID: ${delivery.rider_id}` : "Unassigned",
      sortKey: "rider_id",
    },
    {
      header: "Status",
      accessor: (delivery) => <StatusBadge status={delivery.status} />,
      sortKey: "status",
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (delivery) => (
        <div className="flex justify-end gap-2">
          {delivery.status === "PENDING" && (
            <button
              onClick={(e) => handleDispatchClick(e, delivery)}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
            >
              Dispatch
            </button>
          )}
          {delivery.status === "ASSIGNED" ||
            (delivery.status === "OUT_FOR_DELIVERY" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteDelivery(delivery.id);
                }}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded"
              >
                Complete
              </button>
            ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerNav(`/admin/delivery/${delivery.id}`);
            }}
            className="text-slate-400 hover:text-primary-600 p-1"
            title="View Details"
          >
            <Eye size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Last Mile Delivery
          </h2>
          <p className="text-slate-500 text-sm">
            Dispatch drivers and track local deliveries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <DataTable
            data={deliveries}
            columns={columns}
            loading={loading}
            onRowClick={(delivery) =>
              triggerNav(`/admin/delivery/${delivery.id}`)
            }
            title="Dispatch Board"
            searchPlaceholder="Search Deliveries..."
            primaryAction={
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                Create Delivery Order
              </button>
            }
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <Truck size={18} className="mr-2" /> Active Drivers
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Mike (Boda)</p>
                    <p className="text-xs text-green-600">Available</p>
                  </div>
                </div>
                <Phone size={16} className="text-slate-400" />
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sam (Van)</p>
                    <p className="text-xs text-orange-600">On Delivery</p>
                  </div>
                </div>
                <Phone size={16} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Delivery Order"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="order"
              className="block text-sm font-medium text-slate-700"
            >
              Select Order
            </label>
            <select
              id="order"
              name="order"
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              defaultValue=""
            >
              <option value="" disabled>
                Select an order
              </option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.tracking_number} ({o.user.full_name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="delivery_address"
              className="block text-sm font-medium text-slate-700"
            >
              Delivery Address
            </label>
            <input
              type="text"
              id="delivery_address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="delivery_date"
              className="block text-sm font-medium text-slate-700"
            >
              Delivery Date
            </label>
            <input
              type="date"
              id="delivery_date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="delivery_notes"
              className="block text-sm font-medium text-slate-700"
            >
              Delivery Notes
            </label>
            <textarea
              id="delivery_notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDelivery}
              disabled={isSubmittingCreateDelivery}
              className="px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-xl flex justify-center items-center bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmittingCreateDelivery ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-3" /> Creating...
                </>
              ) : (
                "Create Delivery"
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Order"
      >
        <form onSubmit={handleDispatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Assign Driver
            </label>
            <select
              className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="Mike (Boda)">Mike (Boda)</option>
              <option value="Sam (Van)">Sam (Van)</option>
              <option value="3rd Party Courier">3rd Party Courier</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDispatching}
            >
              {isDispatching ? "Dispatching..." : "Confirm Dispatch"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DeliveryOrders;
