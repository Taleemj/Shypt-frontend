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
import useCargo from "../../api/cargo/useCargo";
import {
  CargoDeclaration,
  UpdateCargoDeclarationPayload,
} from "../../api/types/cargo";
import Modal from "../../components/UI/Modal";

interface AdminOrderDetailsProps {
  declarationId: string;
  onBack: () => void;
}

const DECLARATION_STATUSES = ["pending", "received", "declined"];

const AdminOrderDetails: React.FC<AdminOrderDetailsProps> = ({
  declarationId,
  onBack,
}) => {
  const { showToast } = useToast();
  const { getCargoDeclaration, updateCargoDeclaration } = useCargo();

  const [declaration, setDeclaration] = useState<CargoDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await getCargoDeclaration(declarationId);
      setDeclaration(response.data);
    } catch (err) {
      showToast("Failed to fetch declaration details.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("trwdfbgnhj", declarationId);
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
    (s) => s !== declaration.status
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
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
        </div>
      </div>

      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-sm flex flex-wrap gap-2 items-center">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Cargo Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium">Description:</span>
                <span className="text-slate-900 font-semibold">
                  {declaration.cargo_details}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium">
                  Internal Courier:
                </span>
                <span className="text-slate-900">
                  {declaration.internal_curier || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium">
                  Tracking Number:
                </span>
                <span className="font-mono text-slate-900">
                  {declaration.tracking_number || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium">
                  Warehouse Location:
                </span>
                <span className="text-slate-900">
                  {declaration.location.name}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium">
                  Declared Value:
                </span>
                <span className="font-mono text-slate-900">
                  $ {Number(declaration.value).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-medium">Weight:</span>
                <span className="text-slate-900">
                  {declaration.weight
                    ? `${Number(declaration.weight).toFixed(2)} kg`
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-col col-span-full">
                <span className="text-slate-500 font-medium">
                  Attached Files:
                </span>
                {declaration.files && declaration.files.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {declaration.files.map((file, index) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-xs"
                      >
                        {file.split("/").pop()}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">
                    No files attached.
                  </span>
                )}
              </div>
            </div>
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
              defaultValue=""
            >
              <option value="" disabled>
                Select next status
              </option>
              {availableNextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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
    </div>
  );
};

export default AdminOrderDetails;
