import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Send, Paperclip, X } from "lucide-react";
import StatusBadge from "../../components/UI/StatusBadge";
import useSupportTickets from "../../api/supportTickets/useSupportTickets";
import { SupportTicket, TicketMessage } from "../../api/types/supportTickets";
import { timeAgo } from "../../utils/timeAgo";
import { useToast } from "../../context/ToastContext";
import { useAuthContext } from "@/context/AuthContext";
import Modal from "../../components/UI/Modal";

interface TicketDetailsProps {
  id: string;
  onBack: () => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ id, onBack }) => {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const { displaySupportTicket, sendReply, updateTicketStatus } =
    useSupportTickets();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicket = async () => {
    try {
      const data = await displaySupportTicket(id);
      setTicket(data);
    } catch (error) {
      console.error("Failed to fetch ticket details", error);
      showToast("Failed to load ticket details.", "error");
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      const newMessage = await sendReply(id, { message: replyMessage });
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: [...(prev.messages || []), newMessage],
            }
          : null,
      );
      setReplyMessage("");
    } catch (error) {
      console.error("Failed to send reply", error);
      showToast("Failed to send reply. Please try again.", "error");
    }
  };

  const handleCloseTicket = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmCloseTicket = async () => {
    try {
      const updatedTicket = await updateTicketStatus(id, "closed");
      setTicket(updatedTicket);
      showToast("Ticket has been closed.", "success");
      setIsConfirmModalOpen(false); // Close the modal
    } catch (error) {
      console.error("Failed to close ticket", error);
      showToast("Failed to close ticket. Please try again.", "error");
      setIsConfirmModalOpen(false); // Close the modal even if there's an error
    }
  };

  if (!ticket) {
    return <div>Loading...</div>;
  }

  const currentUserId = user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {ticket.subject}{" "}
              <span className="text-sm font-normal text-slate-500 ml-2">
                #{ticket.id}
              </span>
            </h2>
            <div className="mt-1">
              <StatusBadge status={ticket.status.toUpperCase()} />
            </div>
          </div>
        </div>
        {ticket.status === "open" && (
          <button
            onClick={handleCloseTicket}
            className="flex items-center bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
          >
            <X size={14} className="mr-1" />
            Close Ticket
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {ticket.messages?.map((msg) => {
            const isClientMessage = msg.user_id === ticket.user_id;
            const isMyMessage = msg.user_id === currentUserId;

            const senderName = isClientMessage
              ? msg.user?.full_name || "Client"
              : `${msg.user?.full_name || "Support"} (Support)`;
            const alignmentClass = isClientMessage ? "" : "flex-row-reverse";
            const messageBgClass = isClientMessage
              ? "bg-slate-100 text-slate-800 rounded-r-lg rounded-bl-lg"
              : "bg-blue-600 text-white rounded-l-lg rounded-br-lg";
            const nameAlignmentClass = isClientMessage ? "" : "justify-end";
            const avatarBgClass = isClientMessage
              ? "bg-slate-200"
              : "bg-blue-600 text-white";

            return (
              <div key={msg.id} className={`flex gap-4 ${alignmentClass}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${avatarBgClass}`}
                >
                  {msg.user ? (
                    msg.user.full_name.charAt(0).toUpperCase()
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className={isClientMessage ? "text-left" : "text-right"}>
                  <div
                    className={`flex items-baseline mb-1 ${nameAlignmentClass}`}
                  >
                    <span className="font-bold text-slate-800 mr-2">
                      {senderName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {timeAgo(msg.created_at)}
                    </span>
                  </div>
                  <div className={`p-4 text-sm max-w-lg ${messageBgClass}`}>
                    <p>{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {ticket.status === "open" && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
            <div className="flex items-center gap-2">
              {/* <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full">
                <Paperclip size={20} />
              </button> */}
              <input
                type="text"
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleReply()}
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 bg-white"
              />
              <button
                onClick={handleReply}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Close Ticket"
      >
        <div className="p-4">
          <p className="text-sm text-slate-700 mb-4">
            Are you sure you want to close this ticket? You will not be able to
            send further messages once the ticket is closed.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 bg-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmCloseTicket}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Close Ticket
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketDetails;
