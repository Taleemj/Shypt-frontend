import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  Upload,
  Edit,
  CheckCircle,
  Truck,
  MapPin,
  FileText,
  Loader2,
  Trash2,
  Camera,
  Signature,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useDelivery from "../../api/delivery/useDelivery";
import {
  Delivery,
  UpdateDeliveryStatusPayload,
  UpdateDeliveryOrderPayload,
  UploadSignaturePayload,
} from "../../api/types/delivery";
import Modal from "../../components/UI/Modal";

interface DeliveryDetailsProps {
  deliveryId: string;
  onBack: () => void;
}

const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({
  deliveryId,
  onBack,
}) => {
  const { showToast } = useToast();
  const {
    showDeliveryOrder,
    updateDeliveryOrderStatus,
    updateDeliveryOrder,
    deleteDeliveryOrder,
    uploadPodPhoto,
    uploadCustomerSignature,
  } = useDelivery();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isPodModalOpen, setPodModalOpen] = useState(false);
  const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);

  // Forms state
  const [status, setStatus] = useState<any>("");
  const [reason, setReason] = useState("");
  const [riderId, setRiderId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [podPhoto, setPodPhoto] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  // Submitting state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPod, setIsUploadingPod] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await showDeliveryOrder(Number(deliveryId));
      setDelivery(response);
      setStatus(response.status);
      setDeliveryAddress(response.delivery_address);
      setDeliveryDate(response.delivery_date.split("T")[0]);
      setDeliveryNotes(response.delivery_notes || "");
    } catch (err) {
      showToast("Failed to fetch delivery details.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryId) {
      fetchDetails();
    }
  }, [deliveryId]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    const payload: UpdateDeliveryStatusPayload = {
      status: status,
    };
    if (status === "ASSIGNED" && riderId) payload.rider_id = Number(riderId);
    if (status === "FAILED" && reason) payload.reason = reason;

    setIsUpdatingStatus(true);
    try {
      await updateDeliveryOrderStatus(delivery.id, payload);
      showToast("Status updated successfully", "success");
      setStatusModalOpen(false);
      fetchDetails();
    } catch (error) {
      showToast("Failed to update status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    const payload: UpdateDeliveryOrderPayload = {
      delivery_address: deliveryAddress,
      delivery_date: deliveryDate,
      delivery_notes: deliveryNotes,
    };

    setIsUpdating(true);
    try {
      await updateDeliveryOrder(delivery.id, payload);
      showToast("Delivery details updated", "success");
      setUpdateModalOpen(false);
      fetchDetails();
    } catch (error) {
      showToast("Failed to update details", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePodUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery || !podPhoto) return;

    setIsUploadingPod(true);
    try {
      await uploadPodPhoto(delivery.id, podPhoto);
      showToast("POD photo uploaded", "success");
      setPodModalOpen(false);
      fetchDetails();
    } catch (error) {
      showToast("Failed to upload photo", "error");
    } finally {
      setIsUploadingPod(false);
    }
  };

  const handleSignatureUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery || !signatureFile) return;

    setIsUploadingSignature(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(signatureFile); // Read the file as a Data URL (Base64)

      reader.onload = async () => {
        const base64String = reader.result as string;
        const payload: UploadSignaturePayload = { signature: base64String };

        try {
          await uploadCustomerSignature(delivery.id, payload);
          showToast("Signature uploaded", "success");
          setSignatureModalOpen(false);
          setSignatureFile(null); // Clear the selected file
          fetchDetails();
        } catch (error) {
          showToast("Failed to upload signature", "error");
          console.error("Signature upload error:", error);
        } finally {
          setIsUploadingSignature(false);
        }
      };

      reader.onerror = (error) => {
        showToast("Failed to read signature file.", "error");
        console.error("FileReader error:", error);
        setIsUploadingSignature(false);
      };

    } catch (error) {
      showToast("Failed to process signature file.", "error");
      console.error("General signature upload error:", error);
      setIsUploadingSignature(false);
    }
  };

  const handleDelete = async () => {
    if (!delivery) return;
    if (
      window.confirm("Are you sure you want to delete this delivery order?")
    ) {
      try {
        await deleteDeliveryOrder(delivery.id);
        showToast("Delivery order deleted", "success");
        onBack();
      } catch (error) {
        showToast("Failed to delete delivery order", "error");
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!delivery) return <div>Delivery not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {delivery.delivery_number}
            </h2>
            <p className="text-slate-500 text-sm">
              Order: {delivery.order.tracking_number}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={delivery.status} />
          <button
            onClick={handleDelete}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete Order"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-sm flex flex-wrap gap-2 items-center">
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
          onClick={() => setUpdateModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition font-medium"
        >
          <Edit size={14} className="mr-2" /> Edit Details
        </button>
        <button
          onClick={() => setPodModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm transition font-medium"
        >
          <Camera size={14} className="mr-2" /> Upload POD
        </button>
        <button
          onClick={() => setSignatureModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-sm transition font-medium"
        >
          <Signature size={14} className="mr-2" /> Upload Signature
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">
              Delivery Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Address</p>
                <p>{delivery.delivery_address}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p>{new Date(delivery.delivery_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Notes</p>
                <p>{delivery.delivery_notes || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Delivered At</p>
                <p>
                  {delivery.delivered_at
                    ? new Date(delivery.delivered_at).toLocaleString()
                    : "Not yet delivered"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Client & Order</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Client</p>
                <p>{delivery.order.user.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Contact</p>
                <p>
                  {delivery.order.user.email} / {delivery.order.user.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Order Tracking #</p>
                <p>{delivery.order.tracking_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Order Type</p>
                {/* @ts-ignore */}
                <p>{delivery.order.type}</p>
              </div>
            </div>
          </div>
          {(delivery.pod_photo_path || delivery.pod_signature) && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">
                Proof of Delivery
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {delivery.pod_photo_path && (
                  <div>
                    <p className="text-sm text-slate-500">POD Photo</p>
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${delivery.pod_photo_path}`}
                      alt="Proof of Delivery"
                      className="mt-2 max-w-full h-auto rounded-md shadow"
                    />
                  </div>
                )}
                {delivery.pod_signature && (
                  <div>
                    <p className="text-sm text-slate-500">Customer Signature</p>
                    <img
                      src={delivery.pod_signature}
                      alt="Customer Signature"
                      className="mt-2 max-w-full h-auto rounded-md shadow"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
          <h3 className="font-bold text-slate-800 mb-6">Delivery Timeline</h3>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
            {/* Assuming a simple timeline for delivery based on status and dates */}
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-green-500 border-green-500"></div>
              <p className="text-sm font-bold text-slate-800">
                Delivery Created
              </p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {new Date(delivery.created_at).toLocaleString()}
              </p>
            </div>
            {delivery.status === "ASSIGNED" && delivery.updated_at && (
              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-blue-500 border-blue-500"></div>
                <p className="text-sm font-bold text-slate-800">
                  Assigned to Rider
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {new Date(delivery.updated_at).toLocaleString()}
                </p>
              </div>
            )}
            {delivery.status === "OUT_FOR_DELIVERY" && delivery.updated_at && (
              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-yellow-500 border-yellow-500"></div>
                <p className="text-sm font-bold text-slate-800">
                  Out for Delivery
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {new Date(delivery.updated_at).toLocaleString()}
                </p>
              </div>
            )}
            {delivery.status === "DELIVERED" && delivery.delivered_at && (
              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-green-500 border-green-500"></div>
                <p className="text-sm font-bold text-slate-800">Delivered</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {new Date(delivery.delivered_at).toLocaleString()}
                </p>
              </div>
            )}
            {delivery.status === "CANCELLED" && delivery.updated_at && (
              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-red-500 border-red-500"></div>
                <p className="text-sm font-bold text-slate-800">Cancelled</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {new Date(delivery.updated_at).toLocaleString()}
                </p>
              </div>
            )}
            {delivery.status === "FAILED" && delivery.updated_at && (
              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-red-500 border-red-500"></div>
                <p className="text-sm font-bold text-slate-800">Failed</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {new Date(delivery.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Delivery Status"
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              New Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              required
            >
              <option value="">Select Status</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {status === "ASSIGNED" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Rider ID
              </label>
              <input
                type="number"
                value={riderId}
                onChange={(e) => setRiderId(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                placeholder="Enter Rider ID"
              />
            </div>
          )}
          {status === "FAILED" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Reason for Failure
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                placeholder="Reason"
              ></textarea>
            </div>
          )}
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
              disabled={isUpdatingStatus}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingStatus ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Delivery Details Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="Edit Delivery Details"
      >
        <form onSubmit={handleUpdateDelivery} className="space-y-4">
          <div>
            <label
              htmlFor="edit_delivery_address"
              className="block text-sm font-medium text-slate-700"
            >
              Delivery Address
            </label>
            <input
              type="text"
              id="edit_delivery_address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="edit_delivery_date"
              className="block text-sm font-medium text-slate-700"
            >
              Delivery Date
            </label>
            <input
              type="date"
              id="edit_delivery_date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="edit_delivery_notes"
              className="block text-sm font-medium text-slate-700"
            >
              Delivery Notes
            </label>
            <textarea
              id="edit_delivery_notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setUpdateModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Update Details"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload POD Modal */}
      <Modal
        isOpen={isPodModalOpen}
        onClose={() => setPodModalOpen(false)}
        title="Upload Proof of Delivery Photo"
      >
        <form onSubmit={handlePodUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Select Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && setPodPhoto(e.target.files[0])}
              className="mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setPodModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingPod || !podPhoto}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingPod ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Signature Modal */}
      <Modal
        isOpen={isSignatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        title="Upload Customer Signature"
      >
        <form onSubmit={handleSignatureUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Select Signature File
            </label>
            <input
              type="file"
              accept="image/*" // Restrict to image files
              onChange={(e) => e.target.files && setSignatureFile(e.target.files[0])}
              className="mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => { setSignatureModalOpen(false); setSignatureFile(null); }} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white">Cancel</button>
            <button type="submit" disabled={isUploadingSignature || !signatureFile} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">{isUploadingSignature ? "Uploading..." : "Upload Signature"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DeliveryDetails;
