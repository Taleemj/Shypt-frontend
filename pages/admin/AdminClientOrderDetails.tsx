import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  DollarSign,
  Upload,
  Edit,
  CheckCircle,
  Package,
  Plane,
  MapPin,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useOrders from "../../api/orders/useOrders";
import { Order, UpdateOrderStatusPayload } from "../../api/types/orders";
import Modal from "../../components/UI/Modal";
import {
  Watermark,
  SecureHeader,
  SecurityFooter,
} from "../../components/UI/SecurityFeatures";
import usePackage from "../../api/package/usePackage";
import useInvoice from "../../api/invoices/useInvoice";

// Interfaces for Invoice Preview
interface LineItemData {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PreviewData {
  user_id: number;
  user_full_name: string | undefined;
  user_email: string | undefined;
  due_date: string;
  currency: string;
  line_items: LineItemData[];
  notes: string;
  type: string;
  order_id: number;
}

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCreating: boolean;
  invoiceData: PreviewData | null;
  formatMoney: (amount: number) => string;
}

const InvoicePreviewModal: React.FC<InvoicePreviewProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isCreating,
  invoiceData,
  formatMoney,
}) => {
  if (!isOpen || !invoiceData) return null;

  const { user_full_name, user_email, due_date, currency, line_items, notes } =
    invoiceData;

  const currencySymbol = currency === "UGX" ? "UGX " : "$";
  const subtotal = line_items.reduce((acc, item) => acc + item.total, 0);
  const tax = 0.0;
  const total = subtotal + tax;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Preview" size="xl">
      <div className="bg-white rounded-lg px-6 relative overflow-hidden">
        <Watermark text="PREVIEW" />
        <SecureHeader title="Commercial Invoice" />

        <div className="relative z-10">
          <div className="flex justify-between border-b border-slate-100 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">INVOICE</h1>
              <p className="text-slate-500 mt-1 font-mono">#DRAFT-001</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-slate-800">Shypt Logistics</h3>
              <p className="text-sm text-slate-500">Plot 12, Industrial Area</p>
              <p className="text-sm text-slate-500">Kampala, Uganda</p>
              <p className="text-sm text-slate-500">www.shypt.net</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                Bill To
              </p>
              <p className="font-bold text-slate-800">{user_full_name}</p>
              <p className="text-sm text-slate-500">{user_email}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Due Date
                </p>
                <p className="font-bold text-slate-800">
                  {new Date(due_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Amount Due
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {currencySymbol}
                  {formatMoney(total)}
                </p>
              </div>
            </div>
          </div>

          <table className="w-full text-left mb-6">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-md">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right rounded-r-md">Amount</th>
              </tr>
            </thead>
            <tbody>
              {line_items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-slate-700">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {currencySymbol}
                    {formatMoney(item.unit_price)}
                  </td>

                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {currencySymbol}
                    {formatMoney(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {notes && (
            <div className="mb-6 bg-slate-50 px-4 py-2 rounded-md text-sm text-slate-600">
              <p className="font-bold mb-1 inline">Notes:</p>
              <p className="inline">{notes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>
                  {currencySymbol}
                  {formatMoney(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax (0%)</span>
                <span>
                  {currencySymbol}
                  {formatMoney(tax)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
                <span>Total</span>
                <span>
                  {currencySymbol}
                  {formatMoney(total)}
                </span>
              </div>
            </div>
          </div>
          {/* <SecurityFooter
            type="DRAFT"
            reference={new Date().getTime().toString()}
          /> */}
        </div>
      </div>
      <div className="flex justify-end pt-3 bg-slate-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
        <button
          type="button"
          onClick={onClose}
          disabled={isCreating}
          className="px-4 py-2 border rounded text-slate-600 mr-2 bg-white hover:bg-slate-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isCreating}
          className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:bg-slate-500"
        >
          {isCreating ? "Saving..." : "Save and Send"}
        </button>
      </div>
    </Modal>
  );
};

interface AdminClientOrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

const ALL_POSSIBLE_STATUS_OPTIONS = [
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

const AdminClientOrderDetails: React.FC<AdminClientOrderDetailsProps> = ({
  orderId,
  onBack,
}) => {
  const { showToast } = useToast();
  const { getOrder, updateOrderStatus, deleteOrder } = useOrders();
  const { addPackageToOrder } = usePackage();
  const { createInvoice, addItemToInvoice, sendInvoiceByEmail } = useInvoice();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isAddPackageModalOpen, setAddPackageModalOpen] = useState(false);
  const [packageContents, setPackageContents] = useState("");
  const [packageWeight, setPackageWeight] = useState("");
  const [packageValue, setPackageValue] = useState("");
  const [packageLength, setPackageLength] = useState("");
  const [packageWidth, setPackageWidth] = useState("");
  const [packageHeight, setPackageHeight] = useState("");
  const [isAddingPackage, setIsAddingPackage] = useState(false);

  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] =
    useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [invoiceCurrency, setInvoiceCurrency] = useState("USD");

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
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

  const handlePreviewInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order) return;

    const formData = new FormData(e.currentTarget);
    const currency = formData.get("currency") as string;
    const type = formData.get("type") as string;
    const notes = formData.get("notes") as string;
    const amount = parseFloat(formData.get("amount") as string);

    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount for the invoice.", "error");
      return;
    }

    const line_items: LineItemData[] = [
      {
        description: notes || type,
        quantity: 1,
        unit_price: amount,
        total: amount,
      },
    ];

    const data: PreviewData = {
      user_id: order.user.id,
      user_full_name: order.user.full_name,
      user_email: order.user.email,
      type: type,
      notes: notes,
      currency: currency,
      due_date: new Date().toISOString().split("T")[0],
      line_items: line_items,
      order_id: order.id,
    };

    setPreviewData(data);
    setIsCreateInvoiceModalOpen(false);
    setIsPreviewOpen(true);
  };

  const handleConfirmCreateInvoice = async () => {
    if (!previewData) return;

    setIsGeneratingInvoice(true);
    try {
      const invoiceResponse = await createInvoice({
        user_id: previewData.user_id,
        order_id: previewData.order_id,
        type: previewData.type,
        due_date: previewData.due_date,
        currency: previewData.currency,
      });

      // @ts-ignore
      const newInvoice = invoiceResponse.data;

      for (const item of previewData.line_items) {
        await addItemToInvoice({
          invoice_id: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        });
      }

      try {
        await sendInvoiceByEmail(newInvoice.id);
        showToast("Invoice generated and sent to client!", "success");
      } catch (emailError) {
        console.error("Failed to send invoice email", emailError);
        showToast("Invoice generated, but failed to send email.", "warning");
      }

      setIsPreviewOpen(false);
      setPreviewData(null);

      triggerNav(`/admin/invoices/${newInvoice.id}`);
    } catch (error) {
      console.error("Failed to create invoice", error);
      showToast("Failed to create invoice. Please try again.", "error");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsAddingPackage(true);
    const packageHwbNumber = `HWB-${Math.floor(Math.random() * 1000000)}`;

    try {
      // @ts-ignore
      const locationId = order.warehouse?.code || order.origin_country;
      if (!locationId) {
        showToast(
          "Order has no location information. Cannot add package.",
          "error"
        );
        setIsAddingPackage(false);
        return;
      }

      const packageData = {
        order_id: order.id,
        hwb_number: packageHwbNumber,
        contents: packageContents || "General Cargo",
        declared_value: packageValue,
        weight: parseFloat(packageWeight),
        length: packageLength ? parseFloat(packageLength) : undefined,
        width: packageWidth ? parseFloat(packageWidth) : undefined,
        height: packageHeight ? parseFloat(packageHeight) : undefined,
        location_id: locationId,
        is_fragile: false,
        is_hazardous: false,
        is_damaged: false,
      };

      await addPackageToOrder(packageData);
      showToast("Package added successfully", "success");

      setAddPackageModalOpen(false);
      setPackageContents("");
      setPackageWeight("");
      setPackageValue("");
      setPackageLength("");
      setPackageWidth("");
      setPackageHeight("");

      await fetchDetails();
    } catch (error: any) {
      console.error("Failed to add package:", error);
      showToast(
        `Failed to add package: ${
          "message" in error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsAddingPackage(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order) return;

    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as string;
    const notes = formData.get("notes") as string;
    const location = formData.get("location") as string;

    if (!newStatus) {
      showToast("Please select a status.", "error");
      return;
    }

    const payload: UpdateOrderStatusPayload = {
      order_id: order.id,
      status: newStatus,
      notes: notes,
      user_id: order.user_id,
      location: location,
    };

    try {
      setIsUpdatingStatus(true);
      await updateOrderStatus(payload);
      showToast("Order status updated successfully", "success");
      setStatusModalOpen(false);
      await fetchDetails();
    } catch (error) {
      showToast("Failed to update order status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;

    if (
      window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      try {
        await deleteOrder(order.id);
        showToast("Order deleted successfully", "success");
        onBack();
      } catch (error) {
        showToast("Failed to delete order", "error");
      }
    }
  };

  if (loading) {
    return <div>Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-bold text-red-600">
          Could not load order.
        </h3>
        <p className="text-slate-500">
          The order might have been deleted or an error occurred.
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
    { key: "PENDING", label: "Order Created", loc: "Client Portal" },
    {
      key: "RECEIVED",
      label: "Received at Warehouse",
      loc: order.origin_country,
    },
    {
      key: "CONSOLIDATED",
      label: "Consolidated",
      loc: order.origin_country,
    },
    {
      key: "DISPATCHED",
      label: "Dispatched from Origin",
      loc: order.origin_country,
    },
    { key: "IN_TRANSIT", label: "In Transit", loc: "In Transit" },
    {
      key: "ARRIVED",
      label: "Arrived at Destination",
      loc: "Destination Port",
    },
    {
      key: "READY_FOR_RELEASE",
      label: "Ready for Release",
      loc: "Local Warehouse",
    },
    { key: "RELEASED", label: "Released", loc: "Local Warehouse" },
    { key: "DELIVERED", label: "Delivered", loc: "Final Address" },
  ];

  let currentStatusIndex = timelineSteps.findIndex(
    (step) => step.key === order.status.toUpperCase()
  );

  const timeline = timelineSteps.map((step, index) => ({
    status: step.label,
    date:
      index === 0
        ? new Date(order.created_at).toLocaleString()
        : index <= currentStatusIndex
        ? new Date(order.updated_at).toLocaleString()
        : "-",
    loc: step.loc,
    done: index <= currentStatusIndex,
  }));

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
              {order.tracking_number}
            </h2>
            <p className="text-slate-500 text-sm">
              Client: {order.user.full_name} ({order.user.email})
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
          <button
            onClick={handleDeleteOrder}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete Order"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-sm flex flex-wrap gap-2 items-center print:hidden">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 ml-2">
          Actions:
        </span>
        <button
          onClick={() => setStatusModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm transition font-medium"
        >
          <CheckCircle size={14} className="mr-2" /> Update Status
        </button>
        <button
          onClick={() => setAddPackageModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition font-medium"
        >
          <Package size={14} className="mr-2" /> Add Package
        </button>
        <button
          onClick={() => setIsCreateInvoiceModalOpen(true)}
          disabled={isGeneratingInvoice}
          className="flex items-center px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-sm transition font-medium disabled:opacity-50"
        >
          <FileText size={14} className="mr-2" />
          {isGeneratingInvoice ? "Generating..." : "Generate Invoice"}
        </button>
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
                <h3 className="font-bold text-slate-800">Order Details</h3>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
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

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Packages</h3>
              </div>
              <div className="p-6 space-y-3">
                {order.packages && order.packages.length > 0 ? (
                  order.packages.map((pkg, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100"
                    >
                      <div className="flex items-center">
                        <Package className="text-blue-500 mr-3" size={20} />
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {/* @ts-ignore */}
                            {pkg.contents || pkg.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {/* @ts-ignore */}
                            Weight: {pkg.weight}kg, Value: ${pkg.declared_value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No packages associated with this order.
                  </p>
                )}
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
              defaultValue={order?.status}
            >
              <option value="" disabled>
                Select next status
              </option>
              {ALL_POSSIBLE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace(/_/g, " ")}
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
              className="mt-1 w-full border border-slate-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              name="notes"
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              rows={3}
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

      <Modal
        isOpen={isAddPackageModalOpen}
        onClose={() => setAddPackageModalOpen(false)}
        title="Add New Package to Order"
      >
        <form onSubmit={handleAddPackage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              required
              type="text"
              value={packageContents}
              onChange={(e) => setPackageContents(e.target.value)}
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
                value={packageWeight}
                onChange={(e) => setPackageWeight(e.target.value)}
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
                value={packageValue}
                onChange={(e) => setPackageValue(e.target.value)}
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
                value={packageLength}
                onChange={(e) => setPackageLength(e.target.value)}
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
                value={packageWidth}
                onChange={(e) => setPackageWidth(e.target.value)}
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
                value={packageHeight}
                onChange={(e) => setPackageHeight(e.target.value)}
                className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
                placeholder="0.0"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setAddPackageModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAddingPackage}
            >
              {isAddingPackage ? "Adding..." : "Add Package"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCreateInvoiceModalOpen}
        onClose={() => setIsCreateInvoiceModalOpen(false)}
        title="Generate New Invoice"
      >
        <form onSubmit={handlePreviewInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Invoice Type
            </label>
            <select
              name="type"
              defaultValue="FREIGHT"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            >
              <option value="FREIGHT">Freight Charges</option>
              <option value="OTHER">Other</option>
              <option value="STORAGE">Storage Fee</option>
              <option value="CUSTOMS">Customs Duty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Currency
            </label>
            <select
              name="currency"
              value={invoiceCurrency}
              onChange={(e) => setInvoiceCurrency(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            >
              <option value="USD">USD</option>
              <option value="UGX">UGX</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-slate-700"
            >
              Amount ({invoiceCurrency})
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description / Notes
            </label>
            <textarea
              name="notes"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
              rows={3}
              placeholder="e.g. Freight charges for electronics shipment"
            ></textarea>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsCreateInvoiceModalOpen(false)}
              className="px-4 py-2 border rounded text-slate-600 mr-2 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGeneratingInvoice}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:bg-slate-500"
            >
              Preview Invoice
            </button>
          </div>
        </form>
      </Modal>

      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setIsCreateInvoiceModalOpen(true);
        }}
        onConfirm={handleConfirmCreateInvoice}
        isCreating={isGeneratingInvoice}
        invoiceData={previewData}
        formatMoney={formatMoney}
      />
    </div>
  );
};

export default AdminClientOrderDetails;
