import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package as PackageIcon,
  Plane,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  Truck,
  Clock,
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

  // Visualization Steps
  const visualSteps = [
    { label: "Created", icon: FileText, matchStatus: "PENDING" },
    { label: "Received", icon: PackageIcon, matchStatus: "RECEIVED" },
    { label: "In Transit", icon: Plane, matchStatus: "IN_TRANSIT" },
    { label: "Arrived", icon: MapPin, matchStatus: "ARRIVED" },
    { label: "Ready", icon: CheckCircle, matchStatus: "READY_FOR_RELEASE" },
  ];

  const getProgressPercentage = () => {
    if (!declaration) return 0;
    const status = declaration.status.toUpperCase();

    if (status === "DELIVERED" || status === "RELEASED") return 100;

    const simplifiedStatusMap: { [key: string]: string } = {
      CONSOLIDATED: "RECEIVED",
      DISPATCHED: "IN_TRANSIT",
    };
    const simplifiedStatus = simplifiedStatusMap[status] || status;

    const idx = visualSteps.findIndex(
      (s) => s.matchStatus === simplifiedStatus
    );

    if (idx !== -1) {
      return idx * 25;
    }

    return 0;
  };

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
  const currentStatusInfo =
    STATUS_FLOW.find((s) => s.status === currentStatus) || STATUS_FLOW[0];
  const currentStatusIndex = STATUS_FLOW.findIndex(
    (s) => s.status === currentStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Declaration #{declaration.id}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={declaration.status.toUpperCase()} />
            <span className="text-sm text-slate-500">
              {declaration.cargo_details}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Current Status
                </p>
                <h3 className="text-2xl font-bold text-slate-800">
                  {currentStatusInfo.label}
                </h3>
                <p className="text-slate-600 mt-1 flex items-center">
                  <Truck size={16} className="mr-2 text-blue-500" />
                  {currentStatus === "DECLINED"
                    ? "Please contact support"
                    : `Updated: ${new Date(
                        declaration.updated_at
                      ).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-bold mb-1">
                  Estimated Arrival
                </p>
                <p className="text-xl font-bold text-green-600">TBD</p>
              </div>
            </div>

            <div className="relative px-4 pb-4">
              <div className="absolute top-5 left-0 w-full px-9">
                <div className="h-1 bg-slate-100 w-full rounded-full relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
              <div className="relative z-10 flex justify-between">
                {visualSteps.map((step, index) => {
                  const isCompleted = index * 25 <= getProgressPercentage();
                  const isCurrent =
                    visualSteps.findIndex(
                      (s) => s.matchStatus === declaration.status.toUpperCase()
                    ) === index;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center group cursor-default"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted || isCurrent
                            ? "bg-blue-600 border-blue-600 text-white shadow-md scale-110"
                            : "bg-white border-slate-300 text-slate-300"
                        }`}
                      >
                        <step.icon size={16} />
                      </div>
                      <span
                        className={`text-xs font-bold mt-3 transition-colors ${
                          isCompleted || isCurrent
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Shipment Details</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="block text-slate-500 text-xs uppercase font-bold mb-1">
                  Tracking Number
                </span>
                <span className="font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                  {declaration.tracking_number || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs uppercase font-bold mb-1">
                  Weight
                </span>
                <span className="font-medium text-slate-900">
                  {declaration.weight ? `${declaration.weight}kg` : "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs uppercase font-bold mb-1">
                  Origin
                </span>
                <span className="font-medium text-slate-900">
                  {declaration.location.name}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs uppercase font-bold mb-1">
                  Destination
                </span>
                <span className="font-medium text-slate-900">Kampala (UG)</span>
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
                        <p className="text-sm font-medium text-slate-700">
                          {file.split("/").pop()}
                        </p>
                        <p className="text-xs text-slate-500">Attached File</p>
                      </div>
                    </div>
                    <a
                      href={file}
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

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-fit">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center">
            <Clock size={18} className="mr-2 text-slate-500" /> Tracking
            Timeline
          </h3>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
            {STATUS_FLOW.filter(
              (e) => !e.terminal || e.status === currentStatus
            ).map((event, i) => {
              const eventStatusIndex = STATUS_FLOW.findIndex(
                (s) => s.status === event.status
              );
              const isDone = currentStatusIndex >= eventStatusIndex;
              const isCurrent = currentStatusIndex === eventStatusIndex;

              if (
                currentStatus === "DECLINED" &&
                event.status !== "PENDING" &&
                event.status !== "DECLINED"
              )
                return null;

              return (
                <div key={i} className="relative pl-8 group">
                  <div
                    className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-colors ${
                      isDone
                        ? "bg-green-500 border-green-500"
                        : isCurrent
                        ? "bg-blue-500 border-blue-500 ring-4 ring-blue-100"
                        : "bg-white border-slate-300"
                    }`}
                  ></div>
                  <div
                    className={`${
                      isDone || isCurrent ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <p
                      className={`text-sm font-bold ${
                        isCurrent ? "text-blue-700" : "text-slate-800"
                      }`}
                    >
                      {event.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {declaration.location.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {isDone
                        ? new Date(declaration.updated_at).toLocaleDateString()
                        : event.status === "PENDING"
                        ? new Date(declaration.created_at).toLocaleDateString()
                        : "-"}
                    </p>
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
