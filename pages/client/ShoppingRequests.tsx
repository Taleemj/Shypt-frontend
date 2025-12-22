import React, { useState, useEffect } from "react";
import { ShoppingBag, Plus, ExternalLink, DollarSign } from "lucide-react";
import { DataTable, Column } from "../../components/UI/DataTable";
import Modal from "../../components/UI/Modal";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import useAssistedShopping from "../../api/assistedShopping/useAssistedShopping";
import {
  AssistedShoppingItem,
  AddAssistedShoppingPayload,
} from "../../api/types/assistedShopping";

const ShoppingRequests: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { listAssistedShoppingRequests, addAssistedShopping } =
    useAssistedShopping();
  const [requests, setRequests] = useState<AssistedShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerNav = (path: string) => {
    window.dispatchEvent(new CustomEvent("app-navigate", { detail: path }));
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listAssistedShoppingRequests();
      setRequests(response.data.data);
    } catch (err) {
      setError("Failed to fetch shopping requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: AddAssistedShoppingPayload = {
      name: fd.get("item") as string,
      url: fd.get("url") as string,
      quantity: parseInt(fd.get("quantity") as string, 10),
      notes: fd.get("notes") as string,
    };

    try {
      await addAssistedShopping(payload);
      showToast("Request submitted! We will send a quote shortly.", "success");
      setIsModalOpen(false);
      form.reset();
      await fetchRequests();
    } catch (error) {
      showToast("Failed to submit request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptQuote = (
    e: React.MouseEvent,
    req: AssistedShoppingItem
  ) => {
    e.stopPropagation(); // Prevent row click
    // Simulate payment flow
    showToast(
      `Quote for ${req.name} accepted. Redirecting to payment...`,
      "info"
    );
    triggerNav(`/client/shopping/${req.id}`);
  };

  const columns: Column<AssistedShoppingItem>[] = [
    {
      header: "ID",
      accessor: (r) => `REQ-${r.id}`,
      sortKey: "id",
      sortable: true,
      className: "font-mono text-xs",
    },
    {
      header: "Item",
      accessor: (r) => (
        <div>
          <div className="font-bold text-slate-800">{r.name}</div>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline flex items-center"
          >
            Link <ExternalLink size={10} className="ml-1" />
          </a>
        </div>
      ),
      sortKey: "name",
      sortable: true,
    },
    {
      header: "Date",
      accessor: (r) => new Date(r.created_at).toLocaleDateString(),
      sortKey: "created_at",
      sortable: true,
    },
    {
      header: "Status",
      accessor: (r) => <StatusBadge status={r.status.toUpperCase()} />,
      sortKey: "status",
      sortable: true,
    },
    {
      header: "Quote",
      accessor: (r) => {
        const quoteAmount = r.quote_items?.reduce(
          (acc, q) => acc + q.unit_price * q.quantity,
          0
        );
        return quoteAmount ? `$${quoteAmount.toFixed(2)}` : "-";
      },
      className: "text-right font-medium",
    },
    {
      header: "Action",
      className: "text-right",
      accessor: (r) =>
        r.status === "quoted" ? (
          <button
            onClick={(e) => handleAcceptQuote(e, r)}
            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 shadow-sm"
          >
            Accept & Pay
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Shop For Me</h2>
          <p className="text-slate-500 text-sm">
            We buy from international stores for you.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center text-sm font-medium shadow-sm"
        >
          <Plus size={16} className="mr-2" /> New Request
        </button>
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
          onRowClick={(r) => triggerNav(`/client/shopping/${r.id}`)}
          title="My Requests"
          searchPlaceholder="Search items..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Shopping Request"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Item Name
            </label>
            <input
              name="item"
              required
              className="w-full border border-slate-300 rounded p-2 mt-1 bg-white text-slate-900"
              placeholder="e.g. MacBook Pro M3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Store URL (Link)
            </label>
            <input
              name="url"
              type="url"
              required
              className="w-full border border-slate-300 rounded p-2 mt-1 bg-white text-slate-900"
              placeholder="https://amazon.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Quantity
            </label>
            <input
              name="quantity"
              type="number"
              defaultValue={1}
              min={1}
              className="w-full border border-slate-300 rounded p-2 mt-1 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Options / Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              className="w-full border border-slate-300 rounded p-2 mt-1 bg-white text-slate-900"
              placeholder="Size: M, Color: Black..."
            ></textarea>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 flex items-center justify-center w-40 disabled:bg-primary-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShoppingRequests;
