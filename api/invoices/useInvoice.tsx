import client from "..";
import {
  Invoice,
  PaginatedInvoicesResponse,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  AddItemToInvoicePayload,
  LineItem,
  UpdateInvoiceItemPayload,
  RecordPaymentPayload,
  Payment,
  MessageResponse,
} from "../types/invoice";

const useInvoice = () => {
  const listInvoices = async (): Promise<PaginatedInvoicesResponse> => {
    const { data } = await client.get(`/api/billing/invoices`);
    return data;
  };

  const createInvoice = async (
    payload: CreateInvoicePayload
  ): Promise<Invoice> => {
    const { data } = await client.post(`/api/billing/invoices`, payload);
    return data;
  };

  const showInvoice = async (invoiceId: number): Promise<Invoice> => {
    const { data } = await client.get(`/api/billing/invoices/${invoiceId}`);
    return data;
  };

  const updateInvoice = async (
    invoiceId: number,
    payload: UpdateInvoicePayload
  ): Promise<Invoice> => {
    const { data } = await client.put(
      `/api/billing/invoices/${invoiceId}`,
      payload
    );
    return data;
  };

  const deleteInvoice = async (invoiceId: number): Promise<MessageResponse> => {
    const { data } = await client.delete(`/api/billing/invoices/${invoiceId}`);
    return data;
  };

  const restoreInvoice = async (
    invoiceId: number
  ): Promise<MessageResponse> => {
    const { data } = await client.post(
      `/api/billing/invoices/${invoiceId}/restore`
    );
    return data;
  };

  const sendInvoiceByEmail = async (
    invoiceId: number
  ): Promise<MessageResponse> => {
    const { data } = await client.get(`/api/billing/send_invoice/${invoiceId}`);
    return data;
  };

  const addItemToInvoice = async (
    payload: AddItemToInvoicePayload
  ): Promise<LineItem> => {
    const { data } = await client.post(
      `/api/billing/invoice-line-items`,
      payload
    );
    return data;
  };

  const updateInvoiceItem = async (
    itemId: number,
    payload: UpdateInvoiceItemPayload
  ): Promise<LineItem> => {
    const { data } = await client.put(
      `/api/billing/invoice-line-items/${itemId}`,
      payload
    );
    return data;
  };

  const deleteInvoiceItem = async (
    itemId: number
  ): Promise<MessageResponse> => {
    const { data } = await client.delete(
      `/api/billing/invoice-line-items/${itemId}`
    );
    return data;
  };

  const restoreInvoiceItem = async (
    itemId: number
  ): Promise<MessageResponse> => {
    const { data } = await client.post(
      `/api/billing/invoice-line-items/${itemId}/restore`
    );
    return data;
  };

  const recordInvoicePayment = async (
    payload: RecordPaymentPayload
  ): Promise<Payment> => {
    const { data } = await client.post(`/api/billing/payments`, payload);
    return data;
  };

  const deleteInvoicePayment = async (
    paymentId: number
  ): Promise<MessageResponse> => {
    const { data } = await client.delete(`/api/billing/payments/${paymentId}`);
    return data;
  };

  return {
    listInvoices,
    createInvoice,
    showInvoice,
    updateInvoice,
    deleteInvoice,
    restoreInvoice,
    sendInvoiceByEmail,
    addItemToInvoice,
    updateInvoiceItem,
    deleteInvoiceItem,
    restoreInvoiceItem,
    recordInvoicePayment,
    deleteInvoicePayment,
  };
};

export default useInvoice;
