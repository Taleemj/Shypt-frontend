import React, { useEffect, useState } from "react";
import { ShippingAddress } from "@/api/types/shippingAddress";
import useShippingAddress from "@/api/useShippingAddress/useShippingAddress";
import { Map, Copy, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useAuthContext } from "@/context/AuthContext";
import Modal from "@/components/UI/Modal";

const ShippingAddresses: React.FC = () => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { fetchShippingAddresses } = useShippingAddress();
  const { showToast } = useToast();
  const { user } = useAuthContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAddresses, setNewAddresses] = useState<Partial<ShippingAddress>[]>([
    {},
  ]);

  const getAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetchShippingAddresses();
      setAddresses(res.data);
    } catch (error) {
      console.error("Error fetching shipping addresses:", error);
      showToast("Error fetching addresses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAddresses();
  }, []);

  const handleCopyField = (fieldValue: string) => {
    navigator.clipboard.writeText(fieldValue);
    showToast("Copied to clipboard", "success");
  };

  const handleCopyAddress = (address: ShippingAddress) => {
    const addressString = `
Address 1: ${address.address_line1}
Address 2: ${address.address_line2 || "N/A"}
City: ${address.city}
State: ${address.state}
Zip Code: ${address.zip}`;
    navigator.clipboard.writeText(addressString);
    showToast("Address copied to clipboard", "success");
  };

  const handleAddressChange = (
    index: number,
    field: keyof ShippingAddress,
    value: string,
  ) => {
    const updatedAddresses = [...newAddresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
    setNewAddresses(updatedAddresses);
  };

  const addAddressForm = () => {
    setNewAddresses([
      ...newAddresses,
      { name: "", address_line1: "", city: "", state: "", zip: "" },
    ]);
  };

  const removeAddressForm = (index: number) => {
    const updatedAddresses = [...newAddresses];
    updatedAddresses.splice(index, 1);
    setNewAddresses(updatedAddresses);
  };

  const handleOpenModal = () => {
    setNewAddresses([
      { name: "", address_line1: "", city: "", state: "", zip: "" },
    ]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API not ready, so we just log and show a message
    console.log("New addresses to be submitted:", newAddresses);
    showToast("Submit functionality is not yet implemented.", "info");
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            My Shipping Addresses
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Manage your shipping addresses. You can use these addresses for your
            deliveries.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Address(es)
        </button>
      </div>

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
          {addresses.map((address) => {
            const address1Value = address.address_line1 || "N/A";
            const address2Value = address.address_line2 || "N/A";
            const cityValue = address.city || "N/A";
            const stateValue = address.state || "N/A";
            const zipCodeValue = address.zip || "N/A";
            const countryValue = "N/A";

            return (
              <div
                key={address.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <Map className="w-8 h-8 text-primary-500 mr-4" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {address.name}
                    </h2>
                    <p className="text-sm text-slate-500">{countryValue}</p>
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
                  onClick={() => handleCopyAddress(address)}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Shipping Address(es)"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
            {newAddresses.map((address, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 rounded-lg relative space-y-4"
              >
                {newAddresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddressForm(index)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Home, Office"
                      value={address.name || ""}
                      onChange={(e) =>
                        handleAddressChange(index, "name", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    placeholder="123 Main St"
                    value={address.address_line1 || ""}
                    onChange={(e) =>
                      handleAddressChange(
                        index,
                        "address_line1",
                        e.target.value,
                      )
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Apt, suite, etc."
                    value={address.address_line2 || ""}
                    onChange={(e) =>
                      handleAddressChange(
                        index,
                        "address_line2",
                        e.target.value,
                      )
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="New York"
                      value={address.city || ""}
                      onChange={(e) =>
                        handleAddressChange(index, "city", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="NY"
                      value={address.state || ""}
                      onChange={(e) =>
                        handleAddressChange(index, "state", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      placeholder="10001"
                      value={address.zip || ""}
                      onChange={(e) =>
                        handleAddressChange(index, "zip", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              type="button"
              onClick={addAddressForm}
              className="text-sm font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Another Address
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
                className="px-6 py-2 rounded-md text-sm font-bold bg-primary-600 text-white hover:bg-primary-700"
              >
                Save Addresses
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShippingAddresses;
