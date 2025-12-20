import React, { useState } from "react";
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
} from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import { useToast } from "../../context/ToastContext";
import {
  Watermark,
  SecureHeader,
  SecurityFooter,
} from "../../components/UI/SecurityFeatures";
import Modal from "../../components/UI/Modal";

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

  const [request, setRequest] = useState({
    id: requestId,
    status: requestId === "REQ-2025-005" ? "PURCHASED" : "REQUESTED",
    date: "2025-03-01",
    client: {
      name: "John Doe",
      id: "CL-8821",
      email: "john@example.com",
      phone: "+256 772 123456",
    },
    item: {
      name: "MacBook Pro 14-inch (M4 Pro)",
      url: "https://apple.com/shop/buy-mac/macbook-pro/14-inch-m4-pro",
      description: "Space Black, 1TB SSD, 18GB RAM",
      qty: 1,
    },
    quote: { cost: 2399.0, ship: 0.0, fee: 239.9, total: 2638.9 },
    procurement: {
      retailerRef: requestId === "REQ-2025-005" ? "AMZN-99122-11" : "",
      carrier: requestId === "REQ-2025-005" ? "UPS" : "",
      tracking: requestId === "REQ-2025-005" ? "1Z998122X" : "",
    },
    timeline: [{ date: "2025-03-01 10:30", event: "Request Logged" }],
  });

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
              {request.id}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={request.status} />
              <span className="text-xs text-slate-400">
                • Created {request.date}
              </span>
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
          {request.status === "PAID" && (
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
            <Watermark text={request.status} />
            <SecureHeader title="Procurement Summary" />
            <div className="relative z-10">
              <div className="grid grid-cols-2 gap-12 mb-10 pb-8 border-b border-slate-100 print:border-slate-800">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    Consignee
                  </p>
                  <p className="font-bold text-slate-900">
                    {request.client.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {request.client.email}
                  </p>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    ID: {request.client.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    Item details
                  </p>
                  <p className="font-bold text-slate-900 text-lg">
                    {request.item.name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {request.item.description}
                  </p>
                </div>
              </div>

              {request.status === "PURCHASED" && (
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
                        {request.procurement.retailerRef}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Carrier
                      </p>
                      <p className="text-sm font-bold">
                        {request.procurement.carrier}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Origin Tracking
                      </p>
                      <p className="font-mono text-sm font-bold text-green-400">
                        {request.procurement.tracking}
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
                  <div className="flex justify-between">
                    <span>Base Item Cost</span>
                    <span className="font-mono">
                      ${request.quote.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domestic Shipping</span>
                    <span className="font-mono">
                      ${request.quote.ship.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-primary-600 font-bold">
                    <span>WOFMS Service Fee (10%)</span>
                    <span className="font-mono">
                      ${request.quote.fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-xl text-slate-900 border-t border-slate-200 pt-4 mt-2 print:border-slate-800">
                    <span>TOTAL COLLECTED</span>
                    <span>${request.quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="hidden print:block">
                <SecurityFooter type="ORIGINAL" reference={request.id} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
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
    </div>
  );
};

export default ShoppingDetails;
