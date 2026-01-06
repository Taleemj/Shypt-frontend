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

const Invoices: React.FC = () => {
  const { showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const { listInvoices, createInvoice, addItemToInvoice } = useInvoice();
  const { fetchAllUsers } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRowData[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [currency, setCurrency] = useState<string>('USD');

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
        currency: inv.currency || 'USD', // Populate currency, default to USD if null
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

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      user_id: parseInt(formData.get("client") as string),
      type: formData.get("type") as string,
      amount: parseFloat(formData.get("amount") as string),
      notes: formData.get("notes") as string,
      currency: formData.get("currency") as string, // Add currency to payload
    };

    if (!payload.user_id || !payload.type || !payload.amount || !payload.currency) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setIsCreating(true);
    console.log(payload);
    try {
      const invoiceResponse = await createInvoice({
        user_id: payload.user_id,
        type: payload.type,
        due_date: new Date().toISOString().split("T")[0],
        currency: payload.currency, // Pass currency to createInvoice
      });

      // @ts-ignore
      const newInvoice = invoiceResponse.data;

      await addItemToInvoice({
        invoice_id: newInvoice.id,
        description: payload.notes || payload.type,
        quantity: 1,
        unit_price: payload.amount,
      });

      await fetchInvoicesAndUsers();

      showToast("Invoice Generated and Sent to Client", "success");
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Failed to create invoice", error);
      showToast("Failed to create invoice. Please try again.", "error");
    } finally {
      setIsCreating(false);
    }
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
        const symbol = inv.currency === 'UGX' ? 'UGX ' : '$';
        return `${symbol}${inv.amount.toFixed(2)}`;
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

  const outstandingAmount = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "UNPAID")
        .reduce((sum, i) => sum + i.amount, 0),
    [invoices]
  );

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
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">
            Total Outstanding
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            ${outstandingAmount.toFixed(2)}
          </p>
        </div>
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
        <form onSubmit={handleCreate} className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium text-slate-700">
              Client
            </label>
            <input
              name="client"
              required
              placeholder="Client Name or ID"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-900"
            />
          </div> */}
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
              {isCreating ? "Sending..." : "Send Invoice"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
