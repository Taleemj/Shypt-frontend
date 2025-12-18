import React, { useState, useEffect } from "react";
import { Plus, Eye, Package as PackageIcon, Trash2 } from "lucide-react";
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

  const columns: Column<Order>[] = [
    {
      header: "Tracking #",
      accessor: (o) => (
        <span className="font-mono font-medium">{o.tracking_number}</span>
      ),
    },
    {
      header: "Receiver",
      accessor: (o) => (
        <div>
          <div className="font-medium">{o.receiver_name}</div>
          <div className="text-xs text-slate-500">{o.receiver_address}</div>
        </div>
      ),
    },
    { header: "Origin", accessor: "origin_country" },
    { header: "Status", accessor: (o) => <StatusBadge status={o.status} /> },
    {
      header: "Actions",
      accessor: (o) => (
        <button
          onClick={() => triggerNav(`/client/orders/${o.id}`)}
          className="flex items-center text-primary-600 hover:underline"
        >
          <Eye size={14} className="mr-1" /> View
        </button>
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
          className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center text-sm font-medium shadow-sm"
        >
          <Plus size={16} className="mr-2" /> Create Pre-Alert
        </button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={(o) => triggerNav(`/client/orders/${o.id}`)}
        title="Your Shipments"
        searchPlaceholder="Search by tracking number or receiver..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={resetModal}
        title={`Create Pre-Alert: Step ${step} of 2`}
      >
        {step === 1 && (
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <h3 className="font-semibold text-lg">
              Step 1: Set Receiver & Origin
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Receiver Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="receiver_name"
                  required
                  className="w-full border border-slate-300 rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Receiver Phone
                </label>
                <input
                  name="receiver_phone"
                  type="tel"
                  className="w-full border border-slate-300 rounded p-2 mt-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Receiver Email <span className="text-red-500">*</span>
              </label>
              <input
                name="receiver_email"
                type="email"
                required
                className="w-full border border-slate-300 rounded p-2 mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Receiver Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="receiver_address"
                required
                rows={3}
                className="w-full border border-slate-300 rounded p-2 mt-1"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Origin Country <span className="text-red-500">*</span>
              </label>
              <select
                name="origin_country"
                required
                className="w-full border border-slate-300 rounded p-2 mt-1"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.country}>
                    {w.country} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 font-medium"
              >
                Next: Add Packages
              </button>
            </div>
          </form>
        )}

        {step === 2 && newlyCreatedOrder && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">
                Step 2: Add Packages to Order{" "}
                <span className="font-mono text-primary-600">
                  {newlyCreatedOrder.tracking_number}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form to add a package */}
              <form
                onSubmit={handleAddPackage}
                className="space-y-4 p-4 border rounded-lg"
              >
                <h4 className="font-medium text-md border-b pb-2">
                  Add a New Package
                </h4>
                <div>
                  <label>Contents*</label>
                  <input
                    name="contents"
                    required
                    className="w-full border border-slate-300 rounded p-2 mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Declared Value*</label>
                    <input
                      name="declared_value"
                      type="number"
                      required
                      className="w-full border border-slate-300 rounded p-2 mt-1"
                    />
                  </div>
                  <div>
                    <label>Weight (kg)*</label>
                    <input
                      name="weight"
                      type="number"
                      step="0.1"
                      required
                      className="w-full border border-slate-300 rounded p-2 mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label>Length (cm)</label>
                    <input
                      name="length"
                      type="number"
                      className="w-full border border-slate-300 rounded p-2 mt-1"
                    />
                  </div>
                  <div>
                    <label>Width (cm)</label>
                    <input
                      name="width"
                      type="number"
                      className="w-full border border-slate-300 rounded p-2 mt-1"
                    />
                  </div>
                  <div>
                    <label>Height (cm)</label>
                    <input
                      name="height"
                      type="number"
                      className="w-full border border-slate-300 rounded p-2 mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label>Receiving Warehouse*</label>
                  <select
                    name="location_id"
                    required
                    className="w-full border border-slate-300 rounded p-2 mt-1"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.country} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Package Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="checkbox" name="is_fragile" className="mr-2" />
                    Fragile
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_hazardous"
                      className="mr-2"
                    />
                    Hazardous
                  </label>
                </div>
                <div className="text-right">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
                  >
                    Add Package
                  </button>
                </div>
              </form>

              {/* List of added packages */}
              <div className="space-y-3">
                <h4 className="font-medium text-md border-b pb-2">
                  Packages to Be Added ({packages.length})
                </h4>
                {packages.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8">
                    No packages added yet.
                  </p>
                )}
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {packages.map((pkg, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 p-3 rounded-lg border flex justify-between items-start"
                    >
                      <div className="text-sm">
                        <p className="font-bold">{pkg.contents}</p>
                        <p className="text-xs text-slate-500">
                          {pkg.weight}kg, ${pkg.declared_value},{" "}
                          {
                            warehouses.find(
                              (w) => w.id === Number(pkg.location_id)
                            )?.zone
                          }
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPackages(packages.filter((_, idx) => idx !== i))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-slate-600 hover:underline"
              >
                Back to Edit Order
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={packages.length === 0}
                className="bg-primary-600 text-white px-6 py-2 rounded font-medium disabled:bg-slate-400"
              >
                Finish & Save {packages.length} Package(s)
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyOrders;
