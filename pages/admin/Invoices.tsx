import React, { useEffect, useMemo, useState } from "react";
import { FileText, CheckCircle, Clock, Eye, Plus } from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import Modal from "../../components/UI/Modal";
import { useToast } from "../../context/ToastContext";
import { DataTable, Column } from "../../components/UI/DataTable";
import useInvoice from "@/api/invoices/useInvoice";
import useAuth from "@/api/auth/useAuth";
import { AuthUser } from "@/api/types/auth";
import { Invoice } from "@/api/types/invoice";
import {
  Watermark,
  SecurityFooter,
  SecureHeader,
} from "../../components/UI/SecurityFeatures";

interface InvoiceRowData {
  id: string;
  client: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  original_id: number;
  currency: string;
}

interface PreviewData {
  user_id: number;
  user_full_name: string | undefined;
  user_email: string | undefined;
  due_date: string;
  currency: string;
  amount: number;
  notes: string;
  type: string;
}

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCreating: boolean;
  invoiceData: PreviewData | null;
  formatMoney: (amount: number) => string;
}

const InvoicePreviewModal: React.FC<InvoicePreviewProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isCreating,
  invoiceData,
  formatMoney,
}) => {
  if (!isOpen || !invoiceData) return null;

  const {
    user_full_name,
    user_email,
    due_date,
    currency,
    amount,
    notes,
    type,
  } = invoiceData;

  const currencySymbol = currency === "UGX" ? "UGX " : "$";
  const subtotal = amount;
  const tax = 0.0;
  const total = subtotal + tax;
  const description = notes || type;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Preview" size="xl">
      <div className="bg-white rounded-lg px-6 relative overflow-hidden">
        <Watermark text="PREVIEW" />
        <SecureHeader title="Commercial Invoice" />

        <div className="relative z-10">
          <div className="flex justify-between border-b border-slate-100 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">INVOICE</h1>
              <p className="text-slate-500 mt-1 font-mono">#DRAFT-001</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-slate-800">Shypt Logistics</h3>
              <p className="text-sm text-slate-500">Plot 12, Industrial Area</p>
              <p className="text-sm text-slate-500">Kampala, Uganda</p>
              <p className="text-sm text-slate-500">www.shypt.net</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                Bill To
              </p>
              <p className="font-bold text-slate-800">{user_full_name}</p>
              <p className="text-sm text-slate-500">{user_email}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Due Date
                </p>
                <p className="font-bold text-slate-800">
                  {new Date(due_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Amount Due
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {currencySymbol}
                  {formatMoney(total)}
                </p>
              </div>
            </div>
          </div>

          <table className="w-full text-left mb-6">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-md">Description</th>
                <th className="px-4 py-3 text-right rounded-r-md">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-slate-700">{description}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {currencySymbol}
                  {formatMoney(amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>
                  {currencySymbol}
                  {formatMoney(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax (0%)</span>
                <span>
                  {currencySymbol}
                  {formatMoney(tax)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
                <span>Total</span>
                <span>
                  {currencySymbol}
                  {formatMoney(total)}
                </span>
              </div>
            </div>
          </div>
          {/* <SecurityFooter
            type="DRAFT"
            reference={new Date().getTime().toString()}
          /> */}
        </div>
      </div>
      <div className="flex justify-end pt-3 bg-slate-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
        <button
          type="button"
          onClick={onClose}
          disabled={isCreating}
          className="px-4 py-2 border rounded text-slate-600 mr-2 bg-white hover:bg-slate-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isCreating}
          className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:bg-slate-500"
        >
          {isCreating ? "Saving..." : "Save and Send"}
        </button>
      </div>
    </Modal>
  );
};

const Invoices: React.FC = () => {
  const { showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const { listInvoices, createInvoice, addItemToInvoice, sendInvoiceByEmail } =
    useInvoice();
  const { fetchAllUsers } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRowData[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [currency, setCurrency] = useState<string>("USD");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const fetchInvoicesAndUsers = async () => {
    try {
      setIsLoadingInvoices(true);
      const invoicesResponse = await listInvoices();
      const mappedInvoices = invoicesResponse.data.map((inv: Invoice) => ({
        id: inv.invoice_number,
        client: inv.user?.full_name || "N/A",
        type: inv.type,
        amount: inv.line_items.reduce((acc, item) => acc + item.unit_price, 0),
        status: inv.status,
        date: new Date(inv.created_at).toLocaleDateString(),
        original_id: inv.id,
        currency: inv.currency || "USD", // Populate currency, default to USD if null
      }));
      setInvoices(mappedInvoices);

      const users = await fetchAllUsers();
      setUsersList(users.data);
    } catch (error) {
      showToast("Failed to fetch initial data", "error");
      console.error(error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoicesAndUsers();
  }, []);

  // Helper to simulate navigation
  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const handlePreview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const userId = parseInt(formData.get("client") as string);
    const user = usersList.find((u) => u.id === userId);
    const currency = formData.get("currency") as string;
    const type = formData.get("type") as string;

    if (!userId || !type || !amount || !currency) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    const data: PreviewData = {
      user_id: userId,
      user_full_name: user?.full_name,
      user_email: user?.email,
      type: type,
      amount: amount,
      notes: formData.get("notes") as string,
      currency: currency,
      due_date: new Date().toISOString().split("T")[0],
    };

    setPreviewData(data);
    setIsPreviewOpen(true);
    setIsCreateOpen(false);
  };

  const handleConfirmCreate = async () => {
    if (!previewData) return;

    setIsCreating(true);
    try {
      const invoiceResponse = await createInvoice({
        user_id: previewData.user_id,
        type: previewData.type,
        due_date: previewData.due_date,
        currency: previewData.currency,
      });

      // @ts-ignore
      const newInvoice = invoiceResponse.data;

      await addItemToInvoice({
        invoice_id: newInvoice.id,
        description: previewData.notes || previewData.type,
        quantity: 1,
        unit_price: previewData.amount,
      });

      try {
        await sendInvoiceByEmail(newInvoice.id);
        showToast("Invoice Generated and Sent to Client", "success");
      } catch (emailError) {
        console.error("Failed to send invoice email", emailError);
        showToast("Invoice generated, but failed to send email.", "warning");
      }

      await fetchInvoicesAndUsers();

      setIsPreviewOpen(false);
      setPreviewData(null);
    } catch (error) {
      console.error("Failed to create invoice", error);
      showToast("Failed to create invoice. Please try again.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const columns: Column<InvoiceRowData>[] = [
    {
      header: "Invoice #",
      accessor: (inv) => (
        <span className="font-medium text-primary-600 hover:underline">
          {inv.id}
        </span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Client",
      accessor: "client",
      sortable: true,
    },
    {
      header: "Type",
      accessor: "type",
      sortable: true,
      className: "text-xs font-bold text-slate-500",
    },
    {
      header: "Amount",
      accessor: (inv) => {
        const symbol = inv.currency === "UGX" ? "UGX " : "$";
        return `${symbol}${formatMoney(inv.amount)}`;
      },
      sortKey: "amount",
      sortable: true,
      className: "font-medium text-slate-900",
    },
    {
      header: "Status",
      accessor: (inv) => <StatusBadge status={inv.status} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Date",
      accessor: "date",
      sortable: true,
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (inv) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerNav(`/admin/invoices/${inv.original_id}`);
          }}
          className="text-slate-400 hover:text-primary-600 transition p-2"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  const { usdOutstanding, ugxOutstanding } = useMemo(() => {
    let usd = 0;
    let ugx = 0;
    invoices
      .filter((i) => i.status === "UNPAID")
      .forEach((i) => {
        if (i.currency === "UGX") {
          ugx += i.amount;
        } else {
          usd += i.amount;
        }
      });
    return { usdOutstanding: usd, ugxOutstanding: ugx };
  }, [invoices]);

  if (isLoadingInvoices) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-8 w-8 text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="ml-3 text-slate-500">Loading invoices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financials</h2>
          <p className="text-slate-500 text-sm">
            Manage invoices and verify payments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usdOutstanding > 0 && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm font-medium">
              Total Outstanding (USD)
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              ${formatMoney(usdOutstanding)}
            </p>
          </div>
        )}
        {ugxOutstanding > 0 && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm font-medium">
              Total Outstanding (UGX)
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              UGX {formatMoney(ugxOutstanding)}
            </p>
          </div>
        )}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">
            Pending Verification
          </p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {invoices.filter((i) => i.status === "PENDING").length} Invoices
          </p>
        </div>
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        onRowClick={(inv) => triggerNav(`/admin/invoices/${inv.original_id}`)}
        title="Invoice History"
        searchPlaceholder="Search Invoices..."
        primaryAction={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Generate Invoice
          </button>
        }
      />

      {/* CREATE INVOICE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate New Invoice"
      >
        <form onSubmit={handlePreview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Select Client
            </label>
            <select
              name="client"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            >
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Invoice Type
            </label>
            <select
              name="type"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            >
              <option value="FREIGHT">Freight Charges</option>
              <option value="OTHER">Assisted Shopping</option>
              <option value="STORAGE">Storage Fee</option>
              <option value="CUSTOMS">Customs Duty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Amount
            </label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Currency
            </label>
            <select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            >
              <option value="USD">USD</option>
              <option value="UGX">UGX</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description / Notes
            </label>
            <textarea
              name="notes"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
              rows={3}
            ></textarea>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border rounded text-slate-600 mr-2 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:bg-slate-500"
            >
              Preview Invoice
            </button>
          </div>
        </form>
      </Modal>

      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setIsCreateOpen(true);
        }}
        onConfirm={handleConfirmCreate}
        isCreating={isCreating}
        invoiceData={previewData}
        formatMoney={formatMoney}
      />
    </div>
  );
};

export default Invoices;
