import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  ExternalLink,
  DollarSign,
  Check,
  X,
  Truck,
  MessageSquare,
  AlertCircle,
  Eye,
  Package,
  Clipboard,
  Upload,
  Scale,
  Loader2,
  Info,
  Package as PackageIcon,
  AlertOctagon,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { DataTable, Column } from "../../components/UI/DataTable";
import useAssistedShopping from "../../api/assistedShopping/useAssistedShopping";
import {
  AssistedShoppingItem,
  UpdateAssistedShoppingPayload,
} from "../../api/types/assistedShopping";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouseLocation } from "../../api/types/warehouse";
import useCargo from "../../api/cargo/useCargo";
import { CreateCargoDeclarationPayload } from "@/api/types/cargo";

const AssistedShopping: React.FC = () => {
  const { showToast } = useToast();
  const [selectedReq, setSelectedReq] = useState<AssistedShoppingItem | null>(
    null
  );
  const [modalMode, setModalMode] = useState<
    "QUOTE" | "PURCHASE" | "REJECT" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quote state
  const [quoteCost, setQuoteCost] = useState<number>(0);
  const [quoteShip, setQuoteShip] = useState<number>(0);

  // Data state
  const [requests, setRequests] = useState<AssistedShoppingItem[]>([]);
  const [warehouses, setWarehouses] = useState<WareHouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State for Purchase/Declaration
  const [selectedWarehouse, setSelectedWarehouse] = useState("US");
  const [declaredValue, setDeclaredValue] = useState<string>("");
  const [estWeight, setEstWeight] = useState<string>("");
  const [complianceAgreed, setComplianceAgreed] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Hooks
  const {
    listAssistedShoppingRequests,
    addAssistedShoppingQuote,
    updateAssistedShopping,
  } = useAssistedShopping();
  const { fetchWareHouseLocations } = useWareHouse();
  const { createCargoDeclaration, uploadCargoDeclarationFiles } = useCargo();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const [requestsRes, warehousesRes] = await Promise.allSettled([
        listAssistedShoppingRequests(),
        fetchWareHouseLocations(),
      ]);

      if (requestsRes.status === "fulfilled") {
        setRequests(requestsRes.value.data.data);
      } else {
        setError("Failed to fetch shopping requests.");
        showToast("Failed to fetch shopping requests.", "error");
      }

      if (warehousesRes.status === "fulfilled") {
        setWarehouses(warehousesRes.value.data);
      } else {
        showToast("Failed to fetch warehouses", "error");
      }
    } catch (err) {
      setError("Failed to fetch initial data.");
      showToast("Failed to fetch initial data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const resetPurchaseForm = () => {
    setSelectedWarehouse("US");
    setDeclaredValue("");
    setEstWeight("");
    setComplianceAgreed(false);
    setSelectedFiles(null);
  };

  useEffect(() => {
    if (modalMode === "PURCHASE" && selectedReq) {
      const total =
        selectedReq.quote_items?.reduce(
          (acc, q) => acc + q.unit_price * q.quantity,
          0
        ) || 0;
      setDeclaredValue(total.toFixed(2));
    } else {
      resetPurchaseForm();
    }
  }, [modalMode, selectedReq]);

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const handleOpenModal = (
    req: AssistedShoppingItem,
    mode: typeof modalMode,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedReq(req);
    setModalMode(mode);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setIsSubmitting(true);

    try {
      if (quoteCost > 0) {
        await addAssistedShoppingQuote({
          assisted_shopping_id: selectedReq.id,
          item_name: selectedReq.name,
          quantity: selectedReq.quantity,
          unit_price: quoteCost,
        });
      }
      if (quoteShip > 0) {
        await addAssistedShoppingQuote({
          assisted_shopping_id: selectedReq.id,
          item_name: "Domestic Shipping",
          quantity: 1,
          unit_price: quoteShip,
        });
      }
      const serviceFee = (quoteCost + quoteShip) * 0.1;
      if (serviceFee > 0) {
        await addAssistedShoppingQuote({
          assisted_shopping_id: selectedReq.id,
          item_name: "Service Fee (10%)",
          quantity: 1,
          unit_price: serviceFee,
        });
      }

      const payload: UpdateAssistedShoppingPayload = {
        name: selectedReq.name,
        url: selectedReq.url,
        quantity: selectedReq.quantity,
        notes: selectedReq.notes,
        status: "quoted",
      };
      await updateAssistedShopping(selectedReq.id, payload);

      showToast("Quotation sent to client", "success");
      setModalMode(null);
      fetchRequests();
    } catch (error) {
      showToast("Failed to send quotation.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (!complianceAgreed) {
      showToast("You must acknowledge the prohibited items policy.", "error");
      return;
    }
    if (Number(declaredValue) <= 0) {
      showToast("Please provide a valid declared value for customs.", "error");
      return;
    }

    const form = new FormData(e.currentTarget);
    const selectedWh = warehouses.find((wh) => wh.code === selectedWarehouse);
    if (!selectedWh) {
      showToast("Please select a destination warehouse.", "error");
      return;
    }

    setIsSubmitting(true);

    const trackingNumber = form.get("tracking") as string;
    const carrier = form.get("courier") as string;
    const retailerRef = form.get("retailer_ref") as string;

    const declarationPayload: CreateCargoDeclarationPayload = {
      warehouse_location_id: selectedWh.id,
      user_id: selectedReq.user.id,
      internal_curier: carrier,
      tracking_number: trackingNumber,
      cargo_details: form.get("desc") as string,
      value: Number(declaredValue),
      weight: estWeight ? Number(estWeight) : undefined,
      // retailer_ref: retailerRef, // This is not part of the declaration
      // assisted_shopping_id: selectedReq.id,
    };

    try {
      // 1. Create the cargo declaration
      const declarationResponse = await createCargoDeclaration(
        declarationPayload
      );
      showToast("Cargo Declaration created successfully!", "success");

      // 2. Upload files if any
      if (
        selectedFiles &&
        selectedFiles.length > 0 &&
        declarationResponse.data.id
      ) {
        const uploadFormData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
          uploadFormData.append("files[]", selectedFiles[i]);
        }
        try {
          await uploadCargoDeclarationFiles(
            declarationResponse.data.id,
            uploadFormData
          );
          showToast("Invoice uploaded successfully.", "success");
        } catch (uploadError) {
          showToast(
            "Declaration was created, but failed to upload the invoice.",
            "warning"
          );
        }
      }

      // 3. Update the assisted shopping request
      const updatePayload: UpdateAssistedShoppingPayload = {
        name: selectedReq.name,
        url: selectedReq.url,
        quantity: selectedReq.quantity,
        notes: selectedReq.notes,
        status: "purchased",
        retailer_ref: retailerRef,
        carrier: carrier,
        tracking_ref: trackingNumber,
      };
      await updateAssistedShopping(selectedReq.id, updatePayload);
      showToast(
        "Procurement details saved. Item marked as Purchased.",
        "success"
      );

      setModalMode(null);
      fetchRequests();
    } catch (error) {
      showToast("An error occurred during the purchase process.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<AssistedShoppingItem>[] = [
    {
      header: "Request ID",
      accessor: (req) => (
        <span className="font-mono text-primary-600 font-bold hover:underline">
          REQ-{req.id}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Client",
      accessor: (req) => req.user.full_name,
      // @ts-ignore
      sortKey: "user.full_name",
      sortable: true,
    },
    {
      header: "Item",
      accessor: (req) => (
        <div>
          <div className="text-sm font-bold text-slate-800">{req.name}</div>
          <div className="flex gap-2 mt-1">
            <a
              href={req.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-blue-600 flex items-center hover:underline"
            >
              STORE <ExternalLink size={8} className="ml-1" />
            </a>
            {req.retailer_ref && (
              <span className="text-[10px] text-slate-400 font-mono">
                Ref: {req.retailer_ref}
              </span>
            )}
          </div>
        </div>
      ),
      sortKey: "name",
      sortable: true,
    },
    {
      header: "Status",
      accessor: (req) => <StatusBadge status={req.status.toUpperCase()} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Total",
      accessor: (req) => {
        const total = req.quote_items?.reduce(
          (acc, q) => acc + q.unit_price * q.quantity,
          0
        );
        return total ? `$${total.toFixed(2)}` : "-";
      },
      className: "text-right font-bold",
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (req) => (
        <div className="flex justify-end gap-2">
          {req.status === "requested" && (
            <button
              onClick={(e) => handleOpenModal(req, "QUOTE", e)}
              className="text-primary-600 font-bold text-[10px] bg-primary-50 px-2 py-1 rounded-md border border-primary-200 uppercase tracking-tighter"
            >
              Issue Quote
            </button>
          )}
          {req.status === "paid" && (
            <button
              onClick={(e) => handleOpenModal(req, "PURCHASE", e)}
              className="text-green-700 font-bold text-[10px] bg-green-50 px-2 py-1 rounded-md border border-green-200 uppercase tracking-tighter"
            >
              Buy Now
            </button>
          )}
          <button
            onClick={() => triggerNav(`/admin/shopping/${req.id}`)}
            className="p-1.5 text-slate-400 hover:text-slate-800"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Shop For Me</h2>
          <p className="text-slate-500 text-sm">
            Assisted procurement and vendor coordination.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded">
          {error}
        </div>
      ) : (
        <DataTable
          data={requests}
          columns={columns}
          onRowClick={(req) => triggerNav(`/admin/shopping/${req.id}`)}
          title="Procurement Queue"
          searchPlaceholder="Search clients, items, or retailer refs..."
        />
      )}

      <Modal
        isOpen={modalMode === "QUOTE"}
        onClose={() => setModalMode(null)}
        title="Generate Quotation"
      >
        <form onSubmit={handleQuoteSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Item Net Cost ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                onChange={(e) => setQuoteCost(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Domestic Ship ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                onChange={(e) => setQuoteShip(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm border border-slate-100">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${(quoteCost + quoteShip).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-primary-600 font-bold">
              <span>Service Fee (10%):</span>
              <span>${((quoteCost + quoteShip) * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t pt-2">
              <span>Final Quote:</span>
              <span>${((quoteCost + quoteShip) * 1.1).toFixed(2)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 shadow-lg transition flex items-center justify-center disabled:bg-primary-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              "Send Quotation to Client"
            )}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={modalMode === "PURCHASE"}
        onClose={() => setModalMode(null)}
        title={`Create Declaration for REQ-${selectedReq?.id}`}
        size="lg"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-8">
          {/* STEP 1: ORIGIN HUB SELECTOR */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              1. Select Destination Warehouse
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {warehouses.map((wh) => (
                <button
                  key={wh.code}
                  type="button"
                  onClick={() => setSelectedWarehouse(wh.code)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all group ${
                    selectedWarehouse === wh.code
                      ? "border-primary-600 bg-primary-50 ring-4 ring-primary-50"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}
                >
                  {selectedWarehouse === wh.code && (
                    <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-0.5">
                      <Check size={12} />
                    </div>
                  )}
                  <p
                    className={`text-xs font-black uppercase tracking-tighter ${
                      selectedWarehouse === wh.code
                        ? "text-primary-700"
                        : "text-slate-400"
                    }`}
                  >
                    {wh.name}
                  </p>
                  {/* @ts-ignore */}
                  <p className="font-bold text-slate-900 mt-1">{wh.city}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono leading-tight group-hover:text-slate-700">
                    {wh.address}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: LOGISTICS DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                2. Tracking Information
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Carrier to Warehouse
                </label>
                <div className="relative">
                  <Truck
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <select
                    name="courier"
                    defaultValue={selectedReq?.carrier || "UPS"}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option>UPS (United Parcel Service)</option>
                    <option>FedEx</option>
                    <option>USPS (Postal Service)</option>
                    <option>Amazon Logistics</option>
                    <option>DHL Express</option>
                    <option>Other / Private Carrier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tracking Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <PackageIcon
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <input
                    name="tracking"
                    required
                    defaultValue={selectedReq?.tracking_ref || ""}
                    placeholder="e.g. 1Z99... or TBA..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                            </div>
                             <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                Retailer Order ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                required
                                name="retailer_ref"
                                defaultValue={selectedReq?.retailer_ref || ""}
                                placeholder="e.g. AMZN-114-2233..."
                                className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900 font-mono"
                              />
                            </div>
                          </div>
            <div className="space-y-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                3. Cargo Details
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="desc"
                  required
                  rows={4}
                  defaultValue={
                    selectedReq
                      ? `${selectedReq.name} (x${selectedReq.quantity})`
                      : ""
                  }
                  placeholder="e.g. 2x Blue Jeans, 1x Sony Headphones"
                  className="w-full p-4 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Declared Value ($)
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-3 text-slate-400"
                      size={16}
                    />
                    <input
                      type="number"
                      value={declaredValue}
                      onChange={(e) => setDeclaredValue(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Est. Weight (kg)
                  </label>
                  <div className="relative">
                    <Scale
                      className="absolute left-3 top-3 text-slate-400"
                      size={16}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={estWeight}
                      onChange={(e) => setEstWeight(e.target.value)}
                      placeholder="0.0"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COMPLIANCE & ATTACHMENT */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="absolute -right-8 -top-8 text-white/5 rotate-12">
              <AlertOctagon size={160} />
            </div>
            <div className="relative z-10">
              <h4 className="flex items-center text-xs font-black uppercase tracking-widest text-primary-400 mb-4">
                <AlertCircle size={14} className="mr-2" /> Prohibited Items &
                Compliance
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-6">
                By declaring this cargo, you certify that it contains no{" "}
                <strong>
                  Liquids, Batteries (loose), Explosives, or Narcotics
                </strong>
                . Undeclared prohibited items will result in a $100 compliance
                fine and cargo seizure.
              </p>

              <div className="flex flex-col md:flex-row gap-6">
                <label className="flex-1 border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center hover:border-primary-500 hover:bg-slate-800 transition cursor-pointer group">
                  <Upload
                    size={24}
                    className="text-slate-500 group-hover:text-primary-400 mb-2"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    Upload Vendor Invoice
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {selectedFiles && selectedFiles.length > 0
                      ? selectedFiles[0].name
                      : "PDF or JPG only"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                  />
                </label>

                <div className="flex-1 flex items-center">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className={`mt-0.5 w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                        complianceAgreed
                          ? "bg-primary-500 border-primary-500"
                          : "border-slate-600 bg-slate-800 group-hover:border-slate-400"
                      }`}
                    >
                      {complianceAgreed && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={complianceAgreed}
                      onChange={() => setComplianceAgreed(!complianceAgreed)}
                    />
                    <span className="text-[11px] text-slate-300 font-medium">
                      I confirm these details are accurate for URA Customs and
                      acknowledge the prohibited items list.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setModalMode(null);
              }}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!complianceAgreed || isSubmitting}
              className={`px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-xl flex items-center justify-center ${
                complianceAgreed
                  ? "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Submitting...
                </>
              ) : (
                "Submit Cargo Declaration"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssistedShopping;
