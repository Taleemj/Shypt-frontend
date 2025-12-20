import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Package as PackageIcon,
  Trash2,
  Search,
  Plane,
  Ship,
  AlertCircle,
  Info,
  DollarSign,
  Upload,
  FileText,
  MapPin,
  ChevronRight,
  Check,
  AlertOctagon,
  Scale,
  Truck,
} from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import Modal from "../../components/UI/Modal";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useOrders from "../../api/orders/useOrders";
import usePackage from "../../api/package/usePackage";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { Order, PlaceOrderPayload } from "../../api/types/orders";
import { Package } from "../../api/types/package";
import { WareHouse } from "../../api/types/warehouse";

const MyOrders: React.FC = () => {
  const { showToast } = useToast();
  const { getOrders, placeOrder } = useOrders();
  const { addPackageToOrder } = usePackage();
  const { fetchWareHouses } = useWareHouse();

  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<WareHouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newlyCreatedOrder, setNewlyCreatedOrder] = useState<Order | null>(
    null
  );
  const [packages, setPackages] = useState<Partial<Package>[]>([]);

  // Form State
  const [selectedWarehouse, setSelectedWarehouse] = useState("US");
  const [declaredValue, setDeclaredValue] = useState<string>("");
  const [estWeight, setEstWeight] = useState<string>("");
  const [complianceAgreed, setComplianceAgreed] = useState(false);

  const fetchClientOrders = async () => {
    setLoading(true);
    try {
      const [ordersResponse, warehousesResponse] = await Promise.all([
        getOrders(),
        fetchWareHouses(),
      ]);
      setOrders(ordersResponse.data.data);
      setWarehouses(warehousesResponse.data);
    } catch (error) {
      showToast("Failed to fetch data", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientOrders();
  }, []);

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setNewlyCreatedOrder(null);
    setPackages([]);
  };

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: PlaceOrderPayload = {
      receiver_name: formData.get("receiver_name") as string,
      receiver_phone: formData.get("receiver_phone") as string,
      receiver_email: formData.get("receiver_email") as string,
      receiver_address: formData.get("receiver_address") as string,
      origin_country: formData.get("origin_country") as string,
    };

    try {
      const response = await placeOrder(payload);
      showToast("Step 1 Complete: Order created successfully!", "success");
      setNewlyCreatedOrder(response.data);
      setStep(2);
    } catch (error) {
      showToast("Failed to create order.", "error");
    }
  };

  const handleAddPackage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = fileInput.files?.[0];

    const newPackage: Partial<Package> = {
      contents: formData.get("contents") as string,
      declared_value: formData.get("declared_value") as string,
      weight: parseFloat(formData.get("weight") as string),
      length: parseFloat(formData.get("length") as string),
      width: parseFloat(formData.get("width") as string),
      height: parseFloat(formData.get("height") as string),
      location_id: formData.get("location_id") as string,
      is_fragile: formData.get("is_fragile") === "on",
      is_hazardous: formData.get("is_hazardous") === "on",
    };

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackages([
          ...packages,
          { ...newPackage, package_photos: [reader.result as string] },
        ]);
      };
      reader.readAsDataURL(file);
    } else {
      setPackages([...packages, newPackage]);
    }

    (e.target as HTMLFormElement).reset();
    showToast("Package added to the list.", "info");
  };

  const handleFinish = async () => {
    if (!newlyCreatedOrder) return;
    try {
      setLoading(true);
      await Promise.all(
        packages.map((pkg) =>
          addPackageToOrder({ ...pkg, order_id: newlyCreatedOrder.id })
        )
      );
      showToast("All packages added to your order!", "success");
      resetModal();
      await fetchClientOrders();
    } catch (error) {
      showToast("An error occurred while adding packages.", "error");
    } finally {
      setLoading(false);
    }
  };

  // const warehouses = [
  //   {
  //     code: "US",
  //     name: "USA",
  //     city: "New York",
  //     addr: "144-25 183rd St, NY 11413",
  //   },
  //   {
  //     code: "UK",
  //     name: "UK",
  //     city: "London",
  //     addr: "Unit 5, Polar Park, UB7 0EX",
  //   },
  //   {
  //     code: "CN",
  //     name: "China",
  //     city: "Guangzhou",
  //     addr: "Room 102, Baiyun District",
  //   },
  //   {
  //     code: "AE",
  //     name: "UAE",
  //     city: "Dubai",
  //     addr: "Whse A2, Al Qusais Ind.",
  //   },
  // ];

  const handleCreatePreAlert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Strict Validations
    if (!complianceAgreed) {
      showToast("You must acknowledge the prohibited items policy.", "error");
      return;
    }
    if (Number(declaredValue) <= 0) {
      showToast("Please provide a valid declared value for customs.", "error");
      return;
    }

    const fd = new FormData(e.currentTarget);
    // const newOrder = {
    //   id: `ORD-${Math.floor(Math.random() * 10000)}`,
    //   desc: fd.get("desc") as string,
    //   origin: selectedWarehouse,
    //   weight: estWeight ? `${estWeight}kg (Est)` : "Pending",
    //   status: "PENDING",
    //   date: new Date().toISOString().split("T")[0],
    //   trackingNo: fd.get("tracking") as string,
    //   value: Number(declaredValue),
    // };

    // setOrders([newOrder, ...orders]);
    showToast(
      "Cargo Declared! We will notify you once it reaches " + selectedWarehouse,
      "success"
    );
    setIsModalOpen(false);
    // resetForm();
  };

  const columns: Column<Order>[] = [
    {
      header: "Order ID",
      accessor: (o) => (
        <span className="font-mono font-bold text-primary-600 hover:underline">
          {o.id}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Cargo / Tracking",
      accessor: (o) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-800 truncate">
            {o?.packages[0]?.contents}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
              TRK: {o.tracking_number || "NOT PROVIDED"}
            </span>
          </div>
        </div>
      ),
      // @ts-ignore
      sortKey: "desc",
      sortable: true,
    },
    {
      header: "Origin",
      // @ts-ignore
      accessor: "origin",
      sortable: true,
      className: "font-bold text-slate-500",
    },
    {
      header: "Status",
      accessor: (o) => <StatusBadge status={o.status} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Value",
      accessor: (o) => (
        <span className="font-mono font-bold">
          Ugx {o?.packages[0]?.declared_value}
        </span>
      ),
      className: "font-mono text-xs font-bold",
    },
    {
      header: "",
      className: "text-right",
      accessor: (o) => (
        <ChevronRight size={16} className="text-slate-300 ml-auto" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Orders</h2>
          <p className="text-slate-500 text-sm">
            Track your shipments and declare incoming packages.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 flex items-center text-sm font-bold shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2" /> Declare Package
        </button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        // @ts-ignore
        loading={loading}
        onRowClick={(o) => triggerNav(`/client/orders/${o.id}`)}
        title="My Tracking History"
        searchPlaceholder="Search by tracking number or receiver..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Incoming Cargo Declaration"
        size="lg"
      >
        <form onSubmit={handleCreatePreAlert} className="space-y-8">
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
                    {/* @ts-ignore */}
                    {wh.addr}
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
                  Internal Courier (Delivery to Whse)
                </label>
                <div className="relative">
                  <Truck
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <select
                    name="courier"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="desc"
                  required
                  rows={4}
                  placeholder="Please itemize everything inside (e.g. 2x Blue Jeans, 1x Sony Headphones, 3x Vitamin C supplements)"
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
                    PDF or JPG only
                  </span>
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
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className={`px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-xl ${
                complianceAgreed
                  ? "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Submit Cargo Declaration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyOrders;
