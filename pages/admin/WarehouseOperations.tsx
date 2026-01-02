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
import { Order } from "../../api/types/orders";
import useWareHouse from "../../api/warehouse/useWareHouse";
import { WareHouseLocation } from "../../api/types/warehouse";
import useConsolidation from "../../api/consolidation/useConsolidation";
import { HWB, MAWB } from "../../components/warehouse/types";
import ReceiptFlow from "../../components/warehouse/ReceiptFlow";
import ConsolidateFlow from "../../components/warehouse/ConsolidateFlow";
import DeconsolidateFlow from "../../components/warehouse/DeconsolidateFlow";
import useCargo from "@/api/cargo/useCargo";
import { CargoDeclaration } from "@/api/types/cargo";
import useAuth from "@/api/auth/useAuth";
import { AuthUser } from "@/api/types/auth";

const WarehouseOperations: React.FC = () => {
  const { showToast } = useToast();
  const { getOrders } = useOrders();
  const { fetchWareHouseLocations } = useWareHouse();
  const { createConsolidationBatch } = useConsolidation();
  const { listCargoDeclarations } = useCargo();
  const { fetchAllUsers } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<WareHouseLocation[]>([]);
  const [declarations, setDeclarations] = useState<CargoDeclaration[]>([]);
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
        const [warehousesRes, declarationsRes, usersRes] =
          await Promise.allSettled([
            fetchWareHouseLocations(),
            listCargoDeclarations(),
            fetchAllUsers(),
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

        if (declarationsRes.status === "fulfilled") {
          setDeclarations(declarationsRes.value.data);
        } else {
          showToast("Failed to load cargo declarations", "error");
        }

        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value.data);
        } else {
          showToast("Failed to load users", "error");
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
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await getOrders();
        setOrders(response.data.data);
      } catch (err) {
        showToast("Could not fetch orders.", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "CONSOLIDATE") {
      fetchOrders();
    }
  }, [activeTab, showToast]);

  // Navigation Helper
  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  // --- STATE WITH SAMPLE DATA ---

  // 1. Inventory (Pending Consolidation)
  const [inventory, setInventory] = useState<HWB[]>([
    {
      id: "HWB-8821",
      weight: 12.5,
      desc: "Laptop Batch A",
      client: "Acme Corp",
      value: 2500,
      status: OrderStatus.RECEIVED,
      origin: "CN",
    },
    {
      id: "HWB-8822",
      weight: 4.2,
      desc: "Fashion Samples",
      client: "Jane Doe",
      value: 150,
      status: OrderStatus.RECEIVED,
      origin: "CN",
    },
    {
      id: "HWB-8823",
      weight: 55.0,
      desc: "Auto Parts",
      client: "Mechanic Shop Ltd",
      value: 1200,
      status: OrderStatus.RECEIVED,
      origin: "CN",
    },
    {
      id: "HWB-771",
      weight: 10.5,
      desc: "Shoes",
      client: "Alice",
      value: 200,
      status: OrderStatus.IN_TRANSIT,
      origin: "CN",
    },
    {
      id: "HWB-772",
      weight: 5.0,
      desc: "Toys",
      client: "Bob",
      value: 50,
      status: OrderStatus.IN_TRANSIT,
      origin: "CN",
    },
    {
      id: "HWB-661",
      weight: 8.0,
      desc: "Books",
      client: "Charlie",
      value: 80,
      status: OrderStatus.IN_TRANSIT,
      origin: "UK",
    },
  ]);

  // 2. Active Manifests (MAWBs)
  const [mawbs, setMawbs] = useState<MAWB[]>([
    {
      id: "MAWB-CN-UG-991",
      origin: "CN",
      destination: "UG",
      flightVessel: "CZ-330",
      carrier: "China Southern",
      hwbs: ["HWB-771", "HWB-772"],
      status: "ARRIVED",
      taxStatus: TaxStatus.UNASSESSED,
      eta: "2025-03-05",
      createdDate: "2025-02-28",
      totalWeight: 15.5,
    },
    {
      id: "MAWB-UK-UG-202",
      origin: "UK",
      destination: "UG",
      flightVessel: "BA-063",
      carrier: "British Airways",
      hwbs: ["HWB-661"],
      status: "IN_TRANSIT",
      taxStatus: TaxStatus.UNASSESSED,
      eta: "2025-03-08",
      createdDate: "2025-03-01",
      totalWeight: 8.0,
    },
  ]);

  // UI State
  const [selectedHwbs, setSelectedHwbs] = useState<string[]>([]);

  // Receipt Form State
  const [selectedDeclarationId, setSelectedDeclarationId] =
    useState<string>("");
  const [receiptWeight, setReceiptWeight] = useState("");
  const [receiptDesc, setReceiptDesc] = useState("");
  const [receiptValue, setReceiptValue] = useState("");
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
  const handleDeclarationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const declarationId = e.target.value;
    setSelectedDeclarationId(declarationId);
    fillFormFromDeclaration(declarationId);
  };

  const fillFormFromDeclaration = (declarationId: string) => {
    if (declarationId) {
      const declaration = declarations.find(
        (d) => d.id === parseInt(declarationId)
      );
      if (declaration) {
        setReceiptDesc(declaration.cargo_details);
        setReceiptWeight(declaration.weight?.toString() || "");
        setReceiptValue(declaration.value.toString());
        // @ts-ignore
        setSelectedUserId(declaration.user.id.toString());
      }
    } else {
      setReceiptDesc("");
      setReceiptWeight("");
      setReceiptValue("");
      setSelectedUserId("");
    }
  };

  // 0.5 Barcode Scanning Logic
  const handleScanCode = (code: string) => {
    setIsScannerOpen(false);
    // Assuming barcode maps to declaration ID or tracking number
    const declaration = declarations.find(
      (d) => d.id.toString() === code || d.tracking_number === code
    );

    if (declaration) {
      if (declaration.location?.code !== currentLocation) {
        showToast(
          `Warning: Declaration ${declaration.id} expected in ${
            declaration.location?.code || "N/A"
          }, not ${currentLocation}`,
          "warning"
        );
      }
      setSelectedDeclarationId(declaration.id.toString());
      fillFormFromDeclaration(declaration.id.toString());
      showToast(
        `Declaration ${declaration.id} scanned successfully`,
        "success"
      );
    } else {
      setSelectedDeclarationId("");
      setReceiptDesc(`Scanned Item: ${code}`);
      setSelectedUserId("");
      setReceiptWeight("");
      showToast(`Unknown barcode ${code}. Please fill details.`, "info");
    }
  };

  // 1. Receipt Handler
  const handleReceipt = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedUser = users.find((u) => u.id === parseInt(selectedUserId));

    const newHwb: HWB = {
      id: `HWB-${Math.floor(Math.random() * 10000)}`,
      weight: Number(receiptWeight),
      desc: receiptDesc || "General Cargo",
      client: selectedUser?.full_name || "Walk-in / Unknown",
      value: Number(receiptValue) || 50,
      status: OrderStatus.RECEIVED,
      origin: currentLocation,
      orderRef: selectedDeclarationId || undefined,
    };

    setInventory([newHwb, ...inventory]);
    if (selectedDeclarationId) {
      // Since API is not ready, we will just show a toast.
      // In a real scenario, you'd call an API to update the declaration status.
      showToast(
        `Declaration ${selectedDeclarationId} marked as received.`,
        "info"
      );
      setDeclarations((prev) =>
        prev.filter((d) => d.id !== parseInt(selectedDeclarationId))
      );
    }

    // sendStatusNotification({
    //   recipientEmail: "client@example.com",
    //   recipientPhone: "555-0101",
    //   orderId: newHwb.id,
    //   newStatus: OrderStatus.RECEIVED,
    // });

    showToast(`Package ${newHwb.id} Received & Logged`, "success");
    setReceiptWeight("");
    setReceiptDesc("");
    setReceiptValue("");
    setSelectedUserId("");
    setSelectedDeclarationId("");
  };

  // 2. Consolidation Logic
  const toggleHwbSelection = (id: string) => {
    setSelectedHwbs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenConsolidate = () => {
    if (selectedHwbs.length === 0) {
      showToast("Please select at least one package", "warning");
      return;
    }
    setIsConsolidateOpen(true);
  };

  const handleBulkConsolidateAction = (action: string) => {
    if (action === "REMOVE") {
      setSelectedHwbs([]);
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

    const selectedItems = packagesForConsolidation?.filter((i) =>
      selectedHwbs.includes(i.id)
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
      status: "CONSOLIDATED",
    };

    try {
      // @ts-ignore
      const res = await createConsolidationBatch(consolidationData);
      const newMawbData = res.data;

      const newMawb: MAWB = {
        id: newMawbData.mawb_number,
        origin: currentLocation,
        destination: dest, // Assuming destination is still relevant for display
        flightVessel: newMawbData.container_flight_number,
        carrier: "", // Carrier is not in the new model, leave empty or adjust
        hwbs: selectedHwbs,
        status: newMawbData.status as any,
        taxStatus: TaxStatus.UNASSESSED, // Default for new MAWB
        eta: "Pending", // Or use a date from response if available
        createdDate: newMawbData.created_at,
        totalWeight: parseFloat(newMawbData.total_weight),
      };

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
      setSelectedHwbs([]);
      setIsConsolidateOpen(false);

      triggerNav(`/admin/freight/${newMawbData.id}`);
    } catch (error) {
      showToast("Failed to create consolidation batch.", "error");
      console.error(error);
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
          order.origin_country === currentLocation
      )
      .flatMap((order) =>
        order.packages.map((pkg) => ({
          id: pkg.hwb_number,
          packageId: pkg.id,
          weight: pkg.weight,
          desc: pkg.contents,
          client: order.user.full_name,
          value: parseFloat(pkg.declared_value),
          status: order.status,
          origin: order.origin_country,
        }))
      );
  }, [orders, currentLocation]);

  // Helpers
  const currentInventory = inventory.filter(
    (i) => i.status === OrderStatus.RECEIVED && i.origin === currentLocation
  );

  const pendingDeclarations = declarations.filter(
    (d) => d.status === "pending" && d.location?.code === currentLocation
  );

  const outboundManifests = mawbs.filter((m) => m.origin === currentLocation);

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
              setSelectedHwbs([]);
              setSelectedDeclarationId("");
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
            selectedDeclarationId={selectedDeclarationId}
            handleDeclarationSelect={handleDeclarationSelect}
            pendingDeclarations={pendingDeclarations}
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
          />
        )}

        {activeTab === "CONSOLIDATE" && (
          <ConsolidateFlow
            selectedHwbs={selectedHwbs}
            handleBulkConsolidateAction={handleBulkConsolidateAction}
            handleOpenConsolidate={handleOpenConsolidate}
            loading={loading}
            // @ts-ignore
            packagesForConsolidation={packagesForConsolidation}
            currentLocation={currentLocation}
            setSelectedHwbs={setSelectedHwbs}
            toggleHwbSelection={toggleHwbSelection}
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
              <option value="air">Air Freight</option>
              <option value="sea">Sea Freight</option>
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
            Consolidating <strong>{selectedHwbs.length}</strong> items. Total
            Weight:{" "}
            <strong>
              {packagesForConsolidation
                .filter((i) => selectedHwbs.includes(i.id))
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
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Generate MAWB
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
              {pendingDeclarations.slice(0, 4).map((declaration) => (
                <button
                  key={declaration.id}
                  onClick={() => handleScanCode(declaration.id.toString())}
                  className="p-3 border border-slate-300 rounded hover:bg-blue-50 hover:border-blue-400 transition flex flex-col items-center"
                >
                  <ScanLine size={20} className="mb-1 text-slate-500" />
                  <span className="font-mono text-xs font-bold">
                    {declaration.id}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate w-full text-center">
                    {/* @ts-ignore */}
                    {declaration.user.full_name}
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
