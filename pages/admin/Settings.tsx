import React, { useState, useEffect } from 'react';
import { Save, Globe, Bell, Shield, Database, DollarSign, Mail, Server, Plus, Trash2, Edit, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/UI/Modal';
import useWareHouse from '@/api/warehouse/useWareHouse';
import { WareHouse, CreateWareHousePayload, UpdateWareHousePayload } from '@/api/types/warehouse';

const INITIAL_NEW_WAREHOUSE_DATA: CreateWareHousePayload = {
  code: '',
  zone: '',
  rack: '',
  bay: '',
  shelf: '',
};

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const { fetchWareHouses, createWareHouse, updateWareHouse, deleteWareHouse } = useWareHouse();

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'WAREHOUSES' | 'NOTIFICATIONS' | 'SECURITY' | 'HS_CODES'>('GENERAL');

  // --- STATE ---
  const [exchangeRate, setExchangeRate] = useState('3850');
  const [buffer, setBuffer] = useState('5'); // 5% Buffer
  const [companyName, setCompanyName] = useState('Shypt Logistics');
  const [warehouses, setWarehouses] = useState<WareHouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  
  const [staff, setStaff] = useState([
     { id: 1, name: 'Admin User', role: 'Super Admin', access: 'Full' },
     { id: 2, name: 'Warehouse Mgr', role: 'Staff', access: 'Restricted' }
  ]);

  // Modal States
  const [modalType, setModalType] = useState<'WAREHOUSE_ADD' | 'WAREHOUSE_EDIT' | 'WAREHOUSE_DELETE' | 'STAFF' | 'TEMPLATE' | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WareHouse | UpdateWareHousePayload | null>(null);
  const [newWarehouseData, setNewWarehouseData] = useState<CreateWareHousePayload>(INITIAL_NEW_WAREHOUSE_DATA);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // --- DATA FETCHING ---
  const loadWarehouses = () => {
    setIsLoadingWarehouses(true);
    fetchWareHouses()
      .then(res => setWarehouses(res.data))
      .catch(err => showToast(err.message || 'Failed to fetch warehouses', 'error'))
      .finally(() => setIsLoadingWarehouses(false));
  };

  useEffect(() => {
    if (activeTab === 'WAREHOUSES') {
      loadWarehouses();
    }
  }, [activeTab]);

  // Auto-generate warehouse code for ADD modal
  useEffect(() => {
    if (modalType === 'WAREHOUSE_ADD') {
      const { zone, rack, bay, shelf } = newWarehouseData;
      if (zone || rack || bay || shelf) {
        const parts = [zone, rack, bay, shelf];
        setNewWarehouseData(prev => ({
          ...prev,
          code: parts.filter(Boolean).join('-').toUpperCase()
        }));
      }
    }
  }, [newWarehouseData.zone, newWarehouseData.rack, newWarehouseData.bay, newWarehouseData.shelf, modalType]);
  
  // Auto-generate warehouse code for EDIT modal
  useEffect(() => {
    if (modalType === 'WAREHOUSE_EDIT' && selectedWarehouse) {
      const { zone, rack, bay, shelf } = selectedWarehouse as UpdateWareHousePayload;
       if (zone || rack || bay || shelf) {
        const parts = [zone, rack, bay, shelf];
        setSelectedWarehouse(prev => ({
          ...prev!,
          code: parts.filter(Boolean).join('-').toUpperCase()
        }));
      }
    }
  }, [
    (selectedWarehouse as UpdateWareHousePayload)?.zone, 
    (selectedWarehouse as UpdateWareHousePayload)?.rack, 
    (selectedWarehouse as UpdateWareHousePayload)?.bay, 
    (selectedWarehouse as UpdateWareHousePayload)?.shelf, 
    modalType
  ]);


  // --- HANDLERS ---
  const handleSaveGlobal = () => {
    showToast('System configuration saved successfully', 'success');
  };

  const handleAddWarehouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newWarehouseData.code || !newWarehouseData.zone || !newWarehouseData.rack || !newWarehouseData.bay || !newWarehouseData.shelf) {
      showToast('All fields are required.', 'error');
      return;
    }
    try {
        await createWareHouse(newWarehouseData);
        showToast('New Warehouse Location Added', 'success');
        loadWarehouses();
        setModalType(null);
    } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to add warehouse', 'error');
    }
  };

  const handleUpdateWarehouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWarehouse || !('id' in selectedWarehouse)) return;

    const payload: UpdateWareHousePayload = {
      code: selectedWarehouse.code,
      zone: selectedWarehouse.zone,
      rack: selectedWarehouse.rack,
      bay: selectedWarehouse.bay,
      shelf: selectedWarehouse.shelf
    };

    try {
        await updateWareHouse(selectedWarehouse.id, payload);
        showToast('Warehouse Location Updated', 'success');
        loadWarehouses();
        setModalType(null);
    } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to update warehouse', 'error');
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!selectedWarehouse || !('id' in selectedWarehouse)) return;

    try {
        await deleteWareHouse(selectedWarehouse.id);
        showToast('Warehouse Location Deleted', 'success');
        loadWarehouses();
        setModalType(null);
    } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to delete warehouse', 'error');
    }
  };

  const openAddModal = () => {
    setNewWarehouseData(INITIAL_NEW_WAREHOUSE_DATA);
    setModalType('WAREHOUSE_ADD');
  };

  const openEditModal = (warehouse: WareHouse) => {
    setSelectedWarehouse({ ...warehouse });
    setModalType('WAREHOUSE_EDIT');
  };

  const openDeleteModal = (warehouse: WareHouse) => {
    setSelectedWarehouse(warehouse);
    setModalType('WAREHOUSE_DELETE');
  };

  const handleAddStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newStaff = {
       id: Date.now(),
       name: fd.get('name') as string,
       role: fd.get('role') as string,
       access: 'Restricted'
    };
    setStaff([...staff, newStaff]);
    showToast('Staff Member Invited', 'success');
    setModalType(null);
  };

  const handleEditTemplate = (templateName: string) => {
     setSelectedTemplate(templateName);
     setModalType('TEMPLATE');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
     e.preventDefault();
     showToast(`Template '${selectedTemplate}' updated`, 'success');
     setModalType(null);
  };

  const handleModalClose = () => {
    setModalType(null);
    setSelectedWarehouse(null);
  }

  const handleWarehouseFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (modalType === 'WAREHOUSE_ADD') {
      setNewWarehouseData(prev => ({ ...prev, [name]: value }));
    } else if (modalType === 'WAREHOUSE_EDIT' && selectedWarehouse) {
      setSelectedWarehouse(prev => ({ ...prev!, [name]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500 text-sm">Configure global variables, locations, and access control.</p>
        </div>
        <button 
          onClick={handleSaveGlobal}
          className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 flex items-center shadow-sm font-medium"
        >
          <Save size={18} className="mr-2" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0">
          <nav className="p-2 space-y-1">
            {[
              { id: 'GENERAL', label: 'General & Finance', icon: <Globe size={18} /> },
              { id: 'HS_CODES', label: 'HS Codes & Taxes', icon: <BookOpen size={18} /> },
              { id: 'WAREHOUSES', label: 'Warehouse Locations', icon: <Database size={18} /> },
              { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell size={18} /> },
              { id: 'SECURITY', label: 'Security & Staff', icon: <Shield size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="mr-3 text-slate-400">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {activeTab === 'GENERAL' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div>
                  <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4">Company Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-700">System Name</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full border border-slate-300 rounded p-2 text-slate-900 bg-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Support Email</label>
                        <input type="email" defaultValue="support@shypt.net" className="mt-1 w-full border border-slate-300 rounded p-2 text-slate-900 bg-white" />
                     </div>
                  </div>
               </div>

               <div>
                  <h3 className="text-lg font-medium text-slate-800 border-b pb-2 mb-4 flex items-center">
                    <DollarSign size={20} className="mr-2 text-green-600" /> Financial Config
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-700">USD to UGX Rate</label>
                        <div className="relative mt-1">
                           <span className="absolute left-3 top-2 text-slate-500">UGX</span>
                           <input 
                              type="number" 
                              value={exchangeRate} 
                              onChange={(e) => setExchangeRate(e.target.value)} 
                              className="w-full border border-slate-300 rounded p-2 pl-12 text-slate-900 bg-white font-bold" 
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Quote Buffer (%)</label>
                        <div className="relative mt-1">
                           <input 
                              type="number" 
                              value={buffer} 
                              onChange={(e) => setBuffer(e.target.value)} 
                              className="w-full border border-slate-300 rounded p-2 text-slate-900 bg-white font-bold" 
                           />
                           <span className="absolute right-3 top-2 text-slate-500">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Added to Assisted Shopping quotes for fluctuation safety.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'HS_CODES' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Harmonized System (HS) Codes</h3>
                  <p className="text-sm text-slate-500 mb-4">Manage tax rates for different item categories used in the Deconsolidation Tax Simulator.</p>
                  
                  <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-50 text-slate-500">
                          <tr>
                              <th className="p-3">HS Code</th>
                              <th className="p-3">Description</th>
                              <th className="p-3 text-right">Import Duty</th>
                              <th className="p-3 text-right">VAT</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          <tr>
                              <td className="p-3 font-mono">8471.30</td>
                              <td className="p-3">Laptops & Computers</td>
                              <td className="p-3 text-right">0%</td>
                              <td className="p-3 text-right">18%</td>
                          </tr>
                          <tr>
                              <td className="p-3 font-mono">8517.12</td>
                              <td className="p-3">Mobile Phones</td>
                              <td className="p-3 text-right">10%</td>
                              <td className="p-3 text-right">18%</td>
                          </tr>
                          <tr>
                              <td className="p-3 font-mono">6109.10</td>
                              <td className="p-3">Cotton T-Shirts</td>
                              <td className="p-3 text-right">25%</td>
                              <td className="p-3 text-right">18%</td>
                          </tr>
                      </tbody>
                  </table>
                  <button className="text-sm text-primary-600 hover:underline font-medium">+ Add HS Code</button>
              </div>
          )}

          {activeTab === 'WAREHOUSES' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-slate-800">Warehouse Bin Locations</h3>
                  <button onClick={openAddModal} className="flex items-center text-sm bg-slate-800 text-white px-3 py-2 rounded hover:bg-slate-700">
                     <Plus size={14} className="mr-1" /> Add Location
                  </button>
               </div>
               
               <div className="space-y-4">
                  {isLoadingWarehouses ? (
                    <p>Loading...</p>
                  ) : warehouses.map((wh) => (
                     <div key={wh.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                        <div className="flex items-center">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 mr-4">
                              {wh.zone}
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800">{wh.code}</h4>
                              <p className="text-sm text-slate-500">
                                Zone: {wh.zone}, Rack: {wh.rack}, Bay: {wh.bay}, Shelf: {wh.shelf}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${wh.is_occupied ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {wh.is_occupied ? 'Occupied' : 'Empty'}
                          </span>
                          <button onClick={() => openEditModal(wh)} className="text-slate-500 hover:text-blue-600">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => openDeleteModal(wh)} className="text-slate-500 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'NOTIFICATIONS' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2">Email & SMS Templates</h3>
                
                <div className="space-y-4">
                   {['Order Received', 'Order Shipped (In Transit)', 'Arrived at Destination', 'Ready for Pickup'].map((template) => (
                      <div key={template} className="border border-slate-200 rounded-lg p-4">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-800">{template}</h4>
                            <button onClick={() => handleEditTemplate(template)} className="text-sm text-primary-600 hover:underline flex items-center">
                               <Edit size={14} className="mr-1" /> Edit Template
                            </button>
                         </div>
                         <div className="flex space-x-4">
                            <label className="flex items-center">
                               <input type="checkbox" defaultChecked className="text-primary-600 rounded" />
                               <span className="ml-2 text-sm text-slate-600">Email</span>
                            </label>
                            <label className="flex items-center">
                               <input type="checkbox" defaultChecked className="text-primary-600 rounded" />
                               <span className="ml-2 text-sm text-slate-600">SMS</span>
                            </label>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                   <h3 className="text-lg font-medium text-slate-800 mb-4">SMTP Configuration</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-slate-700">Host</label>
                         <input type="text" defaultValue="smtp.sendgrid.net" className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900" />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700">Port</label>
                         <input type="text" defaultValue="587" className="mt-1 w-full border border-slate-300 rounded p-2 bg-white text-slate-900" />
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'SECURITY' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                   <h4 className="font-bold text-red-800 flex items-center">
                      <Shield size={18} className="mr-2" /> Compliance Holds
                   </h4>
                   <p className="text-sm text-red-700 mt-1">
                      Enabling "Strict Mode" requires 2-factor authentication for releasing any held packages.
                   </p>
                   <div className="mt-3">
                      <label className="flex items-center">
                         <input type="checkbox" defaultChecked className="text-red-600 rounded focus:ring-red-500" />
                         <span className="ml-2 text-sm font-medium text-red-800">Enable Strict Compliance Mode</span>
                      </label>
                   </div>
                </div>

                <div>
                   <h3 className="text-lg font-medium text-slate-800 mb-4">Staff Management</h3>
                   <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden mb-4">
                      <thead className="bg-slate-50 text-slate-500">
                         <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-right">Access</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {staff.map(s => (
                            <tr key={s.id}>
                               <td className="p-3">{s.name}</td>
                               <td className="p-3">{s.role}</td>
                               <td className={`p-3 text-right ${s.access === 'Full' ? 'text-green-600' : 'text-yellow-600'}`}>{s.access}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   <button onClick={() => setModalType('STAFF')} className="text-sm bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded hover:bg-slate-200 font-medium">
                      + Add Staff Member
                   </button>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* --- WAREHOUSE MODALS --- */}

      <Modal isOpen={modalType === 'WAREHOUSE_ADD' || modalType === 'WAREHOUSE_EDIT'} onClose={handleModalClose} title={modalType === 'WAREHOUSE_EDIT' ? 'Edit Bin Location' : 'Add Bin Location'}>
         <form onSubmit={modalType === 'WAREHOUSE_EDIT' ? handleUpdateWarehouse : handleAddWarehouse} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Zone</label>
                <input name="zone" required onChange={handleWarehouseFormChange} value={modalType === 'WAREHOUSE_ADD' ? newWarehouseData.zone : selectedWarehouse?.zone || ''} className="w-full border p-2 rounded mt-1 bg-white text-slate-900 uppercase" maxLength={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Rack</label>
                <input name="rack" required onChange={handleWarehouseFormChange} value={modalType === 'WAREHOUSE_ADD' ? newWarehouseData.rack : selectedWarehouse?.rack || ''} className="w-full border p-2 rounded mt-1 bg-white text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Bay</label>
                <input name="bay" required onChange={handleWarehouseFormChange} value={modalType === 'WAREHOUSE_ADD' ? newWarehouseData.bay : selectedWarehouse?.bay || ''} className="w-full border p-2 rounded mt-1 bg-white text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Shelf</label>
                <input name="shelf" required onChange={handleWarehouseFormChange} value={modalType === 'WAREHOUSE_ADD' ? newWarehouseData.shelf : selectedWarehouse?.shelf || ''} className="w-full border p-2 rounded mt-1 bg-white text-slate-900" />
              </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700">Full Code</label>
               <input name="code" required onChange={handleWarehouseFormChange} value={modalType === 'WAREHOUSE_ADD' ? newWarehouseData.code : selectedWarehouse?.code || ''} className="w-full border p-2 rounded mt-1 bg-gray-100 text-slate-600" placeholder="e.g., A-01-B-03" />
               <p className="text-xs text-slate-500 mt-1">This is auto-generated but can be manually overridden.</p>
            </div>
            <div className="flex justify-end pt-2">
               <button type="button" onClick={handleModalClose} className="text-slate-600 px-4 py-2 rounded mr-2">Cancel</button>
               <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
                {modalType === 'WAREHOUSE_EDIT' ? 'Update Location' : 'Add Location'}
               </button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={modalType === 'WAREHOUSE_DELETE'} onClose={handleModalClose} title="Delete Warehouse Location">
        <div className="py-4">
          <p>Are you sure you want to delete the warehouse location <strong className="text-red-600">{selectedWarehouse?.code}</strong>? This action cannot be undone.</p>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleModalClose} className="text-slate-600 px-4 py-2 rounded mr-2">Cancel</button>
          <button onClick={handleDeleteWarehouse} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete</button>
        </div>
      </Modal>

      {/* --- OTHER MODALS --- */}

      <Modal isOpen={modalType === 'STAFF'} onClose={() => setModalType(null)} title="Invite Staff Member">
         <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-slate-700">Full Name</label>
               <input name="name" required className="w-full border p-2 rounded mt-1 bg-white text-slate-900" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700">Email Address</label>
               <input name="email" type="email" required className="w-full border p-2 rounded mt-1 bg-white text-slate-900" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700">Role</label>
               <select name="role" className="w-full border p-2 rounded mt-1 bg-white text-slate-900">
                  <option value="Staff">Warehouse Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
               </select>
            </div>
            <div className="flex justify-end pt-2">
               <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">Send Invite</button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={modalType === 'TEMPLATE'} onClose={() => setModalType(null)} title={`Edit Template: ${selectedTemplate}`}>
         <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-slate-700">Email Subject</label>
               <input defaultValue={`Update: ${selectedTemplate}`} className="w-full border p-2 rounded mt-1 bg-white text-slate-900" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700">Body Content (Supports Markdown)</label>
               <textarea rows={5} defaultValue={`Dear Client,\n\nYour order status has changed to ${selectedTemplate}.\n\nRegards,\nShypt Team`} className="w-full border p-2 rounded mt-1 bg-white text-slate-900"></textarea>
            </div>
            <div className="flex justify-end pt-2">
               <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">Update Template</button>
            </div>
         </form>
      </Modal>

    </div>
  );
};

export default Settings;