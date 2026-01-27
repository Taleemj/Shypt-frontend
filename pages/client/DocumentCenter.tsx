import React from "react";
import { FileText, ExternalLink } from "lucide-react";

interface DocumentLink {
  title: string;
  description: string;
  url: string;
}

const documents: DocumentLink[] = [
  {
    title: "Terms of Service",
    description: "Read our terms and conditions for using our services.",
    url: "/documents/terms-of-service.pdf", // Placeholder
  },
  {
    title: "Privacy Policy",
    description: "Learn how we collect, use, and protect your data.",
    url: "/documents/privacy-policy.pdf", // Placeholder
  },
  {
    title: "Restricted & Prohibited Items",
    description: "List of items that are not allowed for shipping.",
    url: "/documents/prohibited-items.pdf", // Placeholder
  },
  {
    title: "Shipping & Delivery Policy",
    description: "Details about our shipping process, timelines, and delivery.",
    url: "/documents/shipping-policy.pdf", // Placeholder
  },
  {
    title: "Insurance Policy",
    description: "Information about shipment insurance and claim process.",
    url: "/documents/insurance-policy.pdf", // Placeholder
  },
];

const DocumentCenter: React.FC = () => {
  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Document Center</h1>
        <p className="text-gray-600 mt-2">
          Access important documents, policies, and terms related to our
          services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, index) => (
          <a
            key={index}
            href={doc.url}
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
                  {doc.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{doc.description}</p>
              </div>
              <div className="ml-2">
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary-600 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default DocumentCenter;
