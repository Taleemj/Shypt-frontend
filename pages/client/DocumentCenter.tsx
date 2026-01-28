import React, { useState, useEffect } from "react";
import { FileText, ExternalLink } from "lucide-react";
import useDocumentCenter from "@/api/documentCenter/useDocumentCenter";
import { Document } from "@/api/types/documentCenter";

const DocumentCenter: React.FC = () => {
  const { listDocuments } = useDocumentCenter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listDocuments();
        setDocuments(response.data);
      } catch (err) {
        setError("Failed to load documents. Please try again later.");
        console.error("Error fetching documents:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Document Center</h1>
        <p className="text-gray-600 mt-2">
          Access important documents, policies, and terms related to our
          services.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading documents...</p>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No documents available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={`${import.meta.env.VITE_API_URL}/storage/${doc.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-primary-500 transition-all duration-300 group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-gray-400 group-hover:text-primary-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-700">
                    {doc.name} {/* Use name from API */}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {doc.description} {/* Use description from API */}
                  </p>
                </div>
                <div className="ml-2">
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
