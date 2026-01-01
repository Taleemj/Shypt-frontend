import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package as PackageIcon,
  Plane,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useCargo from "../../api/cargo/useCargo";
import { CargoDeclaration } from "../../api/types/cargo";

interface OrderDetailsProps {
  id: string;
  onBack: () => void;
}

const STATUS_FLOW = [
  { status: "PENDING", label: "Pre-Alert Created", icon: FileText },
  {
    status: "RECEIVED",
    label: "Received at Origin Warehouse",
    icon: PackageIcon,
  },
  {
    status: "CONSOLIDATED",
    label: "Consolidated for Shipment",
    icon: PackageIcon,
  },
  { status: "DISPATCHED", label: "Departed from Origin", icon: Plane },
  { status: "IN_TRANSIT", label: "In Transit to Destination", icon: Plane },
  { status: "ARRIVED", label: "Arrived at Destination", icon: MapPin },
  {
    status: "READY_FOR_RELEASE",
    label: "Customs Cleared & Ready",
    icon: CheckCircle,
  },
  { status: "RELEASED", label: "Released from Warehouse", icon: CheckCircle },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle },
  // Special terminal status
  { status: "DECLINED", label: "Declined", icon: XCircle, terminal: true },
];

const ClientOrderDetails: React.FC<OrderDetailsProps> = ({ id, onBack }) => {
  const { showToast } = useToast();
  const { getCargoDeclaration } = useCargo();

  const [declaration, setDeclaration] = useState<CargoDeclaration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const response = await getCargoDeclaration(id);
        setDeclaration(response.data);
      } catch (err) {
        showToast("Failed to fetch declaration details.", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center p-8">Loading declaration details...</div>
    );
  }

  if (!declaration) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-red-600">
          Declaration Not Found
        </h3>
        <p className="text-slate-500">
          The declaration might have been deleted or an error occurred.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentStatus = declaration.status.toUpperCase();
  const currentStatusIndex = STATUS_FLOW.findIndex(
    (s) => s.status === currentStatus
  );

  const statusFlowToDisplay = STATUS_FLOW.filter((s) => {
    if (currentStatus === "DECLINED") {
      // If declined, only show the first step and the declined step
      return s.status === "PENDING" || s.status === "DECLINED";
    }
    // Otherwise, show all non-terminal statuses
    return !s.terminal;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Declaration #{declaration.id}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={declaration.status} />
            <span className="text-sm text-slate-500">
              Tracking: {declaration.tracking_number || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                <span className="text-slate-500 font-medium">Destination:</span>
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
                        href={`/api/files/${file}`}
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

        <div className="bg-white rounded-lg shadow-sm border p-6 h-fit">
          <h3 className="font-bold text-slate-800 mb-6">
            Declaration Timeline
          </h3>
          <div className="space-y-6">
            {statusFlowToDisplay.map((event, i) => {
              const eventStatusIndex = STATUS_FLOW.findIndex(
                (s) => s.status === event.status
              );
              const isDone = currentStatusIndex >= eventStatusIndex;
              const isCurrent = currentStatusIndex === eventStatusIndex;

              let iconColor = "bg-slate-200 text-slate-500";
              let textColor = "text-slate-500";

              if (isCurrent) {
                textColor = "text-slate-800";
                if (currentStatus === "DECLINED") {
                  iconColor = "bg-red-100 text-red-600";
                } else {
                  iconColor = "bg-primary-100 text-primary-600";
                }
              } else if (isDone) {
                textColor = "text-slate-800";
                iconColor = "bg-green-100 text-green-600";
              }

              return (
                <div key={i} className="flex items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all ${iconColor}`}
                  >
                    <event.icon size={20} />
                  </div>
                  <div className="pt-1">
                    <p className={`font-bold transition-all ${textColor}`}>
                      {event.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {`Updated on ${new Date(
                          declaration.updated_at
                        ).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderDetails;
