import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Truck,
} from "lucide-react";
import Modal from "../../components/UI/Modal";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useAssistedShopping from "../../api/assistedShopping/useAssistedShopping";
import useInvoice from "@/api/invoices/useInvoice";
import {
  AssistedShoppingItem,
  UpdateAssistedShoppingPayload,
} from "../../api/types/assistedShopping";

interface ClientShoppingDetailsProps {
  requestId: string;
  onBack: () => void;
}

const ClientShoppingDetails: React.FC<ClientShoppingDetailsProps> = ({
  requestId,
  onBack,
}) => {
  const { showToast } = useToast();
  const [request, setRequest] = useState<AssistedShoppingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const { getAssistedShopping, updateAssistedShopping } = useAssistedShopping();
  const { createInvoice, addItemToInvoice } = useInvoice();

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

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

  const handlePay = async () => {
    if (!request || !request.quote_items) return;

    const total =
      request.quote_items?.reduce(
        (acc, q) => acc + q.unit_price * q.quantity,
        0,
      ) || 0;

    if (
      confirm(`Accept quote and proceed to invoice for ${formatCurrency(total)}?`)
    ) {
      setIsPaying(true);
      try {
        // 1. Create Invoice
        const invoiceResponse = await createInvoice({
          user_id: request.user.id,
          type: "OTHER",
          due_date: new Date().toISOString().split("T")[0],
          currency: "USD",
        });
        // @ts-ignore
        const invoice = invoiceResponse.data;

        // 2. Add line items to invoice
        for (const item of request.quote_items) {
          await addItemToInvoice({
            invoice_id: invoice.id,
            description: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
          });
        }

        // 3. Update shopping request status to 'paid' after invoice is created.
        const payload: Partial<UpdateAssistedShoppingPayload> = {
          status: "paid",
        };
        await updateAssistedShopping(request.id, payload);

        showToast("Invoice created! Redirecting to payment.", "success");
        triggerNav(`/client/invoices/${invoice.id}`);
      } catch (error) {
        showToast("Failed to create invoice. Please try again.", "error");
      } finally {
        setIsPaying(false);
      }
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }
    if (!request) return;

    setIsSubmittingRejection(true);
    try {
      const payload: Partial<UpdateAssistedShoppingPayload> = {
        status: "declined",
        notes: rejectionReason,
      };
      await updateAssistedShopping(request.id, payload);
      showToast("Quote has been rejected.", "success");
      setIsRejectModalOpen(false);
      setRejectionReason("");
      fetchRequestDetails(); // to refresh the data
    } catch (error) {
      showToast("Failed to reject quote. Please try again.", "error");
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const quoteTotal =
    request?.quote_items?.reduce(
      (acc, q) => acc + q.unit_price * q.quantity,
      0,
    ) || 0;

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
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-sm text-slate-500">REQ-{request.id}</p>
          <h2 className="text-xl font-bold text-slate-800">
            Shopping Request Details
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <StatusBadge status={request.status.toUpperCase()} />
            <div className="text-xs text-slate-500 font-medium flex items-center">
              <ShoppingCart size={12} className="mr-1.5" />
              Total Items:{" "}
              <strong className="ml-1 text-slate-700">
                {request.items?.length || request.quantity}
              </strong>
            </div>
            <span className="text-xs text-slate-400">
              • Created {new Date(request.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {request.status === "purchased" && (
            <div className="bg-slate-800 text-white p-6 rounded-lg shadow-md">
              <h4 className="flex items-center text-sm font-bold mb-4">
                <Truck size={16} className="mr-2" />
                Your Item is on the Move!
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Retailer ID
                  </p>
                  <p className="font-mono font-medium text-slate-200">
                    {request.retailer_ref}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Carrier
                  </p>
                  <p className="font-medium text-slate-200">
                    {request.carrier}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Tracking #
                  </p>
                  <p className="font-mono font-medium text-slate-200">
                    {request.tracking_ref}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requested Items Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Requested Items</h3>
            </div>
            <div className="p-6 space-y-4">
              {request.items && request.items.length > 0 ? (
                request.items.map((item, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-700">{item.name}</p>
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
                    {item.notes && <p className="text-xs text-slate-500 mt-1">Notes: {item.notes}</p>}
                  </div>
                ))
              ) : (
                 <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-700">{request.name}</p>
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
                     <p className="text-xs text-slate-500 mt-1">Quantity: {request.quantity}</p>
                    {request.notes && <p className="text-xs text-slate-500 mt-1">Notes: {request.notes}</p>}
                  </div>
              )}
            </div>
          </div>


          {/* Quote Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Quotation Details</h3>
            </div>
            <div className="p-6">
              {request.status === "requested" ? (
                <div className="text-center text-slate-500 py-8">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>
                    We are reviewing your request. A quote will appear here
                    shortly.
                  </p>
                </div>
              ) : !request.quote_items || request.quote_items.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Quotation is being generated.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.quote_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.item_name} (x{item.quantity})
                      </span>
                      <span className="font-mono">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between font-bold text-lg">
                    <span>Total Payable</span>
                    <span className="text-primary-600">
                      {formatCurrency(quoteTotal)}
                    </span>
                  </div>

                  {request.status === "quoted" && (
                    <div className="flex items-center gap-x-2">
                      <button
                        onClick={() => setIsRejectModalOpen(true)}
                        disabled={isPaying || isSubmittingRejection}
                        className="w-full mt-4 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-bold flex items-center justify-center disabled:bg-red-400 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={isPaying || isSubmittingRejection}
                        className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center disabled:bg-green-400 disabled:cursor-not-allowed"
                      >
                        {isPaying ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard size={18} className="mr-2" /> Accept &
                            Pay
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {request.status === "paid" && (
                    <div className="w-full mt-4 bg-green-50 text-green-700 py-3 rounded-lg border border-green-200 flex items-center justify-center font-bold">
                      <CheckCircle size={18} className="mr-2" /> Quote Paid
                    </div>
                  )}

                  {request.status === "declined" && (
                    <div className="w-full mt-4 bg-red-50 text-red-700 py-3 rounded-lg border border-red-200 flex items-center justify-center font-bold">
                      <CheckCircle size={18} className="mr-2" /> Quote Declined
                    </div>
                  )}

                  {request.status === "purchased" && (
                    <div className="w-full mt-4 bg-blue-50 text-blue-700 py-3 rounded-lg border border-blue-200 flex items-center justify-center font-bold">
                      <ShoppingCart size={18} className="mr-2" /> Item
                      Purchased
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-fit">
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
      </div>
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={`Reject Quote for REQ-${request?.id}`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Reason for Rejection
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
              className="w-full border border-slate-300 rounded p-2 mt-1 bg-white text-slate-900"
              placeholder="e.g., The quoted price is too high, found a better deal elsewhere, etc."
            ></textarea>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmittingRejection}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center w-40 disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {isSubmittingRejection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Rejection"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientShoppingDetails;
