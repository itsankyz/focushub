import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Users,
  Download,
  Eye,
  X,
  CreditCard,
  History,
  SlidersHorizontal
} from 'lucide-react';
import { Customer, Sale } from '../types';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
}

export default function Customers({ customers, sales, onAddCustomer }: CustomersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Advanced Filters
  const [filters, setFilters] = useState({
    membership: 'all',
    minSpent: '',
    startDate: '',
    endDate: ''
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    membershipType: 'standard' as 'standard' | 'premium'
  });

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMembership = filters.membership === 'all' || c.membershipType === filters.membership;
    const matchesMinSpent = !filters.minSpent || c.totalSpent >= parseFloat(filters.minSpent);
    
    let matchesDate = true;
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? startOfDay(new Date(filters.startDate)).getTime() : 0;
      const end = filters.endDate ? endOfDay(new Date(filters.endDate)).getTime() : Infinity;
      matchesDate = c.createdAt >= start && c.createdAt <= end;
    }

    return matchesSearch && matchesMembership && matchesMinSpent && matchesDate;
  });

  const exportToExcel = () => {
    const data = customers.map(c => ({
      'Name': c.name,
      'Phone': c.phone || 'N/A',
      'Email': c.email || 'N/A',
      'Rx Date': c.latestPrescription?.date ? format(new Date(c.latestPrescription.date), 'MMM d, yyyy') : 'N/A',
      'OD SPH': c.latestPrescription?.od?.sph ?? '',
      'OD CYL': c.latestPrescription?.od?.cyl ?? '',
      'OD AXIS': c.latestPrescription?.od?.axis ?? '',
      'OD ADD': c.latestPrescription?.od?.add ?? '',
      'OS SPH': c.latestPrescription?.os?.sph ?? '',
      'OS CYL': c.latestPrescription?.os?.cyl ?? '',
      'OS AXIS': c.latestPrescription?.os?.axis ?? '',
      'OS ADD': c.latestPrescription?.os?.add ?? '',
      'PD': c.latestPrescription?.pd ?? '',
      'Rx Notes': c.latestPrescription?.notes ?? '',
      'Frame Name': c.latestFrameName || 'N/A',
      'Frame Cost': c.latestFrameCost ?? 0,
      'Lens Name': c.latestLensName || 'N/A',
      'Lens Cost': c.latestLensCost ?? 0,
      'Latest Order Total': c.latestOrderTotal ?? 0,
      'Address': c.address || 'N/A',
      'Membership': c.membershipType || 'Standard',
      'Total Spent': `₹${c.totalSpent}`,
      'Last Visit': c.lastVisit ? format(c.lastVisit, 'MMM d, yyyy') : 'N/A',
      'Created At': format(c.createdAt, 'MMM d, yyyy')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `FocusHub_Customers_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddCustomer({
      ...newCustomer,
      totalSpent: 0,
      lastVisit: Date.now()
    });
    setIsAddModalOpen(false);
    setNewCustomer({ name: '', phone: '', email: '', address: '', membershipType: 'standard' });
  };

  const getCustomerSales = (customerId: string) => {
    return sales.filter(s => s.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
  };

  const getCustomerPrescriptions = (customerId: string) => {
    const customerSales = getCustomerSales(customerId);
    return customerSales
      .filter(s => s.prescription)
      .map(s => s.prescription!)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            className="w-full bg-[#f7f9fb] border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all" 
            placeholder="Search visionary clients..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all",
              showFilters ? "bg-[#3856c4] text-white shadow-lg shadow-[#3856c4]/20" : "bg-[#f7f9fb] text-gray-600 hover:bg-gray-100"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
          </button>
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#f7f9fb] text-gray-600 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#3856c4] text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-[#3856c4]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Client</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Membership</label>
              <select 
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.membership}
                onChange={(e) => setFilters({...filters, membership: e.target.value})}
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Min Spent (₹)</label>
              <input 
                type="number"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                placeholder="0"
                value={filters.minSpent}
                onChange={(e) => setFilters({...filters, minSpent: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Joined From</label>
              <input 
                type="date"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Joined To</label>
              <input 
                type="date"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setFilters({ membership: 'all', minSpent: '', startDate: '', endDate: '' })}
              className="text-xs font-black uppercase tracking-widest text-[#3856c4] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-[#3856c4]/5 transition-all duration-300">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#3856c4]/10 flex items-center justify-center text-[#3856c4] font-black text-xl">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-[#2c3437] text-lg">{customer.name}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{customer.membershipType || 'Standard'} Visionary</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(customer)}
                  className="p-2 hover:bg-[#3856c4]/5 rounded-xl transition-colors text-gray-400 hover:text-[#3856c4]"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-500">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{customer.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium truncate">{customer.email || 'No email'}</span>
                </div>
                {customer.latestPrescription && (
                  <div className="p-3 bg-[#f7f9fb] rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Latest Rx</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[#2c3437]">
                      <span>OD: {customer.latestPrescription.od.sph}/{customer.latestPrescription.od.cyl}</span>
                      <span>OS: {customer.latestPrescription.os.sph}/{customer.latestPrescription.os.cyl}</span>
                    </div>
                  </div>
                )}
                {(customer.latestFrameName || customer.latestLensName) && (
                  <div className="p-3 bg-[#f7f9fb] rounded-2xl space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Latest Order</p>
                    {customer.latestFrameName && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">Frame</span>
                        <span className="font-bold text-[#2c3437]">{customer.latestFrameName} {customer.latestFrameCost ? `₹${customer.latestFrameCost}` : ''}</span>
                      </div>
                    )}
                    {customer.latestLensName && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">Lens</span>
                        <span className="font-bold text-[#2c3437]">{customer.latestLensName} {customer.latestLensCost ? `₹${customer.latestLensCost}` : ''}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div>
                  <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest mb-1">Total Spent</p>
                  <p className="text-sm font-black text-[#3856c4]">₹{customer.totalSpent}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest mb-1">Last Order</p>
                  <p className="text-sm font-black text-[#2c3437]">{customer.latestOrderTotal ? `₹${customer.latestOrderTotal}` : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-[#3856c4] text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-[#3856c4]/20">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#2c3437]">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-3 py-1 bg-[#3856c4]/10 text-[#3856c4] rounded-full text-[10px] font-black uppercase tracking-wider">
                      {selectedCustomer.membershipType || 'Standard'} Visionary
                    </span>
                    <span className="text-gray-400 text-xs font-bold">Client since {format(selectedCustomer.createdAt, 'MMM yyyy')}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left Column: Profile Info */}
              <div className="space-y-8">
                <div className="bg-[#f7f9fb] rounded-[2rem] p-8 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Details</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-bold text-[#2c3437]">{selectedCustomer.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                        <p className="text-sm font-bold text-[#2c3437] truncate">{selectedCustomer.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Address</p>
                        <p className="text-sm font-bold text-[#2c3437] leading-tight">{selectedCustomer.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#3856c4] to-[#6d89fa] rounded-[2rem] p-8 text-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Financial Overview</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold opacity-80">Total Spent</span>
                      <span className="text-xl font-black">₹{selectedCustomer.totalSpent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold opacity-80">Last Visit</span>
                      <span className="text-sm font-bold">{selectedCustomer.lastVisit ? format(selectedCustomer.lastVisit, 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                    {selectedCustomer.latestOrderTotal && (
                      <div className="flex items-center justify-between border-t border-white/20 pt-4">
                        <span className="text-xs font-bold opacity-80">Last Order Total</span>
                        <span className="text-lg font-black">₹{selectedCustomer.latestOrderTotal}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedCustomer.latestFrameName || selectedCustomer.latestLensName) && (
                  <div className="bg-[#f7f9fb] rounded-[2rem] p-6 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Latest Frame & Lens</h4>
                    {selectedCustomer.latestFrameName && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Frame</p>
                          <p className="text-sm font-bold text-[#2c3437]">{selectedCustomer.latestFrameName}</p>
                        </div>
                        {selectedCustomer.latestFrameCost && (
                          <span className="text-sm font-black text-[#3856c4]">₹{selectedCustomer.latestFrameCost}</span>
                        )}
                      </div>
                    )}
                    {selectedCustomer.latestLensName && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lens</p>
                          <p className="text-sm font-bold text-[#2c3437]">{selectedCustomer.latestLensName}</p>
                        </div>
                        {selectedCustomer.latestLensCost && (
                          <span className="text-sm font-black text-[#3856c4]">₹{selectedCustomer.latestLensCost}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Middle & Right Column: Rx and History */}
              <div className="lg:col-span-2 space-y-8">
                {/* Prescription History */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-[#3856c4]" />
                      <h4 className="text-lg font-black text-[#2c3437]">Prescription History</h4>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {getCustomerPrescriptions(selectedCustomer.id).length > 0 ? (
                      getCustomerPrescriptions(selectedCustomer.id).map((rx, idx) => (
                        <div key={idx} className={cn(
                          "p-6 rounded-2xl border transition-all",
                          idx === 0 ? "bg-[#3856c4]/5 border-[#3856c4]/20" : "bg-white border-gray-100"
                        )}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                                {format(new Date(rx.date), 'MMM d, yyyy')}
                                {idx === 0 && <span className="ml-2 text-[#3856c4]">(Latest)</span>}
                              </span>
                            </div>
                            {rx.doctorName && (
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dr. {rx.doctorName}</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-xl border border-gray-50 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-[#0b0f10] text-white flex items-center justify-center text-[8px] font-black">OD</div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Right Eye</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {['sph', 'cyl', 'axis', 'add'].map(f => (
                                  <div key={f} className="text-center">
                                    <p className="text-[7px] text-gray-300 font-black uppercase tracking-widest">{f}</p>
                                    <p className="text-xs font-black text-[#2c3437]">{(rx.od as any)[f] || '0.00'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-50 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-[#3856c4] text-white flex items-center justify-center text-[8px] font-black">OS</div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Left Eye</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {['sph', 'cyl', 'axis', 'add'].map(f => (
                                  <div key={f} className="text-center">
                                    <p className="text-[7px] text-gray-300 font-black uppercase tracking-widest">{f}</p>
                                    <p className="text-xs font-black text-[#2c3437]">{(rx.os as any)[f] || '0.00'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          {rx.notes && (
                            <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                <span className="font-black uppercase tracking-widest text-[8px] mr-2">Notes:</span>
                                {rx.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center bg-[#f7f9fb] rounded-2xl border border-dashed border-gray-200">
                        <Eye className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 font-bold">No prescription on file</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase History */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <History className="w-5 h-5 text-[#3856c4]" />
                    <h4 className="text-lg font-black text-[#2c3437]">Purchase History</h4>
                  </div>
                  
                  <div className="space-y-6">
                    {getCustomerSales(selectedCustomer.id).length > 0 ? getCustomerSales(selectedCustomer.id).map(sale => (
                      <div key={sale.id} className="p-6 bg-[#f7f9fb] rounded-[2rem] border border-gray-50 hover:border-[#3856c4]/20 transition-all group">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#3856c4] shadow-sm">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#2c3437]">Invoice #{sale.id.slice(-6).toUpperCase()}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{format(sale.createdAt, 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-[#3856c4]">₹{sale.total}</p>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                              sale.status === 'paid' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                            )}>{sale.status}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {sale.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-white border border-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">{item.quantity}x</span>
                                <span className="font-bold text-gray-600">{item.name}</span>
                              </div>
                              <span className="text-gray-400">₹{item.total}</span>
                            </div>
                          ))}
                          {(sale.frameSelection || sale.lensType) && (
                            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                              {sale.frameSelection && (
                                <div>
                                  <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">Frame</p>
                                  <p className="text-[10px] font-bold text-gray-500">{sale.frameSelection}</p>
                                </div>
                              )}
                              {sale.lensType && (
                                <div>
                                  <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">Lens</p>
                                  <p className="text-[10px] font-bold text-gray-500">{sale.lensType}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center opacity-30">
                        <History className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">No transactions found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-[#2c3437]">New Visionary Client</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
                <input 
                  required
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                  placeholder="e.g. Arjun Mehta"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Phone Number</label>
                <input 
                  required
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                  placeholder="+91 98765 43210"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
                <input 
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                  placeholder="arjun@visionary.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-[#3856c4] text-white rounded-2xl font-bold shadow-lg shadow-[#3856c4]/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                Register Client
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
