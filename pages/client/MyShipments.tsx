import React, { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import { useToast } from "../../context/ToastContext";
import useOrders from "../../api/orders/useOrders";
import { Order } from "../../api/types/orders";
import StatusBadge from "../../components/UI/StatusBadge";

const MyShipments: React.FC = () => {
  const { showToast } = useToast();
  const { getOrders } = useOrders();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersRes = await getOrders();
      setOrders(ordersRes.data.data);
    } catch (error) {
      showToast("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      accessor: (order) => new Date(order.created_at).toLocaleDateString(),
      sortKey: "created_at",
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
              triggerNav(`/client/orders/${order.id}`);
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
          <h2 className="text-2xl font-bold text-slate-800">My Shipments</h2>
          <p className="text-slate-500 text-sm">
            Track your shipments and view their history.
          </p>
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={(order) => triggerNav(`/client/shipments/${order.id}`)}
        title="All Orders"
        searchPlaceholder="Search by tracking #..."
      />
    </div>
  );
};

export default MyShipments;
