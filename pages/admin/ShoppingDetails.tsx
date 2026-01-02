import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  DollarSign,
  Printer,
  MessageSquare,
  Truck,
  Check,
  XCircle,
  ShoppingCart,
  Hash,
  ShieldCheck,
  Tag,
  Info,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import {
  Watermark,
  SecureHeader,
  SecurityFooter,
} from "../../components/UI/SecurityFeatures";
import Modal from "../../components/UI/Modal";
import useAssistedShopping from "../../api/assistedShopping/useAssistedShopping";
import {
  AssistedShoppingItem,
  UpdateAssistedShoppingPayload,
} from "../../api/types/assistedShopping";

interface ShoppingDetailsProps {
  requestId: string;
  onBack: () => void;
}

const ShoppingDetails: React.FC<ShoppingDetailsProps> = ({
  requestId,
  onBack,
}) => {
  const { showToast } = useToast();
  const [modalMode, setModalMode] = useState<"QUOTE" | "PURCHASE" | null>(null);
  const [request, setRequest] = useState<AssistedShoppingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getAssistedShopping, updateAssistedShopping } = useAssistedShopping();

  const fetchRequestDetails = async () => {
    try {
      setIsLoading(true);
      const id = parseInt(requestId.replace("REQ-", ""), 10);
      const response = await getAssistedShopping(id);
      setRequest(response.data);
    } catch (err) {
      setError("Failed to fetch request details.");
      showToast("Failed to fetch request details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const handlePurchaseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!request) return;
    const fd = new FormData(e.currentTarget);
    const payload: UpdateAssistedShoppingPayload = {
      name: request.name,
      url: request.url,
      quantity: request.quantity,
      notes: request.notes,
      status: "purchased",
      retailer_ref: fd.get("retailer_ref") as string,
      carrier: fd.get("carrier") as string,
      tracking_ref: fd.get("tracking_ref") as string,
    };

    try {
      await updateAssistedShopping(request.id, payload);
      showToast(
        "Procurement details saved. Item marked as Purchased.",
        "success"
      );
      setModalMode(null);
      fetchRequestDetails();
    } catch (error) {
      showToast("Failed to save procurement details.", "error");
    }
  };

  const quoteTotal =
    request?.quote_items?.reduce(
      (acc, q) => acc + q.unit_price * q.quantity,
      0
    ) || 0;
  const quoteSubtotal =
    request?.quote_items
      ?.filter((q) => q.item_name !== "Service Fee (10%)")
      .reduce((acc, q) => acc + q.unit_price * q.quantity, 0) || 0;
  const serviceFee = quoteTotal - quoteSubtotal;

  const updates = useMemo(() => {
    if (!request) return [];
    const getStatusHistory = (status, createdAt, updatedAt) => {
      const history = [];
      const formattedCreationDate = new Date(createdAt).toLocaleString();
      const formattedUpdateDate = new Date(updatedAt).toLocaleString();

      history.push({ date: formattedCreationDate, text: "Request submitted" });

      if (status === "declined") {
        history.push({ date: formattedUpdateDate, text: "Request declined" });
        return history;
      }

      if (status === "quoted" || status === "paid" || status === "purchased") {
        history.push({
          date: formattedUpdateDate,
          text: "Admin reviewed request",
        });
        history.push({ date: formattedUpdateDate, text: "Quote generated" });
      }

      if (status === "paid" || status === "purchased") {
        history.push({
          date: formattedUpdateDate,
          text: "Quote paid by client",
        });
      }

      if (status === "purchased") {
        history.push({ date: formattedUpdateDate, text: "Item purchased" });
      }

      return history;
    };
    return getStatusHistory(
      request.status,
      request.created_at,
      request.updated_at
    );
  }, [request]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading Request Details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center text-red-500 bg-red-100 p-4 rounded">
        {error || "Request not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              REQ-{request.id}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={request.status.toUpperCase()} />
              <span className="text-xs text-slate-400">
                • Created {new Date(request.created_at).toLocaleString()}
              </span>
              <a
                href={request.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center ml-2"
              >
                <ExternalLink size={12} className="mr-1" />
                Original Link
              </a>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-bold flex items-center"
          >
            <Printer size={16} className="mr-2" /> Print Quote
          </button>
          {request.status === "paid" && (
            <button
              onClick={() => setModalMode("PURCHASE")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold shadow-md"
            >
              Execute Purchase
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 print:w-full">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 relative overflow-hidden print:border-none print:shadow-none">
            <Watermark text={request.status.toUpperCase()} />
            <SecureHeader title="Procurement Summary" />
            <div className="relative z-10">
              <div className="grid grid-cols-2 gap-12 mb-10 pb-8 border-b border-slate-100 print:border-slate-800">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    Consignee
                  </p>
                  <p className="font-bold text-slate-900">
                    {request.user.full_name}
                  </p>
                  <p className="text-sm text-slate-500">{request.user.email}</p>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    ID: CL-{request.user.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    Item details
                  </p>
                  <p className="font-bold text-slate-900 text-lg">
                    {request.name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{request.notes}</p>
                </div>
              </div>

              {request.status === "purchased" && (
                <div className="mb-10 bg-slate-900 text-white p-6 rounded-2xl shadow-xl ring-1 ring-slate-800">
                  <h4 className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    <ShieldCheck size={14} className="mr-2 text-green-400" />{" "}
                    Domestic Logistics (Origin)
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Retailer ID
                      </p>
                      <p className="font-mono text-sm font-bold text-primary-400">
                        {request.retailer_ref}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Carrier
                      </p>
                      <p className="text-sm font-bold">{request.carrier}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Origin Tracking
                      </p>
                      <p className="font-mono text-sm font-bold text-green-400">
                        {request.tracking_ref}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 print:bg-transparent print:border-slate-800">
                <div className="flex items-center gap-2 mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <DollarSign size={14} /> Financial Audit
                </div>
                <div className="space-y-3 text-sm">
                  {request.quote_items?.map((quote) => (
                    <div className="flex justify-between" key={quote.id}>
                      <span>
                        {quote.item_name} (x{quote.quantity})
                      </span>
                      <span className="font-mono">
                        ${(quote.unit_price * quote.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-xl text-slate-900 border-t border-slate-200 pt-4 mt-2 print:border-slate-800">
                    <span>TOTAL COLLECTED</span>
                    <span>${quoteTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="hidden print:block">
                <SecurityFooter
                  type="ORIGINAL"
                  reference={`REQ-${request.id}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-fit mb-6">
            <h3 className="font-bold text-slate-800 mb-6">Status Updates</h3>
            <div className="border-l-2 border-slate-100 ml-2 space-y-6">
              {updates.map((u, i) => (
                <div key={i} className="relative pl-6">
                  <div
                    className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                      i === updates.length - 1
                        ? "bg-primary-500"
                        : "bg-slate-300"
                    }`}
                  ></div>
                  <p className="text-sm font-medium text-slate-800">{u.text}</p>
                  <p className="text-xs text-slate-500">{u.date}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center uppercase tracking-widest text-xs">
              <Info size={16} className="mr-2" /> Operations Notice
            </h3>
            <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-xs leading-relaxed">
              Upon arrival at the origin warehouse, this item will be linked
              using the <strong>Tracking Ref</strong>. Ensure all vendor
              receipts are uploaded to the MAWB docs.
            </div>
          </div>
        </div>
      </div>
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

export default ShoppingDetails;
