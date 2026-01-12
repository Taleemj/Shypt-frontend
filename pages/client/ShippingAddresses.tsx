import React, { useEffect, useState } from "react";
import { WareHouseLocation } from "@/api/types/warehouse";
import useWareHouse from "@/api/warehouse/useWareHouse";
import { Map, Copy } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useAuthContext } from "@/context/AuthContext";

const ShippingAddresses: React.FC = () => {
  const [locations, setLocations] = useState<WareHouseLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { fetchWareHouseLocations } = useWareHouse();
  const { showToast } = useToast();
  const { user } = useAuthContext();

  useEffect(() => {
    const getLocations = async () => {
      try {
        setLoading(true);
        const res = await fetchWareHouseLocations();
        setLocations(res.data);
      } catch (error) {
        console.error("Error fetching warehouse locations:", error);
        showToast("Error fetching addresses", "error");
      } finally {
        setLoading(false);
      }
    };
    getLocations();
  }, []);

  const handleCopyField = (fieldValue: string) => {
    navigator.clipboard.writeText(fieldValue);
    showToast("Copied to clipboard", "success");
  };

  const handleCopyAddress = (location: WareHouseLocation) => {
    const addressString = `
Address 1: ${location.address}
Address 2: N/A
City: N/A
State: N/A
Zip Code: N/A`;
    navigator.clipboard.writeText(addressString);
    showToast("Address copied to clipboard", "success");
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Our Warehouse Addresses
      </h1>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Use these addresses for your shipments. Please ensure you include your
        unique identifier in the address when shipping packages to our
        warehouses.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg shadow-md animate-pulse"
            >
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => {
            const address1Value = location.address || "N/A";
            const address2Value = "N/A";
            const cityValue = "N/A";
            const stateValue = "N/A";
            const zipCodeValue = "N/A";

            return (
              <div
                key={location.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <Map className="w-8 h-8 text-primary-500 mr-4" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {location.name}
                    </h2>
                    <p className="text-sm text-slate-500">{location.country}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-700 mb-4">
                  <div className="flex items-center">
                    <p className="w-24 font-semibold text-slate-500">
                      Address 1
                    </p>
                    <p className="flex-1">{address1Value}</p>
                    <button
                      onClick={() => handleCopyField(address1Value)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <p className="w-24 font-semibold text-slate-500">
                      Address 2
                    </p>
                    <p className="flex-1">{address2Value}</p>
                    <button
                      onClick={() => handleCopyField(address2Value)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <p className="w-24 font-semibold text-slate-500">City</p>
                    <p className="flex-1">{cityValue}</p>
                    <button
                      onClick={() => handleCopyField(cityValue)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <p className="w-24 font-semibold text-slate-500">State</p>
                    <p className="flex-1">{stateValue}</p>
                    <button
                      onClick={() => handleCopyField(stateValue)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <p className="w-24 font-semibold text-slate-500">
                      Zip Code
                    </p>
                    <p className="flex-1">{zipCodeValue}</p>
                    <button
                      onClick={() => handleCopyField(zipCodeValue)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyAddress(location)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm"
                >
                  <Copy size={16} className="mr-2" />
                  Copy Full Address
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShippingAddresses;
