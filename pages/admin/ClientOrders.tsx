import React, { useState, useEffect } from "react";
import { Plus, Eye, Loader2 } from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import useOrders from "../../api/orders/useOrders";
import { Order, PlaceOrderPayload } from "../../api/types/orders";
import useCargo from "../../api/cargo/useCargo";
import { CargoDeclaration } from "../../api/types/cargo";
import StatusBadge from "../../components/UI/StatusBadge";

const ClientOrders: React.FC = () => {
  const { showToast } = useToast();
  const { getOrders, placeOrder } = useOrders();
  const { listCargoDeclarations } = useCargo();

  const [orders, setOrders] = useState<Order[]>([]);
  const [cargoDeclarations, setCargoDeclarations] = useState<
    CargoDeclaration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedDeclarationId, setSelectedDeclarationId] = useState<
    string | null
  >(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, cargoRes] = await Promise.allSettled([
        getOrders(),
        listCargoDeclarations(),
      ]);

      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value.data.data);
      } else {
        showToast("Failed to fetch orders", "error");
      }

      if (cargoRes.status === "fulfilled") {
        setCargoDeclarations(cargoRes.value.data);
      } else {
        showToast("Failed to fetch cargo declarations", "error");
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

  const handleCreateOrder = async () => {
    if (!selectedDeclarationId) {
      showToast("Please select a cargo declaration.", "error");
      return;
    }

    const declaration = cargoDeclarations.find(
      (d) => d.id === Number(selectedDeclarationId),
    );
    if (!declaration) {
      showToast("Selected cargo declaration not found.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PlaceOrderPayload = {
        // @ts-ignore
        user_id: declaration.user_id,
        cargo_declaration_id: declaration.id,
        origin_country: declaration.location.name,
        // @ts-ignore
        receiver_name: declaration.user.full_name,
        // @ts-ignore
        receiver_phone: declaration.user.phone,
        receiver_email: declaration.user.email,
        // @ts-ignore
        receiver_address: declaration.user.address,
        warehouse_location_id: declaration.warehouse_location_id,
      };
      await placeOrder(payload);
      showToast("Order created successfully!", "success");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      showToast("Failed to create order.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const columns: Column<Order>[] = [
    {
      header: "Order ID",
      accessor: (order) => (
        <span className="text-primary-600 font-medium hover:underline">
          {order.id}
        </span>
      ),
      sortKey: "id",
    },
    {
      header: "Date",
      accessor: (order) => new Date(order.created_at).toLocaleString(),
      sortKey: "created_at",
    },
    {
      header: "Client",
      accessor: (order) => (
        <div>
          {/*@ts-ignore*/}
          <div className="font-medium text-slate-900">
            {order.user.full_name}
          </div>
          <div className="text-xs text-slate-500">{order.user.email}</div>
          <div className="text-xs text-slate-500">{order.user.phone}</div>
        </div>
      ),
      // @ts-ignore
      sortKey: "user.full_name",
    },
    {
      header: "Tracking Number",
      accessor: (order) => order.tracking_number,
      sortKey: "tracking_number",
    },
    {
      header: "Status",
      accessor: (order) => <StatusBadge status={order.status} />,
      sortKey: "status",
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (order) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerNav(`/admin/client-orders/${order.id}`);
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
          <h2 className="text-2xl font-bold text-slate-800">Client Orders</h2>
          <p className="text-slate-500 text-sm">Manage all client orders.</p>
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={(order) => triggerNav(`/admin/client-orders/${order.id}`)}
        title="All Orders"
        searchPlaceholder="Search by tracking #, client..."
        primaryAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Record Order
          </button>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Order from Cargo Declaration"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="declaration"
              className="block text-sm font-medium text-slate-700"
            >
              Select Cargo Declaration
            </label>
            <select
              id="declaration"
              name="declaration"
              onChange={(e) => setSelectedDeclarationId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              defaultValue=""
            >
              <option value="" disabled>
                Select a declaration
              </option>
              {cargoDeclarations.map((d) => (
                <option key={d.id} value={d.id}>
                  ID: {d.id} -{(() => {
                  if (!d.cargo_details || d.cargo_details.length === 0) {
                    return "No cargo details";
                  }
                  const items = d.cargo_details.map((detail) => detail.cargo_item);
                  if (items.length === 1) {
                    return items[0];
                  }
                  if (items.length === 2) {
                    return `${items[0]}, ${items[1]}`;
                  }
                  return `${items[0]}, ${items[1]} +${items.length - 2} more`;
                })()} ({d.user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting || !selectedDeclarationId}
              className="px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-xl flex justify-center items-center bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-3" /> Creating...
                </>
              ) : (
                "Create Order"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientOrders;
