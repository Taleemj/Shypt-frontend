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
  Plus,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useCargo from "../../api/cargo/useCargo";
import {
  CargoDeclaration,
  UpdateCargoDeclarationPayload,
} from "../../api/types/cargo";
import Modal from "../../components/UI/Modal";
import {
  Watermark,
  SecureHeader,
  SecurityFooter,
} from "../../components/UI/SecurityFeatures";

interface AdminOrderDetailsProps {
  declarationId: string;
  onBack: () => void;
}

const DECLARATION_STATUSES = ["pending", "received", "declined"];
const ALL_POSSIBLE_STATUS_OPTIONS = [
  "pending",
  "received",
  // "consolidated",
  // "dispatched",
  // "in_transit",
  // "arrived",
  // "ready_for_release",
  // "released",
  // "delivered",
  // "declined",
];

const AdminOrderDetails: React.FC<AdminOrderDetailsProps> = ({
  declarationId,
  onBack,
}) => {
  const { showToast } = useToast();
  const {
    getCargoDeclaration,
    updateCargoDeclaration,
    deleteCargoDeclaration,
    uploadCargoDeclarationFiles,
  } = useCargo();

  const [declaration, setDeclaration] = useState<CargoDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // State for cargo items in edit modal
  const [cargoItems, setCargoItems] = useState<
    { cargo_item: string; value: number; weight: number }[]
  >([]);

  // Derived state for total value and weight from cargoItems
  const totalDeclaredValue = cargoItems.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const totalEstWeight = cargoItems.reduce((sum, item) => sum + item.weight, 0);

  const handleAddItem = () => {
    setCargoItems([...cargoItems, { cargo_item: "", value: 0, weight: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newCargoItems = [...cargoItems];
    newCargoItems.splice(index, 1);
    setCargoItems(newCargoItems);
  };

  const handleCargoItemChange = (
    index: number,
    field: keyof (typeof cargoItems)[0],
    value: string | number,
  ) => {
    const newCargoItems = [...cargoItems];
    if (field === "value" || field === "weight") {
      newCargoItems[index][field] = Number(value);
    } else {
      newCargoItems[index][field] = value as string;
    }
    setCargoItems(newCargoItems);
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await getCargoDeclaration(declarationId);
      setDeclaration(response.data);
      // Initialize cargoItems from fetched declaration
      if (response.data.cargo_details) {
        if (typeof response.data.cargo_details === "string") {
          setCargoItems([
            {
              cargo_item: response.data.cargo_details,
              value: Number(response.data.value) || 0,
              weight: Number(response.data.weight) || 0,
            },
          ]);
        } else if (Array.isArray(response.data.cargo_details)) {
          setCargoItems(response.data.cargo_details);
        }
      } else {
        setCargoItems([{ cargo_item: "", value: 0, weight: 0 }]);
      }
    } catch (err) {
      showToast("Failed to fetch declaration details.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (declarationId) {
      fetchDetails();
    }
  }, [declarationId]);

  const handleStatusUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!declaration) return;

    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as string;

    if (!newStatus) {
      showToast("Please select a status.", "error");
      return;
    }

    const payload: UpdateCargoDeclarationPayload = {
      status: newStatus,
    };

    try {
      setIsUpdatingStatus(true);
      await updateCargoDeclaration(declaration.id, payload);
      showToast("Declaration status updated successfully", "success");
      setStatusModalOpen(false);
      await fetchDetails();
    } catch (error) {
      showToast("Failed to update declaration status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!declaration) return;

    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      const payload: UpdateCargoDeclarationPayload = {
        internal_curier: formData.get("internal_curier") as string,
        tracking_number: formData.get("tracking_number") as string,
        cargo_details: cargoItems, // Use the updated cargoItems array
        value: totalDeclaredValue, // Use the derived total
        weight: totalEstWeight, // Use the derived total
        status: formData.get("status") as string,
      };
      await updateCargoDeclaration(declaration.id, payload);
      showToast("Declaration updated successfully", "success");
      setIsEditModalOpen(false);
      fetchDetails();
    } catch (error) {
      showToast("Failed to update declaration.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeclaration = async () => {
    if (!declaration) return;

    if (
      window.confirm(
        "Are you sure you want to delete this declaration? This action cannot be undone.",
      )
    ) {
      try {
        await deleteCargoDeclaration(declaration.id);
        showToast("Declaration deleted successfully", "success");
        onBack(); // Navigate back to the list after deletion
      } catch (error) {
        showToast("Failed to delete declaration", "error");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!declaration) return;

    const form = e.currentTarget;
    const fileInput = form.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showToast("Please select at least one file to upload.", "error");
      return;
    }

    const formData = new FormData(form);

    setIsUploading(true);
    try {
      await uploadCargoDeclarationFiles(declaration.id, formData);
      showToast("Files uploaded successfully!", "success");
      setIsUploadModalOpen(false);
      fetchDetails();
    } catch (error) {
      showToast("Failed to upload files.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div>Loading declaration details...</div>;
  }

  if (!declaration) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-bold text-red-600">
          Could not load declaration.
        </h3>
        <p className="text-slate-500">
          The declaration might have been deleted or an error occurred.
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

  const availableNextStatuses = DECLARATION_STATUSES.filter(
    (s) => s !== declaration.status,
  );

  const timelineSteps = [
    {
      key: "PENDING",
      label: "Delivery Request Received",
      loc: "Client Portal",
    },
    {
      key: "RECEIVED",
      label: "Received at Warehouse",
      loc: declaration.location.name,
    },
    // {
    //   key: "CONSOLIDATED",
    //   label: "Consolidated",
    //   loc: declaration.location.name,
    // },
    // {
    //   key: "DISPATCHED",
    //   label: "Dispatched from Origin",
    //   loc: declaration.location.name,
    // },
    // { key: "IN_TRANSIT", label: "In Transit", loc: "In Transit" },
    // {
    //   key: "ARRIVED",
    //   label: "Arrived at Destination",
    //   loc: "Destination Port",
    // },
    // {
    //   key: "READY_FOR_RELEASE",
    //   label: "Ready for Release",
    //   loc: "Local Warehouse",
    // },
    // { key: "RELEASED", label: "Released", loc: "Local Warehouse" },
    // { key: "DELIVERED", label: "Delivered", loc: "Final Address" },
  ];

  let currentStatusIndex = timelineSteps.findIndex(
    (step) => step.key === declaration.status.toUpperCase(),
  );

  // Handle cases where status from declaration is not in the timeline, e.g., a lowercase version
  if (currentStatusIndex === -1 && declaration.status !== "declined") {
    currentStatusIndex = 0; // Default to the first step if no match is found
  }

  if (declaration.status === "declined") {
    currentStatusIndex = -1; // Set to -1 to ensure no steps are marked 'done'
  }

  const timeline = timelineSteps.map((step, index) => ({
    status: step.label,
    date:
      index === 0
        ? new Date(declaration.created_at).toLocaleString()
        : index <= currentStatusIndex
          ? new Date(declaration.updated_at).toLocaleString()
          : "-",
    loc: step.loc,
    done: index <= currentStatusIndex && declaration.status !== "declined",
  }));

  if (declaration.status === "declined") {
    // Insert 'Declined' status and ensure no other statuses are marked as done
    timeline.forEach((step) => (step.done = false));
    timeline.splice(1, 0, {
      status: "Declaration Declined",
      date: new Date(declaration.updated_at).toLocaleString(),
      loc: declaration.location.name,
      done: true,
    });
    // Ensure 'Order Created' remains done
    if (timeline.length > 0) timeline[0].done = true;
  }

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
              Declaration #{declaration.id}
            </h2>
            <p className="text-slate-500 text-sm">
              {/* @ts-ignore */}
              Client: {declaration.user.name} ({declaration.user.email})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={declaration.status} />
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          <button
            onClick={() => {
              const originalTitle = document.title;
              document.title = `Shypt_Waybill_${declaration?.id}`;
              window.print();
              document.title = originalTitle;
            }}
            className="flex items-center px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm transition"
            title="Print Waybill"
          >
            <Printer size={16} className="mr-2" /> Waybill
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit Order"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={handleDeleteDeclaration}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete Declaration"
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
        {availableNextStatuses.length > 0 && (
          <button
            onClick={() => setStatusModalOpen(true)}
            className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm transition font-medium"
          >
            <CheckCircle size={14} className="mr-2" /> Update Status
          </button>
        )}
        {/* <button
          onClick={() =>
            showToast("Action Triggered: GENERATE_INVOICE", "info")
          }
          className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
        >
          <DollarSign size={14} className="mr-2" /> Generate Invoice
        </button> */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
        >
          <Upload size={14} className="mr-2" /> Upload Docs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        <div className="lg:col-span-2 space-y-6 print:w-full">
          {/* Printable Waybill - Placeholder */}
          <div className="hidden print:block bg-white p-0">
            <Watermark text="WAYBILL" />
            <SecureHeader title="House Waybill" />
            <div className="relative z-10 p-6">
              <p>
                Printable waybill for Declaration #{declaration.id} goes here.
              </p>
              <p>
                More details from the declaration can be rendered here for
                printing.
              </p>
            </div>
            {/* @ts-ignore */}
            <SecurityFooter type="COPY" reference={declaration.id} />
          </div>

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
                      declaration.status === "pending"
                        ? "bg-slate-50 text-slate-300 border-slate-200"
                        : "bg-blue-100 text-blue-600 border-blue-500 animate-pulse"
                    }`}
                  >
                    <Plane size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Processing</p>
                  <p className="text-xs text-slate-500">
                    {declaration.location.name}
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
                <h3 className="font-bold text-slate-800">Cargo Details</h3>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Itemized Cargo
                  </p>
                  {declaration.cargo_details &&
                  declaration.cargo_details.length > 0 ? (
                    <div className="space-y-1">
                      {declaration.cargo_details.map((item, index) => (
                        <p key={index} className="text-sm text-slate-900">
                          • {item.cargo_item} (Value: ${item.value.toFixed(2)},
                          Weight: {item.weight} kg)
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900 mt-1">
                      No cargo details provided
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Total Weight
                  </p>
                  <p className="font-medium text-slate-900 mt-1">
                    {(declaration.cargo_details || [])
                      .reduce((sum, item) => sum + item.weight, 0)
                      .toFixed(2)}{" "}
                    kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Tracking Number
                  </p>
                  <p className="font-medium text-slate-900 mt-1 font-mono">
                    {declaration.tracking_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Declared Value
                  </p>
                  <p className="font-medium text-slate-900 mt-1">
                    ${" "}
                    {(declaration.cargo_details || [])
                      .reduce((sum, item) => sum + item.value, 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Documents</h3>
              </div>
              <div className="p-6 space-y-3">
                {declaration.files && declaration.files.length > 0 ? (
                  declaration.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100"
                    >
                      <div className="flex items-center">
                        <FileText className="text-red-500 mr-3" size={20} />
                        <div>
                          {/* <p className="text-sm font-medium text-slate-700">
                            {file.split("/").pop()}
                          </p> */}
                          <p className="text-xs text-slate-500">
                            Attached File
                          </p>
                        </div>
                      </div>
                      <a
                        href={import.meta.env.VITE_API_URL + "/storage/" + file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No documents attached.
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
        title="Update Declaration Status"
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
              defaultValue={declaration?.status}
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
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Declaration"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Internal Courier
            </label>
            <input
              name="internal_curier"
              type="text"
              defaultValue={declaration?.internal_curier}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tracking Number
            </label>
            <input
              name="tracking_number"
              type="text"
              defaultValue={declaration?.tracking_number}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Cargo Details
            </label>
            <div className="space-y-4">
              {cargoItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg relative space-y-3 bg-slate-50"
                >
                  {cargoItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
                    >
                      X
                    </button>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cargo Item Description{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.cargo_item}
                      onChange={(e) =>
                        handleCargoItemChange(
                          index,
                          "cargo_item",
                          e.target.value,
                        )
                      }
                      required
                      placeholder="e.g. Blue Jeans"
                      className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Value ($) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.value}
                        onChange={(e) =>
                          handleCargoItemChange(index, "value", e.target.value)
                        }
                        required
                        placeholder="0.00"
                        className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Weight (kg) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.weight}
                        onChange={(e) =>
                          handleCargoItemChange(index, "weight", e.target.value)
                        }
                        required
                        placeholder="0.0"
                        className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-4 text-primary-600 font-semibold flex items-center text-sm"
              >
                <Plus size={16} className="mr-2" /> Add Another Item
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Total Declared Value ($)
                </label>
                <p className="text-lg font-bold text-slate-900">
                  $ {totalDeclaredValue.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Total Est. Weight (kg)
                </label>
                <p className="text-lg font-bold text-slate-900">
                  {totalEstWeight.toFixed(2)} kg
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              name="status"
              defaultValue={declaration?.status}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
            >
              {[
                "pending",
                "received",
                "consolidated",
                "dispatched",
                "in_transit",
                "arrived",
                "ready_for_release",
                "released",
                "delivered",
                ...(declaration?.status === "declined" &&
                ![
                  "pending",
                  "received",
                  "consolidated",
                  "dispatched",
                  "in_transit",
                  "arrived",
                  "ready_for_release",
                  "released",
                  "delivered",
                ].includes(declaration.status)
                  ? ["declined"]
                  : []),
              ].map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center disabled:bg-primary-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Documents"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Files
            </label>
            <input
              type="file"
              name="files[]"
              multiple
              className="mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center disabled:bg-primary-400"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" /> Uploading...
                </>
              ) : (
                "Upload"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminOrderDetails;
