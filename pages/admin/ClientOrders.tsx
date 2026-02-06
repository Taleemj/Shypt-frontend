import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Eye,
  Loader2,
  Search,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import useOrders from "../../api/orders/useOrders";
import { Order, PlaceOrderPayload } from "../../api/types/orders";
import useCargo from "../../api/cargo/useCargo";
import { CargoDeclaration } from "../../api/types/cargo";
import StatusBadge from "../../components/UI/StatusBadge";
import useAuth from "../../api/auth/useAuth";
import { AuthUser } from "@/api/types/auth";
import usePackage from "@/api/package/usePackage";
import { Package } from "@/api/types/package";

// Debounce utility function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ClientOrders: React.FC = () => {
  const { showToast } = useToast();
  const { getOrders, placeOrder } = useOrders();
  const { listCargoDeclarations } = useCargo();
  const { fetchAllUsers } = useAuth();
  const { addPackageToOrder } = usePackage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  // Create a ref to hold the latest users array
  const usersRef = useRef(users);

  // Update the ref whenever the users state changes
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  const [cargoDeclarations, setCargoDeclarations] = useState<
    CargoDeclaration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal State
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 State
  const [clientSearchId, setClientSearchId] = useState("");
  const [selectedClient, setSelectedClient] = useState<AuthUser | null>(null);

  // Step 2 State
  const [vendorTrackingId, setVendorTrackingId] = useState("");
  const [matchedDeclaration, setMatchedDeclaration] =
    useState<CargoDeclaration | null>(null);
  const [declarationSearchStatus, setDeclarationSearchStatus] = useState<
    "idle" | "found" | "not_found"
  >("idle");

  // Step 3 State
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, cargoRes, usersRes] = await Promise.allSettled([
        getOrders(),
        listCargoDeclarations(),
        fetchAllUsers(),
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
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data);
      } else {
        showToast("Failed to fetch users", "error");
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

  const resetModalState = () => {
    setCurrentStep(1);
    setClientSearchId("");
    setSelectedClient(null);
    setVendorTrackingId("");
    setMatchedDeclaration(null);
    setDeclarationSearchStatus("idle");
    setDescription("");
    setWeight("");
    setValue("");
    setLength("");
    setWidth("");
    setHeight("");
    setIsSubmitting(false);
  };

  const openModal = () => {
    resetModalState();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModalState();
  };

  const debouncedSearchClient = useCallback(
    debounce((id: string) => {
      if (id.trim() !== "") {
        let cleanIdString = id.replace(/^CL-/i, "").trim();
        const searchIdNumber = parseInt(cleanIdString, 10);

        let client: AuthUser | undefined;
        if (!isNaN(searchIdNumber)) {
          // Directly use usersRef.current here
          client = usersRef.current.find((u) => u.id === searchIdNumber);
        } else {
          client = undefined;
        }

        if (client) {
          setSelectedClient(client);
          showToast(`Client Found: ${client.full_name}`, "success");
        } else {
          setSelectedClient(null);
          showToast("Client ID not found.", "error");
        }
      } else {
        setSelectedClient(null);
      }
    }, 1000),
    [showToast], // Only showToast as dependency
  );

  useEffect(() => {
    setSelectedClient(null);
    if (clientSearchId.trim() !== "") {
      debouncedSearchClient(clientSearchId);
    }
  }, [clientSearchId, debouncedSearchClient]);

  const handleDeclarationSearch = () => {
    if (!vendorTrackingId) return;
    console.log("vendorTrackingId", vendorTrackingId);
    console.log("cargoDeclarations", cargoDeclarations);
    const found = cargoDeclarations.find(
      (decl) => detail.tracking_number === vendorTrackingId,
    );
    if (found) {
      setMatchedDeclaration(found);
      setDeclarationSearchStatus("found");
      const detail = found.find((d) => d.tracking_number === vendorTrackingId);
      setDescription(detail?.cargo_item || "");
      setValue(detail?.value?.toString() || "");
      showToast("Matching pre-alert found and data pre-filled.", "success");
    } else {
      setMatchedDeclaration(null);
      setDeclarationSearchStatus("not_found");
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedClient) {
      showToast("No client selected.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create the main order
      const payload: PlaceOrderPayload = {
        user_id: selectedClient.id,
        // @ts-ignore
        origin_country: matchedDeclaration?.location.name || "USA",
        receiver_name: selectedClient.full_name,
        receiver_phone: selectedClient.phone,
        receiver_email: selectedClient.email,
        receiver_address: selectedClient.address,
        warehouse_location_id: matchedDeclaration?.warehouse_location_id || 1, // Default warehouse
      };

      const orderResponse = await placeOrder(payload);
      const newOrder = orderResponse.data;

      // Step 2: Add package details to the order
      const packageData: Partial<Package> & { order_id: number } = {
        order_id: newOrder.id,
        contents: description,
        declared_value: value ? parseFloat(value) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        length: length ? parseFloat(length) : undefined,
        width: width ? parseFloat(width) : undefined,
        height: height ? parseFloat(height) : undefined,
        hwb_number: vendorTrackingId,
      };

      await addPackageToOrder(packageData);

      showToast("Shipment recorded successfully!", "success");
      closeModal();
      fetchData();
    } catch (error) {
      console.error(error);
      showToast("Failed to record shipment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const columns: Column<Order>[] = [
    {
      header: "shipment ID",
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

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Client Identification
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Step 1: Find Client
            </h3>
            <p className="text-sm text-slate-500">
              Enter the Client ID as indicated on the shipping label.
            </p>
            <div>
              <label
                htmlFor="client-id"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Client ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="client-id"
                  type="text"
                  value={clientSearchId}
                  onChange={(e) => setClientSearchId(e.target.value)}
                  className="w-full border border-slate-300 rounded bg-white text-slate-900 p-2"
                  placeholder="e.g. CL-123"
                />
              </div>
            </div>
            {selectedClient && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="font-bold text-green-800">
                  {selectedClient.full_name}
                </p>
                <p className="text-sm text-green-700">{selectedClient.email}</p>
                <p className="text-sm text-green-700">{selectedClient.phone}</p>
              </div>
            )}
            {!selectedClient && clientSearchId.trim() !== "" && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
                Searching for client...
              </div>
            )}
          </div>
        );
      case 2: // Tracking ID & Pre-alert
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Step 2: Scan Tracking ID
            </h3>
            <p className="text-sm text-slate-500">
              Enter the vendor-provided tracking ID to find a pre-alert.
            </p>
            <div>
              <label
                htmlFor="vendor-tracking"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Vendor Tracking ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="vendor-tracking"
                  type="text"
                  value={vendorTrackingId}
                  onChange={(e) => {
                    setVendorTrackingId(e.target.value);
                    setDeclarationSearchStatus("idle");
                    setMatchedDeclaration(null);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleDeclarationSearch()
                  }
                  className="w-full border border-slate-300 rounded bg-white text-slate-900 p-2"
                  placeholder="Scan or enter tracking ID"
                />
                <button
                  onClick={handleDeclarationSearch}
                  className="p-2 bg-slate-100 rounded hover:bg-slate-200"
                >
                  <Search size={20} className="text-slate-600" />
                </button>
              </div>
            </div>
            {declarationSearchStatus === "found" && matchedDeclaration && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm">
                <p className="font-bold text-green-800">Pre-Alert Found!</p>
                <p className="text-green-700">
                  Declaration ID: {matchedDeclaration.id}
                </p>
                <p className="text-green-700">
                  Items will be pre-filled in the next step.
                </p>
              </div>
            )}
            {declarationSearchStatus === "not_found" && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm">
                <p className="font-bold text-yellow-800">No Pre-Alert Found</p>
                <p className="text-yellow-700">
                  Please proceed to enter shipment details manually in the next
                  step.
                </p>
              </div>
            )}
          </div>
        );
      case 3: // Shipment Details
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Step 3: Capture Details
            </h3>
            <p className="text-sm text-slate-500">
              Enter the package details. Pre-filled data can be adjusted if
              needed.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <input
                required
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
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
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
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
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
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
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
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
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full border border-slate-300 rounded mt-1 bg-white text-slate-900 p-2"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderModalFooter = () => {
    return (
      <div className="flex justify-between items-center gap-3 pt-4 mt-4 border-t border-slate-100">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={currentStep === 1 && !selectedClient}
              className="px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-xl flex justify-center items-center bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              Next <ArrowRight size={16} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting || !description || !value || !weight}
              className="px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-xl flex justify-center items-center bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-3" /> Recording...
                </>
              ) : (
                "Record Shipment"
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Client Shipments
          </h2>
          <p className="text-slate-500 text-sm">Manage all client shipments.</p>
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={(order) => triggerNav(`/admin/client-orders/${order.id}`)}
        title="All Shipments"
        searchPlaceholder="Search by tracking #, client..."
        primaryAction={
          <button
            onClick={openModal}
            className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Record Shipment
          </button>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Record New Shipment"
        size="lg"
      >
        <div>
          {renderStep()}
          {renderModalFooter()}
        </div>
      </Modal>
    </div>
  );
};

export default ClientOrders;
