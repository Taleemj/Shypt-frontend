import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Plane,
  Calculator,
  Camera,
  CheckCircle,
  X,
  ScanLine,
  Smartphone,
  Printer,
  FileText,
  Navigation,
  Layers,
  Box,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { sendStatusNotification } from "../../utils/notificationService";
import { OrderStatus, TaxStatus } from "../../types";
import useOrders from "../../api/orders/useOrders";
import { Order, UpdateOrderStatusPayload } from "../../api/types/orders";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouseLocation } from "../../api/types/warehouse";
import useConsolidation from "../../api/consolidation/useConsolidation";
import { HWB, MAWB } from "../../components/warehouse/types";
import ReceiptFlow from "../../components/warehouse/ReceiptFlow";
import ConsolidateFlow from "../../components/warehouse/ConsolidateFlow";
import DeconsolidateFlow from "../../components/warehouse/DeconsolidateFlow";
import useAuth from "@/api/auth/useAuth";
import { AuthUser } from "@/api/types/auth";
import usePackage from "@/api/package/usePackage";
import { Consolidation } from "@/api/types/consolidation";

const WarehouseOperations: React.FC = () => {
  const { showToast } = useToast();
  const { getOrders, updateOrderStatus } = useOrders();
  const { fetchWareHouseLocations } = useWareHouse();
  const { getConsolidationBatches, createConsolidationBatch } =
    useConsolidation();
  const { fetchAllUsers } = useAuth();
  const { addPackageToOrder } = usePackage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<WareHouseLocation[]>([]);
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "RECEIPT" | "CONSOLIDATE" | "DECONSOLIDATE"
  >("RECEIPT");
  const [currentLocation, setCurrentLocation] = useState<string>("");

  // Modal State
  const [isConsolidateOpen, setIsConsolidateOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [warehousesRes, ordersRes, usersRes, consolidationsRes] =
          await Promise.allSettled([
            fetchWareHouseLocations(),
            getOrders(),
            fetchAllUsers(),
            getConsolidationBatches(),
          ]);

        if (
          warehousesRes.status === "fulfilled" &&
          warehousesRes.value.data &&
          warehousesRes.value.data.length > 0
        ) {
          setCurrentLocation(warehousesRes.value.data[0].code);
          setWarehouses(warehousesRes.value.data);
        } else {
          showToast("Failed to load warehouses", "error");
        }

        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value.data?.data || []);
        } else {
          showToast("Failed to load orders", "error");
        }

        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value.data || []);
        } else {
          showToast("Failed to load users", "error");
        }

        if (consolidationsRes.status === "fulfilled") {
          // @ts-ignore
          setConsolidations(consolidationsRes.value.data || []);
        } else {
          showToast("Failed to load consolidations", "error");
        }
      } catch (error) {
        showToast("Failed to load initial data", "error");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [showToast]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [ordersRes, consolidationsRes] = await Promise.allSettled([
          getOrders(),
          getConsolidationBatches(),
        ]);
        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value.data?.data || []);
        } else {
          showToast("Could not fetch orders.", "error");
          console.error(ordersRes.reason);
        }
        if (consolidationsRes.status === "fulfilled") {
          // @ts-ignore
          setConsolidations(consolidationsRes.value || []);
        } else {
          showToast("Could not fetch consolidations.", "error");
          console.error(consolidationsRes.reason);
        }
      } catch (err) {
        showToast("An error occurred while fetching data.", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "CONSOLIDATE" || activeTab === "RECEIPT") {
      fetchAllData();
    }
  }, [activeTab]);

  // Navigation Helper
  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  // --- STATE WITH SAMPLE DATA ---

  // 1. Inventory (Pending Consolidation)
  const [inventory, setInventory] = useState<HWB[]>([]);
  const [mawbs, setMawbs] = useState<MAWB[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<number[]>([]);

  // Receipt Form State
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [receiptWeight, setReceiptWeight] = useState("");
  const [receiptDesc, setReceiptDesc] = useState("");
  const [receiptValue, setReceiptValue] = useState("");
  const [receiptLength, setReceiptLength] = useState("");
  const [receiptWidth, setReceiptWidth] = useState("");
  const [receiptHeight, setReceiptHeight] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Deconsolidation State
  const [activeDeconMawb, setActiveDeconMawb] = useState<MAWB | null>(null);
  const [calculatedTax, setCalculatedTax] = useState<{
    duty: number;
    vat: number;
    wht: number;
    infra: number;
    total: number;
  } | null>(null);

  // --- HANDLERS ---

  const getLocName = (code: string) => {
    const warehouse = warehouses.find((w) => w.code === code);
    if (warehouse) {
      return `${warehouse.name} (${warehouse.code})`;
    }
    return code;
  };

  // 0. Order Selection Handler
  const handleOrderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    fillFormFromOrder(orderId);
  };

  const fillFormFromOrder = (orderId: string) => {
    if (orderId) {
      const order = orders.find((o) => o.id === parseInt(orderId));
      if (order) {
        // Pre-fill with receiver info, but package details are still manual
        setSelectedUserId(order.user.id.toString());
        // You might not want to pre-fill description, weight, value for a new package
        // setReceiptDesc(order.packages[0]?.contents || "");
        // setReceiptWeight(order.packages[0]?.weight.toString() || "");
        // setReceiptValue(order.packages[0]?.declared_value.toString() || "");
      }
    } else {
      setReceiptDesc("");
      setReceiptWeight("");
      setReceiptValue("");
      setReceiptLength("");
      setReceiptWidth("");
      setReceiptHeight("");
      setSelectedUserId("");
    }
  };

  // 0.5 Barcode Scanning Logic
  const handleScanCode = (code: string) => {
    setIsScannerOpen(false);
    // Assuming barcode maps to order tracking number
    const order = orders.find((o) => o.tracking_number === code);

    if (order) {
      if (order.warehouse?.code !== currentLocation) {
        showToast(
          `Warning: Order ${order.id} expected in ${
            order.warehouse?.code || "N/A"
          }, not ${currentLocation}`,
          "warning"
        );
      }
      setSelectedOrderId(order.id.toString());
      fillFormFromOrder(order.id.toString());
      showToast(`Order ${order.id} scanned successfully`, "success");
    } else {
      setSelectedOrderId("");
      setReceiptDesc(`Scanned Item: ${code}`);
      setSelectedUserId("");
      setReceiptWeight("");
      setReceiptValue("");
      setReceiptLength("");
      setReceiptWidth("");
      setReceiptHeight("");
      showToast(`Unknown barcode ${code}. Please fill details.`, "info");
    }
  };

  // 1. Receipt Handler
  const handleReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      showToast("Please select an order to add a package to.", "error");
      return;
    }

    setLoading(true);
    const packageHwbNumber = `HWB-${Math.floor(Math.random() * 1000000)}`;

    try {
      const selectedUser = users.find((u) => u.id === parseInt(selectedUserId));

      const packageData = {
        order_id: parseInt(selectedOrderId),
        hwb_number: packageHwbNumber,
        contents: receiptDesc || "General Cargo",
        declared_value: receiptValue,
        weight: parseFloat(receiptWeight),
        length: parseFloat(receiptLength),
        width: parseFloat(receiptWidth),
        height: parseFloat(receiptHeight),
        location_id: currentLocation,
        is_fragile: false,
        is_hazardous: false,
        is_damaged: false,
      };

      const addPackageResponse = await addPackageToOrder(packageData);
      const newPackage = addPackageResponse.data;

      setInventory((prev) => [
        {
          id: newPackage.hwb_number,
          weight: newPackage.weight,
          desc: newPackage.contents,
          client: selectedUser?.full_name || "Walk-in / Unknown",
          value: parseFloat(newPackage.declared_value),
          status: OrderStatus.RECEIVED,
          origin: newPackage.location_id,
          orderRef: newPackage.order_id.toString(),
        },
        ...prev,
      ]);

      // Update the order in the local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === parseInt(selectedOrderId)
            ? { ...o, packages: [...o.packages, newPackage] }
            : o
        )
      );

      showToast(
        `Package ${newPackage.hwb_number} Received & Logged for Order ${selectedOrderId}`,
        "success"
      );

      // Now, update the order status to "RECEIVED"
      try {
        const orderIdNum = parseInt(selectedOrderId);
        const orderToUpdate = orders.find((o) => o.id === orderIdNum);

        if (orderToUpdate) {
          const payload: UpdateOrderStatusPayload = {
            order_id: orderIdNum,
            status: OrderStatus.RECEIVED,
            notes: `Package received at warehouse: ${currentLocation}`,
            user_id: orderToUpdate.user_id,
            location: currentLocation,
          };
          await updateOrderStatus(payload);

          // Update local state for order status
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderIdNum ? { ...o, status: OrderStatus.RECEIVED } : o
            )
          );
          showToast(
            `Order status for #${orderIdNum} updated to "Received".`,
            "success"
          );
        }
      } catch (statusUpdateError) {
        console.error("Failed to update order status:", statusUpdateError);
        showToast(
          "Package added, but failed to update order status.",
          "warning"
        );
      }

      // Clear form
      setReceiptWeight("");
      setReceiptDesc("");
      setReceiptValue("");
      setReceiptLength("");
      setReceiptWidth("");
      setReceiptHeight("");
      setSelectedUserId("");
      setSelectedOrderId("");
    } catch (error: any) {
      console.error("Failed to receive package:", error);
      showToast(
        `Failed to receive package: ${error.message || "Unknown error"}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePackageSelection = (id: number) => {
    setSelectedPackages((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenConsolidate = () => {
    if (selectedPackages.length === 0) {
      showToast("Please select at least one package", "warning");
      return;
    }
    setIsConsolidateOpen(true);
  };

  const handleBulkConsolidateAction = (action: string) => {
    if (action === "REMOVE") {
      setSelectedPackages([]);
      showToast("Selection cleared.", "info");
    }
  };

  const handleConsolidateSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const flight = formData.get("flight") as string;
    const dest = formData.get("destination") as string;
    const transportMode = formData.get("transport_mode") as string;
    const departureDate = formData.get("departure_date") as string;

    const selectedWarehouse = warehouses.find(
      (w) => w.code === currentLocation
    );
    if (!selectedWarehouse) {
      showToast("No warehouse selected or found.", "error");
      return;
    }

    setLoading(true);

    try {
      const selectedItems = packagesForConsolidation?.filter((i) =>
        selectedPackages.includes(i.packageId)
      );
      const totalWeight = selectedItems.reduce(
        (sum, item) => sum + Number(item.weight),
        0
      );
      const packageIds = selectedItems.map((p) => p.packageId);

      const consolidationData = {
        transport_mode: transportMode,
        container_flight_number: flight,
        departure_date: departureDate,
        total_weight: totalWeight.toFixed(2),
        package_ids: packageIds,
        status: "OPEN",
        warehouse_location_id: selectedWarehouse.id,
      };

      // @ts-ignore
      const res = await createConsolidationBatch(consolidationData);
      const newMawbData = res.data;

      const newMawb = {
        id: newMawbData.id,
        origin: currentLocation,
        destination: dest, // Assuming destination is still relevant for display
        flightVessel: newMawbData.container_flight_number,
        carrier: "", // Carrier is not in the new model, leave empty or adjust
        hwbs: selectedItems.map((p) => p.id),
        status: newMawbData.status as any,
        taxStatus: TaxStatus.UNASSESSED, // Default for new MAWB
        eta: "Pending", // Or use a date from response if available
        createdDate: newMawbData.created_at,
        totalWeight: parseFloat(newMawbData.total_weight),
      };

      // @ts-ignore
      setMawbs([newMawb, ...mawbs]);

      // Refetch orders or update inventory status locally
      const newOrders = orders.map((o) => {
        const newPackages = o.packages.map((p) => {
          if (packageIds.includes(p.id)) {
            return { ...p, status: OrderStatus.CONSOLIDATED };
          }
          return p;
        });
        const allPackagesConsolidated = newPackages.every(
          // @ts-ignore
          (p) => p.status === OrderStatus.CONSOLIDATED
        );
        if (allPackagesConsolidated) {
          return {
            ...o,
            packages: newPackages,
            status: OrderStatus.CONSOLIDATED,
          };
        }
        return { ...o, packages: newPackages };
      });
      // @ts-ignore
      setOrders(newOrders);

      showToast(res.message || "Manifest Created Successfully", "success");
      setSelectedPackages([]);
      setIsConsolidateOpen(false);

      triggerNav(`/admin/freight/${newMawbData.id}`);
    } catch (error) {
      showToast("Failed to create consolidation batch.", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action Handler for Outbound Manifest Table
  const handleManifestAction = (action: string, manifest: MAWB) => {
    switch (action) {
      case "VIEW":
        triggerNav(`/admin/freight/${manifest.id}`);
        break;
      case "PRINT":
        const originalTitle = document.title;
        document.title = `Shypt_Manifest_Label_${manifest.id}`;
        showToast(`Generating Master Label for ${manifest.id}...`, "success");
        window.print();
        document.title = originalTitle;
        break;
      case "DEPART":
        setMawbs((prev) =>
          prev.map((m) =>
            m.id === manifest.id ? { ...m, status: "IN_TRANSIT" } : m
          )
        );
        showToast(`${manifest.id} marked as In Transit`, "success");
        break;
    }
  };

  // 3. Deconsolidation & Tax Logic
  const handleSelectMawbForDecon = (mawb: MAWB) => {
    setActiveDeconMawb(mawb);
    setCalculatedTax(null);
  };

  const calculateUraTaxes = () => {
    if (!activeDeconMawb) return;

    // Simulate summing up value of HWBs in this MAWB
    const totalDeclaredValue = 2500 + Math.random() * 1000;

    const duty = totalDeclaredValue * 0.25;
    const vat = (totalDeclaredValue + duty) * 0.18;
    const infra = totalDeclaredValue * 0.015;
    const wht = totalDeclaredValue * 0.06;

    const total = duty + vat + infra + wht;

    setCalculatedTax({ duty, vat, wht, infra, total });

    const updated = {
      ...activeDeconMawb,
      taxStatus: TaxStatus.ASSESSED,
      totalTax: total,
    };
    setMawbs((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setActiveDeconMawb(updated);

    showToast("URA Tax Assessment Generated", "info");
  };

  const handleReleaseMawb = () => {
    if (!activeDeconMawb) return;

    const releasedMawb = {
      ...activeDeconMawb,
      status: "DECONSOLIDATED" as const,
      taxStatus: TaxStatus.PAID,
    };
    setMawbs((prev) =>
      prev.map((m) => (m.id === releasedMawb.id ? releasedMawb : m))
    );

    releasedMawb.hwbs.forEach((hwbId) => {
      sendStatusNotification({
        recipientEmail: "client@example.com",
        recipientPhone: "555-0101",
        orderId: hwbId,
        newStatus: OrderStatus.RELEASED,
      });
    });

    showToast(`Manifest ${releasedMawb.id} Released. Taxes Paid.`, "success");
    setActiveDeconMawb(null);
  };

  const packagesForConsolidation = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(
        (order) =>
          order.status === "RECEIVED" &&
          order.warehouse.code === currentLocation
      )
      .flatMap((order) =>
        order.packages.map((pkg) => ({
          id: pkg.hwb_number, // This remains string for display in ConsolidateFlow
          packageId: pkg.id, // This is the actual package ID (number)
          weight: pkg.weight,
          desc: pkg.contents,
          client: order.user.full_name,
          value: parseFloat(pkg.declared_value),
          status: order.status,
          origin: order.warehouse.code,
        }))
      );
  }, [orders, currentLocation]);

  // Helpers
  const currentInventory = inventory.filter(
    (i) => i.status === OrderStatus.RECEIVED && i.origin === currentLocation
  );

  const pendingOrders = orders.filter(
    (o) => o.status === "PENDING" && o.warehouse?.code === currentLocation
  );

  const outboundManifests = useMemo(
    () =>
      consolidations.map((c) => ({
        id: c.id,
        origin: currentLocation,
        destination: "UG",
        flightVessel: c.container_flight_number,
        carrier: "",
        hwbs: c.packages.map((p) => p.hwb_number),
        mawb_number: c.mawb_number,
        status: c.status,
        taxStatus: TaxStatus.UNASSESSED,
        eta: "Pending",
        createdDate: c.created_at,
        totalWeight: parseFloat(c.total_weight),
      })),
    [consolidations, currentLocation]
  );

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg text-white print:hidden">
        <div>
          <h2 className="text-xl font-bold">Warehouse Operations</h2>
          <p className="text-slate-400 text-xs">
            Managing inventory at{" "}
            <span className="text-primary-300 font-mono">
              {currentLocation ? getLocName(currentLocation) : "..."}
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Globe size={18} className="text-slate-400" />
          <select
            value={currentLocation}
            onChange={(e) => {
              setCurrentLocation(e.target.value);
              setSelectedPackages([]);
              setSelectedOrderId("");
            }}
            className="bg-slate-700 border-slate-600 text-white text-sm rounded p-2 focus:ring-primary-500"
          >
            {warehouses.length === 0 ? (
              <option>Loading...</option>
            ) : (
              warehouses.map((w) => (
                <option key={w.id} value={w.code}>
                  {w.name} ({w.code})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 print:hidden">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("RECEIPT")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "RECEIPT"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Inbound Receipt
          </button>
          <button
            onClick={() => setActiveTab("CONSOLIDATE")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "CONSOLIDATE"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Consolidation (Outbound)
          </button>
          <button
            onClick={() => setActiveTab("DECONSOLIDATE")}
            disabled={currentLocation !== "UG"}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "DECONSOLIDATE"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-slate-500"
            } ${
              currentLocation !== "UG" ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Deconsolidation & Tax (Uganda)
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "RECEIPT" && (
          <ReceiptFlow
            currentLocation={currentLocation}
            getLocName={getLocName}
            setIsScannerOpen={setIsScannerOpen}
            handleReceipt={handleReceipt}
            selectedOrderId={selectedOrderId}
            handleOrderSelect={handleOrderSelect}
            pendingOrders={pendingOrders}
            receiptWeight={receiptWeight}
            setReceiptWeight={setReceiptWeight}
            receiptValue={receiptValue}
            setReceiptValue={setReceiptValue}
            inventory={inventory}
            users={users}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            receiptDesc={receiptDesc}
            setReceiptDesc={setReceiptDesc}
            receiptLength={receiptLength}
            setReceiptLength={setReceiptLength}
            receiptWidth={receiptWidth}
            setReceiptWidth={setReceiptWidth}
            receiptHeight={receiptHeight}
            setReceiptHeight={setReceiptHeight}
            isLoading={loading}
          />
        )}

        {activeTab === "CONSOLIDATE" && (
          <ConsolidateFlow
            selectedPackages={selectedPackages}
            handleBulkConsolidateAction={handleBulkConsolidateAction}
            handleOpenConsolidate={handleOpenConsolidate}
            loading={loading}
            packagesForConsolidation={packagesForConsolidation}
            currentLocation={currentLocation}
            setSelectedPackages={setSelectedPackages}
            togglePackageSelection={togglePackageSelection}
            // @ts-ignore
            outboundManifests={outboundManifests}
            handleManifestAction={handleManifestAction}
          />
        )}

        {activeTab === "DECONSOLIDATE" && (
          <DeconsolidateFlow
            mawbs={mawbs}
            handleSelectMawbForDecon={handleSelectMawbForDecon}
            activeDeconMawb={activeDeconMawb}
            calculateUraTaxes={calculateUraTaxes}
            calculatedTax={calculatedTax}
            handleReleaseMawb={handleReleaseMawb}
          />
        )}
      </div>

      {/* --- MODALS --- */}

      {/* CONSOLIDATE FORM */}
      <Modal
        isOpen={isConsolidateOpen}
        onClose={() => setIsConsolidateOpen(false)}
        title="Create Master Manifest"
      >
        <form onSubmit={handleConsolidateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Origin
            </label>
            <input
              disabled
              value={getLocName(currentLocation)}
              className="w-full border border-slate-300 p-2 rounded bg-slate-100 text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Destination
            </label>
            <select
              name="destination"
              required
              className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900"
            >
              <option value="UG">Kampala, Uganda (EBB)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Transport Mode
            </label>
            <select
              name="transport_mode"
              required
              className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900"
            >
              <option value="AIR">Air Freight</option>
              <option value="SEA">Sea Freight</option>
              <option value="ROAD">Road Freight</option>
              <option value="TRAIN">Train Freight</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Flight / Vessel
              </label>
              <input
                name="flight"
                required
                placeholder="e.g. EK-202"
                className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Departure Date
              </label>
              <input
                name="departure_date"
                required
                type="date"
                className="w-full border border-slate-300 p-2 rounded bg-white text-slate-900"
              />
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            Consolidating <strong>{selectedPackages.length}</strong> items.
            Total Weight:{" "}
            <strong>
              {packagesForConsolidation
                .filter((i) => selectedPackages.includes(i.packageId))
                .reduce((acc, c) => acc + Number(c.weight), 0)
                .toFixed(2)}{" "}
              kg
            </strong>
            .
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsConsolidateOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded text-slate-600 bg-white hover:bg-slate-50 mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate MAWB"}
            </button>
          </div>
        </form>
      </Modal>

      {/* BARCODE SCANNER SIMULATOR MODAL */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan Barcode"
        size="md"
      >
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden flex items-center justify-center mb-6 border-4 border-slate-800">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="w-48 h-32 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              </div>
              <p className="text-white/70 text-xs mt-4">
                Align code within frame
              </p>
            </div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595079676614-8b609c919d3f?auto=format&fit=crop&q=80&w=400')] bg-cover opacity-20 filter grayscale"></div>
          </div>

          <div className="w-full space-y-4">
            <p className="text-sm font-bold text-slate-700 text-center">
              Tap a code to simulate scan:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {pendingOrders.slice(0, 4).map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleScanCode(order.tracking_number)}
                  className="p-3 border border-slate-300 rounded hover:bg-blue-50 hover:border-blue-400 transition flex flex-col items-center"
                >
                  <ScanLine size={20} className="mb-1 text-slate-500" />
                  <span className="font-mono text-xs font-bold">
                    {order.id}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate w-full text-center">
                    {order.user.full_name}
                  </span>
                </button>
              ))}
              <button
                onClick={() =>
                  handleScanCode(`UNK-${Math.floor(Math.random() * 1000)}`)
                }
                className="p-3 border border-dashed border-slate-300 rounded hover:bg-slate-50 transition flex flex-col items-center text-slate-500"
              >
                <Smartphone size={20} className="mb-1" />
                <span className="text-xs">Simulate Unknown</span>
              </button>
            </div>

            <div className="relative pt-4 border-t border-slate-100">
              <p className="text-xs text-center text-slate-400 mb-2">
                Or enter manually
              </p>
              <input
                type="text"
                placeholder="Type Barcode & Enter"
                className="w-full border border-slate-300 rounded p-2 text-center font-mono uppercase focus:ring-primary-500 bg-white text-slate-900"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleScanCode((e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <style>{`
            @keyframes scan {
                0% { top: 10%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 90%; opacity: 0; }
            }
          `}</style>
      </Modal>
    </div>
  );
};

export default WarehouseOperations;
