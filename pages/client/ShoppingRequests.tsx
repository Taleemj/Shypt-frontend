import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  ExternalLink,
  DollarSign,
  Trash2,
} from "lucide-react";
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

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequestForRejection, setSelectedRequestForRejection] =
    useState<AssistedShoppingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // State for multiple items in the modal
  const [items, setItems] = useState<Partial<AddAssistedShoppingPayload>[]>([
    { name: "", url: "", quantity: 1, notes: "" },
  ]);

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

  const handleOpenModal = () => {
    setItems([{ name: "", url: "", quantity: 1, notes: "" }]);
    setIsModalOpen(true);
  };

  const handleItemChange = (
    index: number,
    field: keyof AddAssistedShoppingPayload,
    value: string | number,
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const addItemForm = () => {
    setItems([...items, { name: "", url: "", quantity: 1, notes: "" }]);
  };

  const removeItemForm = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

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

  const handleRejectClick = (
    e: React.MouseEvent,
    req: AssistedShoppingItem,
  ) => {
    e.stopPropagation();
    setSelectedRequestForRejection(req);
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }
    setIsSubmittingRejection(true);

    console.log(
      `Rejecting quote for request ID: ${selectedRequestForRejection?.id} with reason: ${rejectionReason}`,
    );
    // API call to reject quote would go here, e.g.:
    // await rejectQuote(selectedRequestForRejection.id, rejectionReason);

    showToast("Quote has been rejected.", "success");

    setTimeout(() => {
      // Simulating API call
      setIsRejectModalOpen(false);
      setRejectionReason("");
      setIsSubmittingRejection(false);
      fetchRequests(); // Refresh data
    }, 500);
  };

  const formatUgx = (amount: number) => {
    return `UGX ${amount.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  };

  const handleAcceptQuote = (
    e: React.MouseEvent,
    req: AssistedShoppingItem,
  ) => {
    e.stopPropagation(); // Prevent row click
    // Simulate payment flow
    showToast(
      `Quote for ${req.name} accepted. Redirecting to payment...`,
      "info",
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
          0,
        );
        return quoteAmount ? formatUgx(quoteAmount) : "-";
      },
      className: "text-right font-medium",
    },
    {
      header: "Action",
      className: "text-right",
      accessor: (r) =>
        r.status === "quoted" ? (
          <div className="flex gap-2 justify-end">
            <button
              onClick={(e) => handleRejectClick(e, r)}
              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 shadow-sm"
            >
              Reject
            </button>
            <button
              onClick={(e) => handleAcceptQuote(e, r)}
              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 shadow-sm"
            >
              Accept & Pay
            </button>
          </div>
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
          onClick={handleOpenModal}
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
        title="New Shopping Request(s)"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 rounded-lg relative space-y-4"
              >
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemForm(index)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Item Name
                  </label>
                  <input
                    value={item.name}
                    onChange={(e) =>
                      handleItemChange(index, "name", e.target.value)
                    }
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
                    value={item.url}
                    onChange={(e) =>
                      handleItemChange(index, "url", e.target.value)
                    }
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
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value, 10),
                      )
                    }
                    type="number"
                    min={1}
                    className="w-full border border-slate-300 rounded p-2 mt-1 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Options / Notes
                  </label>
                  <textarea
                    value={item.notes}
                    onChange={(e) =>
                      handleItemChange(index, "notes", e.target.value)
                    }
                    rows={3}
                    className="w-full border border-slate-300 rounded p-2 mt-1 bg-white text-slate-900"
                    placeholder="Size: M, Color: Black..."
                  ></textarea>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              type="button"
              onClick={addItemForm}
              className="text-sm font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Another Item
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
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
                  "Submit Requests"
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={`Reject Quote for REQ-${selectedRequestForRejection?.id}`}
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

export default ShoppingRequests;
