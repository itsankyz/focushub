import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  CreditCard, 
  User, 
  Package,
  ArrowRight,
  X,
  SlidersHorizontal,
  Receipt
} from 'lucide-react';
import { Sale } from '../types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

interface SalesHistoryProps {
  sales: Sale[];
  onClose?: () => void;
}

export default function SalesHistory({ sales, onClose }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',
    status: 'all'
  });

  const filteredSales = sales.filter(s => {
    const matchesSearch = 
      s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDate = true;
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? startOfDay(new Date(filters.startDate)).getTime() : 0;
      const end = filters.endDate ? endOfDay(new Date(filters.endDate)).getTime() : Infinity;
      matchesDate = s.createdAt >= start && s.createdAt <= end;
    }

    const matchesMinAmount = !filters.minAmount || s.total >= parseFloat(filters.minAmount);
    const matchesMaxAmount = !filters.maxAmount || s.total <= parseFloat(filters.maxAmount);
    const matchesPayment = filters.paymentMethod === 'all' || s.paymentMethod === filters.paymentMethod;
    const matchesStatus = filters.status === 'all' || s.status === filters.status;

    return matchesSearch && matchesDate && matchesMinAmount && matchesMaxAmount && matchesPayment && matchesStatus;
  });

  const exportToExcel = () => {
    const data = filteredSales.map(s => ({
      'Invoice ID': s.id.slice(-6).toUpperCase(),
      'Customer': s.customerName || 'N/A',
      'Items': s.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
      'Subtotal': s.subtotal,
      'Tax': s.tax,
      'Discount': s.discount,
      'Total': s.total,
      'Payment': s.paymentMethod,
      'Status': s.status,
      'Date': format(s.createdAt, 'MMM d, yyyy HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered_Sales");
    XLSX.writeFile(wb, `Filtered_Sales_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            className="w-full bg-[#f7f9fb] border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all" 
            placeholder="Search by customer, ID, or item..." 
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
          {onClose && (
            <button 
              onClick={onClose}
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">From Date</label>
              <input 
                type="date"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">To Date</label>
              <input 
                type="date"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Min Amount</label>
              <input 
                type="number"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Max Amount</label>
              <input 
                type="number"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                placeholder="0"
                value={filters.maxAmount}
                onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Payment</label>
              <select 
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.paymentMethod}
                onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
              >
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Status</label>
              <select 
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setFilters({ startDate: '', endDate: '', minAmount: '', maxAmount: '', paymentMethod: 'all', status: 'all' })}
              className="text-xs font-black uppercase tracking-widest text-[#3856c4] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Filtered Total</p>
          <p className="text-2xl font-black text-[#3856c4]">₹{filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Transaction Count</p>
          <p className="text-2xl font-black text-[#2c3437]">{filteredSales.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg. Transaction</p>
          <p className="text-2xl font-black text-[#2c3437]">₹{filteredSales.length > 0 ? Math.round(filteredSales.reduce((acc, s) => acc + s.total, 0) / filteredSales.length).toLocaleString() : 0}</p>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f9fb]">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Payment</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#3856c4]/10 flex items-center justify-center text-[#3856c4]">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-[#2c3437]">#{sale.id.slice(-6).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#2c3437]">{sale.customerName}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">{sale.items.length} items</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm text-gray-500">{format(sale.createdAt, 'MMM d, yyyy')}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-[#2c3437]">₹{sale.total.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3 h-3 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{sale.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      sale.status === 'ready_for_pickup' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {sale.status?.replace('_', ' ') || 'Completed'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="p-2 text-gray-400 hover:text-[#3856c4] hover:bg-[#3856c4]/5 rounded-xl transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-gray-100 mb-4" />
                      <h4 className="text-lg font-black text-[#2c3437]">No transactions found</h4>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#2c3437]">Invoice #{selectedSale.id.slice(-6).toUpperCase()}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{format(selectedSale.createdAt, 'MMM d, yyyy HH:mm')}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-[#f7f9fb] rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Client</p>
                <p className="font-bold text-[#2c3437]">{selectedSale.customerName || 'N/A'}</p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items</p>
                {selectedSale.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#f7f9fb] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">{item.quantity}x</span>
                      <span className="text-sm font-bold text-[#2c3437]">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-[#3856c4]">₹{item.total}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="font-bold">₹{selectedSale.subtotal}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Tax (18%)</span><span className="font-bold">₹{(selectedSale.tax ?? 0).toFixed(2)}</span></div>
                {selectedSale.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span className="font-bold">-₹{selectedSale.discount}</span></div>}
                <div className="flex justify-between text-base font-black"><span className="text-[#2c3437]">Total</span><span className="text-[#3856c4]">₹{selectedSale.total}</span></div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 bg-[#f7f9fb] rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Payment</p>
                  <p className="text-sm font-bold text-[#2c3437] uppercase">{selectedSale.paymentMethod}</p>
                </div>
                <div className="flex-1 bg-[#f7f9fb] rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                  <p className="text-sm font-bold text-[#2c3437] uppercase">{selectedSale.status?.replace('_', ' ')}</p>
                </div>
              </div>
              {selectedSale.prescription && (
                <div className="bg-[#3856c4]/5 border border-[#3856c4]/20 rounded-2xl p-6 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#3856c4]">Prescription</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">OD (Right)</p>
                      <p className="text-xs font-bold text-[#2c3437]">SPH {selectedSale.prescription.od.sph} / CYL {selectedSale.prescription.od.cyl} / AXIS {selectedSale.prescription.od.axis}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">OS (Left)</p>
                      <p className="text-xs font-bold text-[#2c3437]">SPH {selectedSale.prescription.os.sph} / CYL {selectedSale.prescription.os.cyl} / AXIS {selectedSale.prescription.os.axis}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
