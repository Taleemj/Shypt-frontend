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

const AssistedShopping: React.FC = () => {
  const { showToast } = useToast();
  const [selectedReq, setSelectedReq] = useState<AssistedShoppingItem | null>(
    null
  );
  const [modalMode, setModalMode] = useState<
    "QUOTE" | "PURCHASE" | "REJECT" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [quoteCost, setQuoteCost] = useState<number>(0);
  const [quoteShip, setQuoteShip] = useState<number>(0);

  const [requests, setRequests] = useState<AssistedShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    listAssistedShoppingRequests,
    addAssistedShoppingQuote,
    updateAssistedShopping,
  } = useAssistedShopping();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await listAssistedShoppingRequests();
      setRequests(response.data.data);
    } catch (err) {
      setError("Failed to fetch shopping requests.");
      showToast("Failed to fetch shopping requests.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload: UpdateAssistedShoppingPayload = {
      name: selectedReq.name,
      url: selectedReq.url,
      quantity: selectedReq.quantity,
      notes: selectedReq.notes,
      status: "purchased",
      retailer_ref: fd.get("retailer_ref") as string,
      carrier: fd.get("carrier") as string,
      tracking_ref: fd.get("tracking_ref") as string,
    };

    try {
      await updateAssistedShopping(selectedReq.id, payload);
      showToast(
        "Procurement details saved. Item marked as Purchased.",
        "success"
      );
      setModalMode(null);
      fetchRequests();
    } catch (error) {
      showToast("Failed to save procurement details.", "error");
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
        const total = req.quotes?.reduce(
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
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 shadow-lg transition flex items-center justify-center disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Truck size={18} className="mr-2" /> Confirm & Save Records
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AssistedShopping;
