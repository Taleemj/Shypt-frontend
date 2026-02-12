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
  Loader2,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quote state for multi-item
  interface ItemQuote {
    name: string;
    quantity: number;
    netCost: number;
  }
  const [itemQuotes, setItemQuotes] = useState<ItemQuote[]>([]);
  const [domesticShippingCost, setDomesticShippingCost] = useState<number>(0);

  const {
    getAssistedShopping,
    updateAssistedShopping,
    addAssistedShoppingQuote,
  } = useAssistedShopping();

  const formatCurrency = (amount: number) => {
    return `$ ${amount.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  };

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

  const handleOpenQuoteModal = () => {
    if (!request) return;
    const initialQuotes =
      request.items?.map((item) => ({
        name: item.name,
        quantity: (item as any).quantity || 1,
        netCost: 0,
      })) || [];
    setItemQuotes(initialQuotes);
    setDomesticShippingCost(0);
    setModalMode("QUOTE");
  };

  const handleQuoteItemChange = (index: number, netCost: number) => {
    const updatedQuotes = [...itemQuotes];
    updatedQuotes[index].netCost = netCost;
    setItemQuotes(updatedQuotes);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setIsSubmitting(true);

    try {
      // Add each item's net cost as a quote item
      for (const item of itemQuotes) {
        if (item.netCost > 0) {
          await addAssistedShoppingQuote({
            assisted_shopping_id: request.id,
            item_name: item.name,
            quantity: item.quantity,
            unit_price: item.netCost,
          });
        }
      }

      // Add domestic shipping if provided
      if (domesticShippingCost > 0) {
        await addAssistedShoppingQuote({
          assisted_shopping_id: request.id,
          item_name: "Domestic Shipping",
          quantity: 1,
          unit_price: domesticShippingCost,
        });
      }

      // Calculate and add service fee
      const subtotal =
        itemQuotes.reduce(
          (acc, item) => acc + item.netCost * item.quantity,
          0,
        ) + domesticShippingCost;
      const serviceFee = subtotal * 0.1;
      if (serviceFee > 0) {
        await addAssistedShoppingQuote({
          assisted_shopping_id: request.id,
          item_name: "Service Fee (10%)",
          quantity: 1,
          unit_price: serviceFee,
        });
      }

      // Update the main request status to 'quoted'
      const payload: Partial<UpdateAssistedShoppingPayload> = {
        status: "quoted",
      };
      // @ts-ignore
      await updateAssistedShopping(request.id, payload);

      showToast("Quotation sent to client", "success");
      setModalMode(null);
      fetchRequestDetails();
    } catch (error) {
      showToast("Failed to send quotation.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        "success",
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
      0,
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
      request.updated_at,
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
              Shopping Request Details
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={request.status.toUpperCase()} />
              <span className="text-xs text-slate-400">
                • Created {new Date(request.created_at).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center">
                <ShoppingCart size={12} className="mr-1.5" />
                Total Items:{" "}
                <strong className="ml-1 text-slate-700">
                  {request.items?.length || request.quantity}
                </strong>
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          {request.status !== "requested" && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-bold flex items-center"
            >
              <Printer size={16} className="mr-2" /> Print Quote
            </button>
          )}
          {request.status === "requested" && (
            <button
              onClick={handleOpenQuoteModal}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-bold shadow-md"
            >
              Issue Quote
            </button>
          )}
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
                {/* Removed redundant item details from here, now in Requested Items Card */}
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    Request ID
                  </p>
                  <p className="font-bold text-slate-900 text-lg">
                    REQ-{request.id}
                  </p>
                  {request.notes && (
                    <p className="text-sm text-slate-600 mt-1">
                      Notes: {request.notes}
                    </p>
                  )}
                </div>
              </div>
              {/* Requested Items Card - Admin View */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">Requested Items</h3>
                </div>
                <div className="p-6 space-y-4">
                  {request.items && request.items.length > 0 ? (
                    request.items.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 rounded-md border border-slate-100"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-slate-700">
                            {item.name}
                          </p>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center"
                          >
                            <ExternalLink size={12} className="mr-1" />
                            Link
                          </a>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-1">
                            Notes: {item.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-slate-700">
                          {request.name}
                        </p>
                        <a
                          href={request.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center"
                        >
                          <ExternalLink size={12} className="mr-1" />
                          Link
                        </a>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Quantity: {request.quantity}
                      </p>
                      {request.notes && (
                        <p className="text-xs text-slate-500 mt-1">
                          Notes: {request.notes}
                        </p>
                      )}
                    </div>
                  )}
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
                        {formatCurrency(quote.unit_price * quote.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-xl text-slate-900 border-t border-slate-200 pt-4 mt-2 print:border-slate-800">
                    <span>TOTAL COLLECTED</span>
                    <span>{formatCurrency(quoteTotal)}</span>
                  </div>
                </div>
              </div>{" "}
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
        isOpen={modalMode === "QUOTE"}
        onClose={() => setModalMode(null)}
        title={`Generate Quotation for REQ-${request?.id}`}
        size="lg"
      >
        <form onSubmit={handleQuoteSubmit} className="space-y-4">
          <div className="space-y-4 max-h-[40vh] overflow-y-auto p-2">
            {itemQuotes.map((item, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg space-y-2 bg-slate-50"
              >
                <p className="font-bold text-slate-800">
                  {item.name}{" "}
                  <span className="font-normal text-slate-500">
                    (Qty: {item.quantity})
                  </span>
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Item Net Cost ($)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={item.netCost || ""}
                      className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                      onChange={(e) =>
                        handleQuoteItemChange(
                          index,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Total Domestic Shipping ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
                value={domesticShippingCost || ""}
                onChange={(e) =>
                  setDomesticShippingCost(parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-xl space-y-2 text-sm border border-slate-200">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span>
                {formatCurrency(
                  itemQuotes.reduce(
                    (acc, item) => acc + item.netCost * item.quantity,
                    0,
                  ),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Domestic Shipping:</span>
              <span>{formatCurrency(domesticShippingCost)}</span>
            </div>
            <div className="flex justify-between text-primary-600 font-bold">
              <span>Service Fee (10%):</span>
              <span>
                {formatCurrency(
                  (itemQuotes.reduce(
                    (acc, item) => acc + item.netCost * item.quantity,
                    0,
                  ) +
                    domesticShippingCost) *
                    0.1,
                )}
              </span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t pt-2">
              <span>Final Quote:</span>
              <span>
                {formatCurrency(
                  (itemQuotes.reduce(
                    (acc, item) => acc + item.netCost * item.quantity,
                    0,
                  ) +
                    domesticShippingCost) *
                    1.1,
                )}
              </span>
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
