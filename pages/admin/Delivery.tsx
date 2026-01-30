import React, { useState, useEffect, useMemo } from "react";
import { Plus, Eye, Loader2, User, Phone } from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { useAuthContext } from "../../context/AuthContext";
import useDelivery from "../../api/delivery/useDelivery";
import {
  Delivery,
  UpdateDeliveryStatusPayload,
} from "../../api/types/delivery";
import useOrders from "../../api/orders/useOrders";
import { Order } from "../../api/types/orders";
import StatusBadge from "../../components/UI/StatusBadge";
import { Truck } from "lucide-react";
import { AuthUser } from "../../api/types/auth";

const DeliveryOrders: React.FC = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const {
    listDeliveryOrders,
    createDeliveryOrder,
    updateDeliveryOrderStatus,
    getDeliverRiders,
  } = useDelivery();
  const { getOrders } = useOrders();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Partial<AuthUser>[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingCreateDelivery, setIsSubmittingCreateDelivery] =
    useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );
  const [selectedDriverIdForCreation, setSelectedDriverIdForCreation] =
    useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // New states for dispatch modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedDeliveryForDispatch, setSelectedDeliveryForDispatch] =
    useState<Delivery | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  // New states for driver modal
  const [isDriverDetailModalOpen, setIsDriverDetailModalOpen] = useState(false);
  const [selectedDriverForDetails, setSelectedDriverForDetails] =
    useState<Partial<AuthUser> | null>(null);

  const deliverablePackages = useMemo(() => {
    if (!orders || !deliveries) return [];
    const deliveredPackageIds = new Set(deliveries.map((d) => d.id));
    return orders
      .filter((order) => order.status === "RECEIVED")
      .flatMap((order) => order.packages)
      .filter((pkg) => !deliveredPackageIds.has(pkg.id));
  }, [orders, deliveries]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const deliveryPromise = listDeliveryOrders();

      if (user?.user_type === "agent") {
        const deliveriesRes = await deliveryPromise;
        setDeliveries(deliveriesRes.data);
      } else {
        const ordersPromise = getOrders();
        const driversPromise = getDeliverRiders();
        const [deliveriesRes, ordersRes, driversRes] = await Promise.allSettled(
          [deliveryPromise, ordersPromise, driversPromise],
        );

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

        if (driversRes.status === "fulfilled") {
          // @ts-ignore
          setDrivers(driversRes.value.data);
        } else {
          showToast("Failed to fetch active drivers", "error");
        }
      }
    } catch (error) {
      showToast("An error occurred while fetching data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCreateDelivery = async () => {
    if (
      !selectedPackageId ||
      !deliveryAddress ||
      !deliveryDate ||
      !selectedDriverIdForCreation
    ) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setIsSubmittingCreateDelivery(true);
    try {
      const payload = {
        package_id: Number(selectedPackageId),
        driver_id: Number(selectedDriverIdForCreation),
        delivery_address: deliveryAddress,
        delivery_date: deliveryDate,
        delivery_notes: deliveryNotes,
      };
      await createDeliveryOrder(payload as any);
      showToast("Delivery order created successfully!", "success");
      setIsCreateModalOpen(false);
      // reset form
      setSelectedPackageId(null);
      setDeliveryAddress("");
      setDeliveryDate("");
      setDeliveryNotes("");
      setSelectedDriverIdForCreation("");
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
    if (!selectedDeliveryForDispatch || !selectedDriverId) {
      showToast("Please select a driver.", "error");
      return;
    }

    setIsDispatching(true);
    try {
      const payload: UpdateDeliveryStatusPayload = { status: "ASSIGNED" };
      if (selectedDriverId !== "3rd_party") {
        payload.rider_id = Number(selectedDriverId);
      }

      await updateDeliveryOrderStatus(selectedDeliveryForDispatch.id, payload);
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

  const handleDriverClick = (
    e: React.MouseEvent,
    driver: Partial<AuthUser>,
  ) => {
    e.stopPropagation();
    setSelectedDriverForDetails(driver);
    setIsDriverDetailModalOpen(true);
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
      accessor: (delivery) => {
        if (!delivery.rider_id) return "Unassigned";
        const driver = drivers.find((d) => d.id === delivery.rider_id);
        if (!driver) return `Rider ID: ${delivery.rider_id}`;

        return (
          <button
            onClick={(e) => handleDriverClick(e, driver)}
            className="text-primary-600 font-medium hover:underline focus:outline-none"
          >
            {driver.full_name}
          </button>
        );
      },
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

  const isAgent = user?.user_type === "agent";

  const displayedDeliveries = isAgent
    ? deliveries.filter((d) => d.rider_id === user?.id)
    : deliveries;

  const activeRiderIds = new Set(
    deliveries
      .filter((d) => d.status === "ASSIGNED" || d.status === "OUT_FOR_DELIVERY")
      .map((d) => d.rider_id),
  );

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
        <div className={isAgent ? "col-span-3" : "col-span-2"}>
          <DataTable
            data={displayedDeliveries}
            columns={columns}
            loading={loading}
            onRowClick={(delivery) =>
              triggerNav(`/admin/delivery/${delivery.id}`)
            }
            title="Dispatch Board"
            searchPlaceholder="Search Deliveries..."
            primaryAction={
              !isAgent && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center shadow-sm"
                >
                  <Plus size={16} className="mr-2" />
                  Create Delivery Order
                </button>
              )
            }
          />
        </div>

        {!isAgent && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <Truck size={18} className="mr-2" /> Active Drivers
              </h3>
              <div className="space-y-3">
                {loading && (
                  <p className="text-sm text-slate-500 text-center">
                    Loading drivers...
                  </p>
                )}
                {!loading && drivers.length > 0 ? (
                  drivers.map((driver) => {
                    const isBusy = activeRiderIds.has(driver.id);
                    return (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                            <User size={16} />
                          </div>
                          <div>
                            <button
                              onClick={(e) => handleDriverClick(e, driver)}
                              className="text-sm font-medium text-primary-600 hover:underline focus:outline-none"
                            >
                              {driver.full_name}
                            </button>
                            <p
                              className={`text-xs ${
                                isBusy ? "text-orange-600" : "text-green-600"
                              }`}
                            >
                              {isBusy ? "On Delivery" : "Available"}
                            </p>
                          </div>
                        </div>
                        <Phone size={16} className="text-slate-400" />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500 text-center">
                    No active drivers.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {!isAgent && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Delivery Order"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="package"
                className="block text-sm font-medium text-slate-700"
              >
                Select Package
              </label>
              <select
                id="package"
                name="package"
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a package
                </option>
                {deliverablePackages.map((p) => {
                  const order = orders.find((o) => o.id === p.order_id);
                  const clientName = order?.user?.full_name || "Unknown";
                  return (
                    <option key={p.id} value={p.id}>
                      {p.hwb_number} ({clientName})
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label
                htmlFor="driver"
                className="block text-sm font-medium text-slate-700"
              >
                Assign Driver
              </label>
              <select
                id="driver"
                name="driver"
                value={selectedDriverIdForCreation}
                onChange={(e) => setSelectedDriverIdForCreation(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>
                  Select a driver
                </option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name}
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
                    <Loader2 className="animate-spin h-5 w-5 mr-3" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create Delivery"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setSelectedDriverId("");
        }}
        title="Dispatch Order"
      >
        <form onSubmit={handleDispatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Assign Driver
            </label>
            <select
              className="w-full border p-2 rounded mt-1 bg-white text-slate-900"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a driver
              </option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name}
                </option>
              ))}
              <option value="3rd_party">3rd Party Courier</option>
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

      <Modal
        isOpen={isDriverDetailModalOpen}
        onClose={() => setIsDriverDetailModalOpen(false)}
        title="Driver Details"
        size="sm"
      >
        {selectedDriverForDetails && (
          <div className="p-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center ring-2 ring-white">
                <User size={28} className="text-slate-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedDriverForDetails.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                  Driver
                </p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <dl className="space-y-3">
                {selectedDriverForDetails.phone && (
                  <div className="flex items-center">
                    <Phone size={14} className="text-slate-400 mr-3" />
                    <span className="text-sm text-slate-700">
                      {selectedDriverForDetails.phone}
                    </span>
                  </div>
                )}
                {selectedDriverForDetails.email && (
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-slate-400 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">
                      {selectedDriverForDetails.email}
                    </span>
                  </div>
                )}
              </dl>
            </div>
            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={() => setIsDriverDetailModalOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default DeliveryOrders;
