import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  FileText,
  ExternalLink,
} from "lucide-react";
import Modal from "@/components/UI/Modal";
import useDocumentCenter from "@/api/documentCenter/useDocumentCenter";
import { Document } from "@/api/types/documentCenter";

const AdminDocumentCenter: React.FC = () => {
  const { listDocuments, createDocument, updateDocument, deleteDocument } =
    useDocumentCenter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError("Failed to fetch documents.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openAddModal = () => {
    setEditingDocument(null);
    setName("");
    setDescription("");
    setFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (doc: Document) => {
    setEditingDocument(doc);
    setName(doc.name);
    setDescription(doc.description);
    setFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      alert("Name and description are required.");
      return;
    }

    if (!editingDocument && !file) {
      alert("Please select a file to upload for a new document.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingDocument) {
        await updateDocument(editingDocument.id, {
          name,
          description,
          file: file || undefined,
        });
      } else if (file) {
        await createDocument({ name, description, file });
      }
      closeModal();
      await fetchDocuments();
    } catch (err) {
      setError(
        editingDocument
          ? "Failed to update document."
          : "Failed to create document.",
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      setError(null);
      try {
        await deleteDocument(id);
        await fetchDocuments();
      } catch (err) {
        setError("Failed to delete document.");
        console.error(err);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Admin Document Center
          </h1>
          <p className="text-gray-600 mt-2">
            Manage legal documents and policies for clients.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
        >
          <Plus size={20} className="mr-2" /> Add Document
        </button>
      </div>

      {error && !isModalOpen && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10">
          <p>Loading documents...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="p-4 md:p-6 flex justify-between items-center hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-gray-400 mr-4 flex-shrink-0" />
                    <div>
                      <p className="text-md font-semibold text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {doc.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <a
                    href={`${import.meta.env.VITE_API_URL}/storage/${doc.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title="View Document"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => openEditModal(doc)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Document"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDocument ? "Edit Document" : "Add New Document"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {error && isModalOpen && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <div>
            <label
              htmlFor="doc-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Document Name
            </label>
            <input
              type="text"
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Terms of Service"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="doc-desc"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Short Description
            </label>
            <textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="A brief summary of the document's content."
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editingDocument ? "Re-upload Document" : "Upload Document"}
            </label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        setFile(e.target.files ? e.target.files[0] : null)
                      }
                      disabled={isSubmitting}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 10MB</p>
                {file && (
                  <p className="text-sm text-gray-700 mt-2">
                    Selected: {file.name}
                  </p>
                )}
                {editingDocument && !file && (
                  <p className="text-sm text-gray-500 mt-2">
                    Current file:{" "}
                    <a
                      href={editingDocument.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {editingDocument.file_url.split("/").pop()}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingDocument
                  ? "Save Changes"
                  : "Add Document"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDocumentCenter;
