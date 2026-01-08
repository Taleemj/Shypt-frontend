import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  AlertCircle,
  Share2,
  CreditCard,
  Download,
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import {
  Watermark,
  SecurityFooter,
  SecureHeader,
} from "../../components/UI/SecurityFeatures";
import useInvoice from "@/api/invoices/useInvoice";
import { Payment } from "@/api/types/invoice";

// Helper function for currency formatting
const formatCurrency = (amount: number, currency: string | undefined) => {
  const symbol = currency === "UGX" ? "UGX " : "$";
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface PaymentDetailsProps {
  paymentId: string;
  onBack: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  paymentId,
  onBack,
}) => {
  const { showToast } = useToast();
  const { getAllPayments } = useInvoice();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      try {
        const response = await getAllPayments();
        const foundPayment = response.data.data.find(
          (p) => p.id === parseInt(paymentId, 10)
        );
        if (foundPayment) {
          setPayment(foundPayment);
        } else {
          showToast(`Payment with ID ${paymentId} not found.`, "error");
          onBack();
        }
      } catch (error) {
        showToast("Failed to fetch payment details.", "error");
        console.error(error);
        onBack();
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [paymentId]);

  const handlePrint = () => {
    if (!payment) return;
    const originalTitle = document.title;
    document.title = `Shypt_Receipt_${payment.id}`;
    window.print();
    document.title = originalTitle;
  };

  const handleVerify = () => {
    if (!payment) return;
    // TODO: Implement API call to verify payment
    setPayment((prev) => (prev ? { ...prev, status: "COMPLETED" } : null));
    showToast("Payment marked as Verified manually.", "success");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading payment details...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex justify-center items-center h-screen">
        Payment not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Screen Only Header */}
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
              Payment {payment.id}
            </h2>
            <div className="flex items-center space-x-2 text-sm mt-1">
              <StatusBadge status={payment.status || ""} />
              <span className="text-slate-500">
                • {new Date(payment.paid_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm font-medium shadow-sm transition"
          >
            <Printer size={16} className="mr-2" /> Print Receipt
          </button>
          {payment.status === "PENDING" && (
            <button
              onClick={handleVerify}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium shadow-sm transition"
            >
              <CheckCircle size={16} className="mr-2" /> Verify
            </button>
          )}
        </div>
      </div>

      {/* Receipt Container */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto relative overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Security Features */}
        <Watermark text={payment.status === "COMPLETED" ? "PAID" : "PENDING"} />
        <SecureHeader title="Official Receipt" />

        <div className="relative z-10">
          {/* Top Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm text-slate-500 uppercase font-bold mb-1">
                Received From
              </p>
              <h3 className="text-lg font-bold text-slate-800">
                {payment.user.full_name}
              </h3>
              <p className="text-sm text-slate-600">{payment.user.address}</p>
              <p className="text-sm text-slate-600">{payment.user.email}</p>
              <p className="text-xs font-mono text-slate-400 mt-1">
                ID: {payment.user.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 uppercase font-bold mb-1">
                Receipt Details
              </p>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded print:bg-transparent print:border-slate-800">
                <p className="text-sm text-slate-600 flex justify-between gap-4">
                  <span>Date:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {new Date(payment.paid_at).toLocaleDateString()}
                  </span>
                </p>
                <p className="text-sm text-slate-600 flex justify-between gap-4 mt-1">
                  <span>Number:</span>{" "}
                  <span className="font-mono font-medium text-slate-900">
                    {payment.id}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Amount Section */}
          <div className="bg-slate-50 border-y border-slate-200 py-6 mb-8 text-center print:bg-transparent print:border-y-2 print:border-slate-800">
            <p className="text-sm text-slate-500 uppercase font-bold mb-2">
              Amount Received
            </p>
            <div className="flex justify-center items-baseline text-4xl font-extrabold text-slate-900">
              {formatCurrency(Number(payment.amount), payment.invoice?.currency)}
            </div>
          </div>

          {/* Payment Info Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 text-sm uppercase">
                Payment Method
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method</span>
                  <span className="font-medium text-slate-900">
                    {payment.method.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference No.</span>
                  <span className="font-mono font-medium text-slate-900">
                    {payment.transaction_reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={`font-bold ${
                      payment.status === "COMPLETED"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 text-sm uppercase">
                Allocation
              </h4>
              <div className="space-y-2 text-sm">
                {payment.invoice && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center">
                        <CheckCircle
                          size={12}
                          className="mr-2 text-green-500"
                        />
                        {payment.invoice.invoice_number}
                      </span>
                      <span className="font-mono text-slate-900">
                        {formatCurrency(Number(payment.amount), payment.invoice?.currency)}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold">
                      <span>Total Allocated</span>
                      <span>{formatCurrency(Number(payment.amount), payment.invoice?.currency)}</span>
                    </div>
                  </>
                )}
                {!payment.invoice && (
                  <div className="text-slate-500 italic">
                    Payment not allocated to an invoice.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <SecurityFooter
            type="ORIGINAL"
            reference={String(payment.id)}
            date={new Date().toISOString()}
            user="Admin User"
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
