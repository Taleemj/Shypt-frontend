import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Download,
  Send,
  CreditCard,
  Ban,
  RotateCcw,
  Check,
  Printer,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import {
  Watermark,
  SecurityFooter,
  SecureHeader,
} from "../../components/UI/SecurityFeatures";
import useInvoice from "@/api/invoices/useInvoice";
import { Invoice, Payment } from "@/api/types/invoice";

interface InvoiceDetailsProps {
  invoiceId: string;
  onBack: () => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoiceId,
  onBack,
}) => {
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { showInvoice, updateInvoice, sendInvoiceByEmail } = useInvoice();

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const numericId = parseInt(invoiceId, 10);
      if (isNaN(numericId)) {
        showToast("Invalid Invoice ID", "error");
        return;
      }
      const inv = await showInvoice(numericId);
      setInvoice(inv);
    } catch (error) {
      showToast("Failed to fetch invoice details", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const subtotal = useMemo(
    () =>
      invoice?.line_items.reduce(
        (acc, item) => acc + Number(item.unit_price),
        0
      ) || 0,
    [invoice]
  );
  const tax = 0.0;
  const total = subtotal + tax;

  const handleAction = async (action: string) => {
    if (!invoice) return;

    try {
      let successMessage = "";
      switch (action) {
        case "PAY":
          await updateInvoice(invoice.id, { status: "PAID" });
          successMessage = "Invoice marked as PAID";
          break;
        case "VOID":
          await updateInvoice(invoice.id, { status: "CANCELLED" });
          successMessage = "Invoice has been Voided";
          break;
        case "REMIND":
          await sendInvoiceByEmail(invoice.id);
          successMessage = `Reminder sent to ${invoice.user?.email}`;
          break;
        case "REFUND":
          await updateInvoice(invoice.id, { status: "PENDING" });
          successMessage = "Refund processed. Status reverted.";
          break;
        case "PRINT":
          const originalTitle = document.title;
          document.title = `Shypt_Invoice_${invoice.invoice_number}`;
          window.print();
          document.title = originalTitle;
          return;
      }
      showToast(successMessage, "success");
      await fetchInvoice();
    } catch (error) {
      showToast(`Action failed: ${error.message}`, "error");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading details...</div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-red-500">
        Invoice not found. Please go back and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Invoice {invoice.invoice_number}
            </h2>
            <div className="flex items-center space-x-2 text-sm mt-1">
              <StatusBadge status={invoice.status} />
              <span className="text-slate-500">
                • Issued: {new Date(invoice.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleAction("PRINT")}
            className="flex items-center px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm"
          >
            <Printer size={16} className="mr-2" /> Print
          </button>

          {invoice.status === "UNPAID" && (
            <>
              <button
                onClick={() => handleAction("REMIND")}
                className="flex items-center px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm"
              >
                <Send size={16} className="mr-2" /> Remind
              </button>
              <button
                onClick={() => handleAction("VOID")}
                className="flex items-center px-3 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm"
              >
                <Ban size={16} className="mr-2" /> Void
              </button>
              <button
                onClick={() => handleAction("PAY")}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
              >
                <Check size={16} className="mr-2" /> Mark Paid
              </button>
            </>
          )}

          {invoice.status === "PAID" && (
            <button
              onClick={() => handleAction("REFUND")}
              className="flex items-center px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm"
            >
              <RotateCcw size={16} className="mr-2" /> Issue Refund
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Invoice Document */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-8 relative overflow-hidden print:shadow-none print:border-none print:w-full">
          <Watermark text={invoice.status} />
          <SecureHeader title="Commercial Invoice" />

          <div className="relative z-10">
            <div className="flex justify-between border-b border-slate-100 pb-8 mb-8 print:border-slate-800">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 print:hidden">
                  INVOICE
                </h1>
                <p className="text-slate-500 mt-1 font-mono">
                  #{invoice.invoice_number}
                </p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-slate-800">Shypt Logistics</h3>
                <p className="text-sm text-slate-500">
                  Plot 12, Industrial Area
                </p>
                <p className="text-sm text-slate-500">Kampala, Uganda</p>
                <p className="text-sm text-slate-500">www.shypt.net</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                  Bill To
                </p>
                <p className="font-bold text-slate-800">
                  {invoice.user?.full_name}
                </p>
                <p className="text-sm text-slate-500">{invoice.user?.email}</p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Due Date
                  </p>
                  <p className="font-bold text-slate-800">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Amount Due
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <table className="w-full text-left mb-8">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase print:bg-transparent print:border-b print:border-slate-300">
                <tr>
                  <th className="px-4 py-3 rounded-l-md print:px-0">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right rounded-r-md print:px-0">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                {invoice?.line_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-700 print:px-0">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 print:px-0">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full md:w-1/2 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax (0%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2 print:border-slate-800">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <SecurityFooter type="ORIGINAL" reference={invoice.id.toString()} />
          </div>
        </div>

        {/* Sidebar Info - Hidden on Print */}
        <div className="space-y-6 print:hidden">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">
              Payment Information
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Bank Transfer
                </p>
                <p className="text-sm font-medium text-slate-800">
                  Bank: Stanbic Bank Uganda
                </p>
                <p className="text-sm text-slate-600">Acc: 9030012345678</p>
                <p className="text-sm text-slate-600">Name: Shypt Logistics</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Payment History</h3>
            {invoice?.payments?.length > 0 ? (
              <ul className="space-y-3">
                {invoice?.payments?.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span
                        className={`font-medium ${
                          payment.status === "COMPLETED"
                            ? "text-green-600"
                            : "text-slate-800"
                        }`}
                      >
                        ${Number(payment.amount).toFixed(2)}
                      </span>
                      <span className="text-slate-500 ml-2">
                        via {payment.method}
                      </span>
                    </div>
                    <StatusBadge status={payment.status || ""} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No payments recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
