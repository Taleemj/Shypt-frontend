import React, { useState, useEffect } from "react";
import { ArrowLeft, Printer, Package, Plane, MapPin, Eye } from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useOrders from "../../api/orders/useOrders";
import { Order } from "../../api/types/orders";
import { Package as PackageType } from "../../api/types/package";
import Modal from "../../components/UI/Modal";
import client from "../../api";

interface ClientOrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const ClientShipmentDetails: React.FC<ClientOrderDetailsProps> = ({
  orderId,
  onBack,
}) => {
  const { showToast } = useToast();
  const { getOrder } = useOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isViewPackageModalOpen, setViewPackageModalOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<PackageType | null>(
    null,
  );

  const handleOpenViewModal = (pkg: PackageType) => {
    setViewingPackage(pkg);
    setViewPackageModalOpen(true);
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await getOrder(Number(orderId));
      setOrder(response.data);
    } catch (err) {
      showToast("Failed to fetch order details.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchDetails();
    }
  }, [orderId]);

  if (loading) {
    return <div>Loading shipment details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-bold text-red-600">
          Could not load shipment.
        </h3>
        <p className="text-slate-500">
          The shipment might have been deleted or an error occurred.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  const timelineSteps = [
    { key: "PENDING", label: "Shipment Created", defaultLoc: "Client Portal" },
    {
      key: "RECEIVED",
      label: "Received at Warehouse",
      defaultLoc: order.warehouse?.name || order.origin_country,
    },
    {
      key: "CONSOLIDATED",
      label: "Consolidated",
      defaultLoc: order.warehouse?.name || order.origin_country,
    },
    {
      key: "DISPATCHED",
      label: "Dispatched from Origin",
      defaultLoc: order.warehouse?.name || order.origin_country,
    },
    { key: "IN_TRANSIT", label: "In Transit", defaultLoc: "In Transit" },
    {
      key: "ARRIVED",
      label: "Arrived at Destination",
      defaultLoc: "Destination Port",
    },
    {
      key: "READY_FOR_RELEASE",
      label: "Ready for Release",
      defaultLoc: "Local Warehouse",
    },
    { key: "RELEASED", label: "Released", defaultLoc: "Local Warehouse" },
    { key: "DELIVERED", label: "Delivered", defaultLoc: "Final Address" },
  ].map((step) => {
    const statusHistoryEntry = order.status_history.find(
      (history) => history.status === step.key
    );
    return {
      ...step,
      loc: statusHistoryEntry?.notes || statusHistoryEntry?.location || step.defaultLoc,
    };
  });

  let currentStatusIndex = timelineSteps.findIndex(
    (step) => step.key === order.status.toUpperCase(),
  );

  const timeline = timelineSteps.map((step, index) => {
    const statusHistoryEntry = order.status_history.find(
      (history) => history.status === step.key,
    );

    return {
      status: step.label,
      date: statusHistoryEntry?.created_at
        ? new Date(statusHistoryEntry.created_at).toLocaleString()
        : "-",
      loc: step.loc,
      done: index <= currentStatusIndex,
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
              Shipment #{order.id}
            </h2>
            <p className="text-slate-500 text-sm">
              Tracking ID: {order.tracking_number}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={order.status} />
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          <button
            onClick={() => {
              const originalTitle = document.title;
              document.title = `Shypt_Waybill_${order?.id}`;
              window.print();
              document.title = originalTitle;
            }}
            className="flex items-center px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm transition"
            title="Print Waybill"
          >
            <Printer size={16} className="mr-2" /> Waybill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        <div className="lg:col-span-2 space-y-6 print:w-full">
          {/* Screen Only Components */}
          <div className="print:hidden">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden mb-6">
              <div className="flex justify-between items-center relative z-10">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-green-500">
                    <Package size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Created</p>
                  <p className="text-xs text-slate-500">Client Portal</p>
                </div>
                <div className="flex-1 h-0.5 bg-green-500 mx-4"></div>
                <div className="text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 border-2 ${
                      order.status === "PENDING"
                        ? "bg-slate-50 text-slate-300 border-slate-200"
                        : "bg-blue-100 text-blue-600 border-blue-500 animate-pulse"
                    }`}
                  >
                    <Plane size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Processing</p>
                  <p className="text-xs text-slate-500">
                    {order.origin_country}
                  </p>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-slate-200">
                    <MapPin size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">
                    Final Destination
                  </p>
                  <p className="text-xs text-slate-400">TBD</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Shipment Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">
                      Receiver Name
                    </p>
                    <p className="font-medium text-slate-900 mt-1">
                      {order.receiver_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">
                      Receiver Phone
                    </p>
                    <p className="font-medium text-slate-900 mt-1">
                      {order.receiver_phone}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">
                      Receiver Email
                    </p>
                    <p className="font-medium text-slate-900 mt-1">
                      {order.receiver_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">
                      Receiver Address
                    </p>
                    <p className="font-medium text-slate-900 mt-1">
                      {order.receiver_address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Packages</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Weight (kg)
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Value (UGX)
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Dimensions (cm)
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.packages && order.packages.length > 0 ? (
                      order.packages.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="bg-white border-b hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                            {pkg.contents}
                          </td>
                          <td className="px-6 py-4">{pkg.weight}</td>
                          <td className="px-6 py-4">
                            {formatMoney(parseFloat(pkg.declared_value))}
                          </td>
                          <td className="px-6 py-4">
                            {pkg.length && pkg.width && pkg.height
                              ? `${pkg.length}x${pkg.width}x${pkg.height}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenViewModal(pkg)}
                              className="font-medium text-gray-600 hover:underline"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-slate-500 italic"
                        >
                          No packages associated with this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit print:hidden">
          <h3 className="font-bold text-slate-800 mb-6">Tracking Timeline</h3>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
            {timeline.map((event, i) => (
              <div key={i} className="relative pl-8">
                <div
                  className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${
                    event.done
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-slate-300"
                  }`}
                ></div>
                <div className={`${event.done ? "opacity-100" : "opacity-50"}`}>
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

      <Modal
        isOpen={isViewPackageModalOpen}
        onClose={() => setViewPackageModalOpen(false)}
        title="Package Details"
      >
        {viewingPackage && (
          <div className="space-y-4">
            <div>
              <strong>HWB Number:</strong> {viewingPackage.hwb_number}
            </div>
            <div>
              <strong>Description:</strong> {viewingPackage.contents}
            </div>
            <div>
              <strong>Weight:</strong> {viewingPackage.weight} kg
            </div>
            <div>
              <strong>Value:</strong> UGX{" "}
              {formatMoney(parseFloat(viewingPackage.declared_value))}
            </div>
            <div>
              <strong>Dimensions:</strong>{" "}
              {viewingPackage.length &&
              viewingPackage.width &&
              viewingPackage.height
                ? `${viewingPackage.length}x${viewingPackage.width}x${viewingPackage.height} cm`
                : "N/A"}
            </div>
            <div>
              <strong>Fragile:</strong>{" "}
              {viewingPackage.is_fragile ? "Yes" : "No"}
            </div>
            <div>
              <strong>Hazardous:</strong>{" "}
              {viewingPackage.is_hazardous ? "Yes" : "No"}
            </div>
            <div>
              <strong>Damaged:</strong>{" "}
              {viewingPackage.is_damaged ? "Yes" : "No"}
            </div>
            <div className="pt-4">
              <h4 className="font-bold text-lg mb-2">Package Photos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {viewingPackage.package_photos &&
                viewingPackage.package_photos.length > 0 ? (
                  viewingPackage.package_photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${client.defaults.baseURL}/storage/${photo}`}
                      alt={`Package photo ${index + 1}`}
                      className="w-full h-auto rounded-lg"
                    />
                  ))
                ) : (
                  <p className="text-slate-500 italic">
                    No photos available for this package.
                  </p>
                )}
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewPackageModalOpen(false)}
                className="px-4 py-2 border rounded text-slate-600 bg-white"
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

export default ClientShipmentDetails;
