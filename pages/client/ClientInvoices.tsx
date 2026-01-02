import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  CreditCard,
  Download,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useInvoice from "@/api/invoices/useInvoice";
import { Invoice as ApiInvoice, LineItem } from "@/api/types/invoice";

interface ClientInvoiceRowData {
  id: string;
  date: string;
  desc: string;
  amount: number;
  status: string;
  dueDate: string;
  original_id: number;
}

const ClientInvoices: React.FC = () => {
  const { showToast } = useToast();
  const { listInvoices } = useInvoice();
  const [invoices, setInvoices] = useState<ClientInvoiceRowData[]>([]);
  const [loading, setLoading] = useState(true);

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await listInvoices();

        const description = (inv: ApiInvoice) => {
          // @ts-ignore
          if (inv.order) return `Order #${inv.order.order_code}`;
          if (inv.line_items.length > 0) return inv.line_items[0].description;
          return inv.type.replace(/_/g, " ");
        };

        const calculateTotalAmount = (lineItems: LineItem[]) => {
          return lineItems.reduce((acc, item) => acc + Number(item.total), 0);
        };

        const mappedInvoices = response.data.map((inv) => ({
          id: inv.invoice_number,
          date: new Date(inv.created_at).toLocaleDateString(),
          desc: description(inv),
          amount: calculateTotalAmount(inv.line_items),
          status: inv.status,
          dueDate: new Date(inv.due_date).toLocaleDateString(),
          original_id: inv.id,
        }));
        setInvoices(mappedInvoices);
      } catch (error) {
        showToast("Failed to fetch invoices", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [showToast]);

  const totalDue = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "PENDING")
        .reduce((acc, curr) => acc + curr.amount, 0),
    [invoices]
  );
  const lifetimePaid = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "PAID")
        .reduce((acc, curr) => acc + curr.amount, 0),
    [invoices]
  );

  const columns: Column<ClientInvoiceRowData>[] = [
    {
      header: "Invoice #",
      accessor: (i) => (
        <span className="font-mono font-medium text-slate-700">{i.id}</span>
      ),
      sortKey: "id",
      sortable: true,
    },
    {
      header: "Date",
      accessor: "date",
      sortable: true,
      className: "text-slate-500 text-sm",
    },
    {
      header: "Description",
      accessor: "desc",
      className: "font-medium text-slate-800",
    },
    {
      header: "Due Date",
      accessor: (i) => (
        <span
          className={
            i.status === "PENDING"
              ? "text-orange-600 font-medium"
              : "text-slate-500"
          }
        >
          {i.dueDate}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Status",
      accessor: (i) => <StatusBadge status={i.status.toUpperCase()} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Amount",
      accessor: (i) => `$${i.amount.toFixed(2)}`,
      className: "font-bold text-right text-slate-900",
    },
    {
      header: "",
      className: "text-right",
      accessor: (i) =>
        i.status === "PENDING" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerNav(`/client/invoices/${i.original_id}`);
            }}
            className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs hover:bg-primary-700 shadow-sm flex items-center ml-auto font-medium transition"
          >
            <CreditCard size={12} className="mr-1.5" /> Pay Now
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-slate-400 hover:text-slate-600 ml-auto block p-1 border border-transparent hover:border-slate-200 rounded"
            title="Download Receipt"
          >
            <Download size={16} />
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Invoices</h2>
          <p className="text-slate-500 text-sm">
            View statement and pay outstanding bills.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-red-50 to-white p-6 rounded-lg shadow-sm border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center">
              <Clock size={12} className="mr-1" /> Outstanding Balance
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              ${totalDue.toFixed(2)}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {invoices.filter((i) => i.status === "PENDING").length} Unpaid
              Invoices
            </p>
          </div>
          <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-white p-6 rounded-lg shadow-sm border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center">
              <TrendingUp size={12} className="mr-1" /> Paid (Lifetime)
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              ${lifetimePaid.toFixed(2)}
            </p>
            <p className="text-slate-500 text-xs mt-1">All time payments</p>
          </div>
          <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      <DataTable
        data={invoices}
        columns={columns}
        onRowClick={(i) => triggerNav(`/client/invoices/${i.original_id}`)}
        title="Transaction History"
        // @ts-ignore
        isLoading={loading}
      />
    </div>
  );
};

export default ClientInvoices;
