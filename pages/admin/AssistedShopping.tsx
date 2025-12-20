import React, { useState } from "react";
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
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { DataTable, Column } from "../../components/UI/DataTable";

interface ShopReq {
  id: string;
  client: string;
  item: string;
  url: string;
  price: number;
  status: string;
  date: string;
  retailerRef?: string;
  carrier?: string;
  trackingRef?: string;
}

const AssistedShopping: React.FC = () => {
  const { showToast } = useToast();
  const [selectedReq, setSelectedReq] = useState<ShopReq | null>(null);
  const [modalMode, setModalMode] = useState<
    "QUOTE" | "PURCHASE" | "REJECT" | null
  >(null);

  const [quoteCost, setQuoteCost] = useState<number>(0);
  const [quoteShip, setQuoteShip] = useState<number>(0);

  const [requests, setRequests] = useState<ShopReq[]>([
    {
      id: "REQ-2025-001",
      client: "John Doe",
      item: "MacBook Pro M4",
      url: "https://apple.com/store...",
      price: 0,
      status: "REQUESTED",
      date: "2025-03-01",
    },
    {
      id: "REQ-2025-002",
      client: "Alice Smith",
      item: "Nike Air Jordans (Limited)",
      url: "https://nike.com/jordan...",
      price: 250,
      status: "PAID",
      date: "2025-02-28",
    },
    {
      id: "REQ-2025-003",
      client: "Bob Jones",
      item: "Auto Part #554",
      url: "https://ebay.com/item...",
      price: 1500,
      status: "QUOTED",
      date: "2025-02-25",
    },
    {
      id: "REQ-2025-005",
      client: "Mike Ross",
      item: "Gaming Chair",
      url: "https://amazon.com...",
      price: 450,
      status: "PURCHASED",
      date: "2025-02-18",
      retailerRef: "112-9988-221",
      carrier: "UPS",
      trackingRef: "1Z998122",
    },
  ]);

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const handleOpenModal = (
    req: ShopReq,
    mode: typeof modalMode,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedReq(req);
    setModalMode(mode);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedReq?.id
          ? {
              ...r,
              status: "QUOTED",
              price: quoteCost + quoteShip + quoteCost * 0.1,
            }
          : r
      )
    );
    showToast("Quotation sent to client", "success");
    setModalMode(null);
  };

  const handlePurchaseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedReq?.id
          ? {
              ...r,
              status: "PURCHASED",
              retailerRef: fd.get("retailer_ref") as string,
              carrier: fd.get("carrier") as string,
              trackingRef: fd.get("tracking_ref") as string,
            }
          : r
      )
    );
    showToast(
      "Procurement details saved. Item marked as Purchased.",
      "success"
    );
    setModalMode(null);
  };

  const columns: Column<ShopReq>[] = [
    {
      header: "Request ID",
      accessor: (req) => (
        <span className="font-mono text-primary-600 font-bold hover:underline">
          {req.id}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    { header: "Client", accessor: "client", sortable: true },
    {
      header: "Item",
      accessor: (req) => (
        <div>
          <div className="text-sm font-bold text-slate-800">{req.item}</div>
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
            {req.retailerRef && (
              <span className="text-[10px] text-slate-400 font-mono">
                Ref: {req.retailerRef}
              </span>
            )}
          </div>
        </div>
      ),
      sortKey: "item",
      sortable: true,
    },
    {
      header: "Status",
      accessor: (req) => <StatusBadge status={req.status} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Total",
      accessor: (req) => (req.price > 0 ? `$${req.price.toFixed(2)}` : "-"),
      className: "text-right font-bold",
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (req) => (
        <div className="flex justify-end gap-2">
          {req.status === "REQUESTED" && (
            <button
              onClick={(e) => handleOpenModal(req, "QUOTE", e)}
              className="text-primary-600 font-bold text-[10px] bg-primary-50 px-2 py-1 rounded-md border border-primary-200 uppercase tracking-tighter"
            >
              Issue Quote
            </button>
          )}
          {req.status === "PAID" && (
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

      <DataTable
        data={requests}
        columns={columns}
        onRowClick={(req) => triggerNav(`/admin/shopping/${req.id}`)}
        title="Procurement Queue"
        searchPlaceholder="Search clients, items, or retailer refs..."
      />

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
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 shadow-lg transition"
          >
            Send Quotation to Client
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={modalMode === "PURCHASE"}
        onClose={() => setModalMode(null)}
        title="Procurement Record"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg text-green-800 text-xs border border-green-100 flex items-start gap-3">
            <AlertCircle size={16} />
            <p>
              Items marked as <strong>PURCHASED</strong> will allow origin
              warehouse staff to link this request to an incoming package using
              the Retailer Reference below.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Retailer Order ID <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="retailer_ref"
              placeholder="e.g. AMZN-114-2233..."
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Carrier
              </label>
              <select
                name="carrier"
                className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
              >
                <option>UPS</option>
                <option>FedEx</option>
                <option>USPS</option>
                <option>DHL</option>
                <option>Amazon Logistic</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Tracking Number
              </label>
              <input
                required
                name="tracking_ref"
                placeholder="e.g. 1Z99..."
                className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900 font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 shadow-lg transition flex items-center justify-center"
          >
            <Truck size={18} className="mr-2" /> Confirm & Save Records
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AssistedShopping;
