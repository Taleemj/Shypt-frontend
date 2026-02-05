import React, { useState, useEffect } from "react";
import {
  Plus,
  Package as PackageIcon,
  Info,
  DollarSign,
  Upload,
  ChevronRight,
  Check,
  AlertOctagon,
  Scale,
  Truck,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import Modal from "../../components/UI/Modal";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useWareHouse from "../../api/warehouse/useWareHouse";
import useCargo from "../../api/cargo/useCargo";
import { WareHouseLocation } from "../../api/types/warehouse";
import {
  CargoDeclaration,
  CreateCargoDeclarationPayload,
} from "../../api/types/cargo";
import ShoppingRequests from "./ShoppingRequests";

const MyOrders: React.FC = () => {
  const { showToast } = useToast();
  const { fetchWareHouseLocations } = useWareHouse();
  const {
    listCargoDeclarations,
    createCargoDeclaration,
    uploadCargoDeclarationFiles,
  } = useCargo();

  const [cargoDeclarations, setCargoDeclarations] = useState<
    CargoDeclaration[]
  >([]);
  const [warehouses, setWarehouses] = useState<WareHouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"MY_ORDERS" | "SHOP_FOR_ME">(
    "MY_ORDERS",
  );

  // Form State
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [cargoItems, setCargoItems] = useState<
    { cargo_item: string; value: number; weight: number }[]
  >([{ cargo_item: "", value: 0, weight: 0 }]);
  const [complianceAgreed, setComplianceAgreed] = useState(false);
  const [isInsured, setIsInsured] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [shippingOption, setShippingOption] = useState<"standard" | "express">(
    "standard",
  );

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const fetchData = async () => {
    setLoading(true);
    const [declarationsResult, warehousesResult] = await Promise.allSettled([
      listCargoDeclarations(),
      fetchWareHouseLocations(),
    ]);

    if (declarationsResult.status === "fulfilled") {
      setCargoDeclarations(declarationsResult.value.data);
    } else {
      showToast("Failed to fetch declarations", "error");
      console.error(declarationsResult.reason);
    }

    if (warehousesResult.status === "fulfilled") {
      setWarehouses(warehousesResult.value.data);
    } else {
      showToast("Failed to fetch warehouse locations", "error");
      console.error(warehousesResult.reason);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setSelectedWarehouse("");
    setCargoItems([{ cargo_item: "", value: 0, weight: 0 }]); // Reset to one empty item
    setComplianceAgreed(false);
    setSelectedFiles(null);
    setShippingOption("standard");
  };

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
    // Ensure value is correctly typed before assignment
    if (field === "value" || field === "weight") {
      newCargoItems[index][field] = Number(value);
    } else {
      newCargoItems[index][field] = value as string;
    }
    setCargoItems(newCargoItems);
  };

  const totalDeclaredValue = cargoItems.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const totalEstWeight = cargoItems.reduce((sum, item) => sum + item.weight, 0);

  const handleCreateDeclaration = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!complianceAgreed) {
      showToast("You must acknowledge the prohibited items policy.", "error");
      return;
    }
    if (totalDeclaredValue <= 0) {
      showToast("Please provide a valid declared value for customs.", "error");
      return;
    }
    if (totalEstWeight <= 0) {
      showToast(
        "Please provide a valid estimated weight for customs.",
        "error",
      );
      return;
    }

    const form = new FormData(e.currentTarget);
    const selectedWh = warehouses.find((wh) => wh.code === selectedWarehouse);
    if (!selectedWh) {
      showToast("Please select a destination warehouse.", "error");
      return;
    }

    const isAirFreight = selectedWh.name.toLowerCase().includes("air");

    const payload: CreateCargoDeclarationPayload & {
      shipping_mode?: string;
    } = {
      warehouse_location_id: selectedWh.id,
      internal_curier: form.get("courier") as string,
      tracking_number: form.get("tracking") as string,
      cargo_details: cargoItems,
      value: totalDeclaredValue,
      weight: totalEstWeight,
      insured: isInsured,
    };

    if (isAirFreight) {
      payload.shipping_mode = shippingOption;
    }

    // New validation for insurance
    if (isInsured && (!selectedFiles || selectedFiles.length === 0)) {
      showToast(
        "Commercial invoice is required for insured packages.",
        "error",
      );
      setIsSubmitting(false); // Make sure to stop submission
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCargoDeclaration(payload);
      showToast("Cargo Declared Successfully!", "success");

      if (selectedFiles && selectedFiles.length > 0 && response.data.id) {
        const uploadFormData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
          uploadFormData.append("files[]", selectedFiles[i]);
        }
        try {
          await uploadCargoDeclarationFiles(response.data.id, uploadFormData);
          showToast("Invoice uploaded successfully.", "success");
        } catch (uploadError) {
          showToast(
            "Declaration was created, but failed to upload the invoice.",
            "warning",
          );
        }
      }

      setIsModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      showToast("Failed to create cargo declaration.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<CargoDeclaration>[] = [
    {
      header: "Order ID",
      accessor: (cd) => (
        <span className="font-mono font-bold text-primary-600 hover:underline">
          {cd.id}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Cargo / Tracking",
      accessor: (cd) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-800 truncate">
            {(() => {
                  if (!cd.cargo_details || cd.cargo_details.length === 0) {
                    return "No cargo details";
                  }
                  const items = cd.cargo_details.map((detail) => detail.cargo_item);
                  if (items.length === 1) {
                    return items[0];
                  }
                  if (items.length === 2) {
                    return `${items[0]}, ${items[1]}`;
                  }
                  return `${items[0]}, ${items[1]} +${items.length - 2} more`;
                })()}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
              TRK: {cd.tracking_number || "NOT PROVIDED"}
            </span>
          </div>
        </div>
      ),
      sortKey: "cargo_details",
      sortable: true,
    },
    {
      header: "Destination",
      accessor: (cd) => (
        <span className="font-bold text-slate-500">
          {cd.location?.name || "N/A"}
        </span>
      ),
      // @ts-ignore
      sortKey: "location.name",
      sortable: true,
    },
    {
      header: "Status",
      accessor: (cd) => <StatusBadge status={cd.status.toUpperCase()} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Value",
      accessor: (cd) => (
        <span className="font-mono font-bold">
          ${" "}
          {(cd.cargo_details || []).reduce(
            (sum, item) => sum + item.value,
            0,
          ).toFixed(2)}
        </span>
      ),
      className: "font-mono text-xs font-bold",
      sortKey: "value",
    },
    {
      header: "",
      className: "text-right",
      accessor: () => (
        <ChevronRight size={16} className="text-slate-300 ml-auto" />
      ),
    },
  ];

  const selectedWh = warehouses.find((wh) => wh.code === selectedWarehouse);
  const isAirFreight = selectedWh?.name.toLowerCase().includes("air");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Orders</h2>
          <p className="text-slate-500 text-sm">
            Track your shipments and declare incoming packages.
          </p>
        </div>
        {activeTab === "MY_ORDERS" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 flex items-center text-sm font-bold shadow-xl transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" /> Declare Package
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab("MY_ORDERS")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "MY_ORDERS"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            My Package Declarations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SHOP_FOR_ME")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "SHOP_FOR_ME"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            'Shop For Me' Requests
          </button>
        </nav>
      </div>

      {/* CONTENT */}
      <div className="pt-4">
        {activeTab === "MY_ORDERS" && (
          <DataTable
            data={cargoDeclarations}
            columns={columns}
            loading={loading}
            onRowClick={(declaration) =>
              triggerNav(`/client/orders/${declaration.id}`)
            }
            title="My Declarations History"
            searchPlaceholder="Search by tracking number or description..."
          />
        )}
        {activeTab === "SHOP_FOR_ME" && <ShoppingRequests />}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Incoming Cargo Declaration"
        size="lg"
      >
        <form onSubmit={handleCreateDeclaration} className="space-y-8">
          {/* STEP 1: ORIGIN HUB SELECTOR */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              1. Select Destination Warehouse
            </label>
            <select
              name="warehouse_location_id"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              required
              className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="" disabled>
                -- Select a Warehouse --
              </option>
              {warehouses.map((wh) => (
                <option key={wh.code} value={wh.code}>
                  {wh.name} - {wh.code}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: LOGISTICS DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                2. Tracking Information
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Internal Courier (Delivery to Whse)
                </label>
                <div className="relative">
                  <Truck
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <select
                    name="courier"
                    defaultValue=""
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="" disabled>
                      -- Select a Courier --
                    </option>
                    <option>UPS (United Parcel Service)</option>
                    <option>FedEx</option>
                    <option>USPS (Postal Service)</option>
                    <option>Amazon Logistics</option>
                    <option>DHL Express</option>
                    <option>Other / Private Carrier</option>
                  </select>
                </div>
              </div>

              {isAirFreight && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Shipping Option
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="shipping_mode"
                        value="standard"
                        checked={shippingOption === "standard"}
                        onChange={() => setShippingOption("standard")}
                        className="form-radio text-primary-600 h-4 w-4"
                      />
                      <span className="ml-2 text-sm text-slate-700">
                        Standard Shipping
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="shipping_mode"
                        value="express"
                        checked={shippingOption === "express"}
                        onChange={() => setShippingOption("express")}
                        className="form-radio text-primary-600 h-4 w-4"
                      />
                      <span className="ml-2 text-sm text-slate-700 flex items-center">
                        <Zap size={14} className="mr-1 text-primary-500" />
                        Express Shipping
                      </span>
                    </label>
                  </div>
                </div>
              )}

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
                    placeholder="e.g. 1Z99... or TBA..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic flex items-center">
                  <Info size={10} className="mr-1" /> This helps us identify
                  your box immediately on arrival.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                3. Cargo Details
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
                        {/* <X size={16} /> */}X
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
                        className="w-full border border-slate-300 rounded p-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
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
                            handleCargoItemChange(
                              index,
                              "value",
                              e.target.value,
                            )
                          }
                          required
                          placeholder="0.00"
                          className="w-full border border-slate-300 rounded p-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
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
                            handleCargoItemChange(
                              index,
                              "weight",
                              e.target.value,
                            )
                          }
                          required
                          placeholder="0.0"
                          className="w-full border border-slate-300 rounded p-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
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
                Please ensure your declaration is accurate. Prohibited items
                (e.g., explosives, narcotics) are strictly forbidden. Restricted
                items (e.g., liquids, batteries, chemicals) may be allowed if
                properly declared and accompanied by necessary documentation.
                For a complete list and details, please refer to our{" "}
                <a
                  href="/client/document-center"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary-300 hover:underline"
                >
                  Prohibited & Restricted Items Policy
                </a>
                . Undeclared electronics, restricted and prohibited items will
                result in a $100 compliance fine and cargo seizure.
              </p>

              <div className="flex flex-col md:flex-row gap-6">
                <label className="flex-1 border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center hover:border-primary-500 hover:bg-slate-800 transition cursor-pointer group">
                  <Upload
                    size={24}
                    className="text-slate-500 group-hover:text-primary-400 mb-2"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    Upload Commercial Invoice{" "}
                    {isInsured && <span className="text-red-500">*</span>}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {selectedFiles && selectedFiles.length > 0
                      ? selectedFiles[0].name
                      : "PDF or JPG only"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    required={isInsured} // Conditionally required
                    onChange={(e) => setSelectedFiles(e.target.files)}
                  />
                </label>

                <div className="flex flex-col w-[40%]">
                  <div className="flex-1 flex items-center mb-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div
                        className={`mt-0.5 w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                          isInsured
                            ? "bg-primary-500 border-primary-500"
                            : "border-slate-600 bg-slate-800 group-hover:border-slate-400"
                        }`}
                      >
                        {isInsured && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isInsured}
                        onChange={() => setIsInsured(!isInsured)}
                      />
                      <span className="text-[11px] text-slate-300 font-medium">
                        Would you like to insure this package?
                        {isInsured && (
                          <span className="text-[9px] text-slate-400 mt-1">
                            *Insurance applies only after warehouse
                            verification.
                          </span>
                        )}
                      </span>
                    </label>
                  </div>

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
                        I confirm these details are accurate for customs
                        declaration, export/import compliance, insurance, and
                        acknowledge the prohibited items list.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
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

export default MyOrders;
