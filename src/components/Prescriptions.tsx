import React, { useState } from 'react';
import { 
  Eye, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  User, 
  FileText,
  ChevronRight,
  ArrowRight,
  Edit2,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Sale, Prescription } from '../types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';

interface PrescriptionsProps {
  sales: Sale[];
  onUpdatePrescription: (saleId: string, prescription: Prescription) => Promise<void>;
}

export default function Prescriptions({ sales, onUpdatePrescription }: PrescriptionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState<Prescription | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  
  // Advanced Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minSph: '',
    maxSph: ''
  });

  // Filter sales that have prescriptions
  const prescriptions = sales
    .filter(s => {
      if (!s.prescription || !s.id) return false;

      const matchesSearch = 
        s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.prescription.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? startOfDay(new Date(filters.startDate)).getTime() : 0;
        const end = filters.endDate ? endOfDay(new Date(filters.endDate)).getTime() : Infinity;
        matchesDate = s.createdAt >= start && s.createdAt <= end;
      }

      const sphOD = parseFloat(s.prescription.od.sph || '0');
      const sphOS = parseFloat(s.prescription.os.sph || '0');
      const maxSphVal = Math.max(Math.abs(sphOD), Math.abs(sphOS));
      
      const matchesMinSph = !filters.minSph || maxSphVal >= parseFloat(filters.minSph);
      const matchesMaxSph = !filters.maxSph || maxSphVal <= parseFloat(filters.maxSph);

      return matchesSearch && matchesDate && matchesMinSph && matchesMaxSph;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setEditForm(sale.prescription || {
      od: { sph: '', cyl: '', axis: '', add: '' },
      os: { sph: '', cyl: '', axis: '', add: '' },
      date: new Date().toISOString(),
      notes: ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSale && editForm) {
      await onUpdatePrescription(editingSale.id, editForm);
      setEditingSale(null);
      setEditForm(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            className="w-full bg-[#f7f9fb] border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all" 
            placeholder="Search by client name or Rx ID..." 
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
            onClick={() => {
              const blank: Sale = {
                id: '',
                items: [],
                total: 0,
                subtotal: 0,
                tax: 0,
                discount: 0,
                paymentMethod: 'cash',
                status: 'pending',
                createdAt: Date.now(),
                userId: '',
                customerName: '',
                prescription: { od: { sph: '', cyl: '', axis: '', add: '' }, os: { sph: '', cyl: '', axis: '', add: '' }, date: new Date().toISOString(), notes: '' }
              };
              setEditingSale(blank);
              setEditForm(blank.prescription!);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#3856c4] text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-[#3856c4]/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>New Test</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Min Sph Power</label>
              <input 
                type="number"
                step="0.25"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                placeholder="0.00"
                value={filters.minSph}
                onChange={(e) => setFilters({...filters, minSph: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Max Sph Power</label>
              <input 
                type="number"
                step="0.25"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                placeholder="0.00"
                value={filters.maxSph}
                onChange={(e) => setFilters({...filters, maxSph: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setFilters({ startDate: '', endDate: '', minSph: '', maxSph: '' })}
              className="text-xs font-black uppercase tracking-widest text-[#3856c4] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions.length > 0 ? prescriptions.map((sale) => (
          <div key={sale.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-[#3856c4]/5 transition-all duration-300">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#3856c4]/10 flex items-center justify-center text-[#3856c4]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-[#2c3437]">{sale.customerName}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Client ID: {sale.customerId.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest mb-1">Date</p>
                  <p className="text-xs font-bold text-[#2c3437]">{format(sale.createdAt, 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-[#f7f9fb] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#0b0f10] text-white flex items-center justify-center text-[8px] font-black">OD</div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Right Eye</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">Sph</p>
                      <p className="text-xs font-black text-[#2c3437]">{sale.prescription?.od.sph || '0.00'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">Cyl</p>
                      <p className="text-xs font-black text-[#2c3437]">{sale.prescription?.od.cyl || '0.00'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#f7f9fb] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#3856c4] text-white flex items-center justify-center text-[8px] font-black">OS</div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Left Eye</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">Sph</p>
                      <p className="text-xs font-black text-[#2c3437]">{sale.prescription?.os.sph || '0.00'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">Cyl</p>
                      <p className="text-xs font-black text-[#2c3437]">{sale.prescription?.os.cyl || '0.00'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-300" />
                  <span className="text-xs text-gray-400">Next test due in 6 months</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(sale)}
                    className="p-2 text-gray-400 hover:text-[#3856c4] hover:bg-[#3856c4]/5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDetailSale(sale)}
                    className="flex items-center gap-2 text-xs font-black text-[#3856c4] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    <span>Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center">
            <Eye className="w-16 h-16 text-gray-100 mb-4" />
            <h4 className="text-xl font-black text-[#2c3437] mb-2">No Prescriptions Recorded</h4>
            <p className="text-gray-400 max-w-xs">Start by creating a new eye test for a client from the dashboard or sales screen.</p>
          </div>
        )}
      </div>

      {/* Edit Prescription Modal */}
      {editingSale && editForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#2c3437]">Update Prescription</h3>
                <p className="text-sm text-gray-400">Client: {editingSale.customerName}</p>
              </div>
              <button 
                onClick={() => setEditingSale(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* OD (Right Eye) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0b0f10] text-white flex items-center justify-center text-[10px] font-black">OD</div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Right Eye</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {['sph', 'cyl', 'axis', 'add'].map(field => (
                      <div key={field} className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-2">{field}</label>
                        <input 
                          className="w-full bg-[#f7f9fb] border-none rounded-xl py-3 px-4 text-center text-sm font-bold focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                          placeholder="0.00"
                          value={(editForm.od as any)[field]}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            od: { ...editForm.od, [field]: e.target.value }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* OS (Left Eye) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#3856c4] text-white flex items-center justify-center text-[10px] font-black">OS</div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Left Eye</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {['sph', 'cyl', 'axis', 'add'].map(field => (
                      <div key={field} className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-2">{field}</label>
                        <input 
                          className="w-full bg-[#f7f9fb] border-none rounded-xl py-3 px-4 text-center text-sm font-bold focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                          placeholder="0.00"
                          value={(editForm.os as any)[field]}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            os: { ...editForm.os, [field]: e.target.value }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Pupillary Distance (PD)</label>
                  <input 
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                    placeholder="e.g. 64mm"
                    value={editForm.pd}
                    onChange={(e) => setEditForm({...editForm, pd: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Additional Notes</label>
                  <input 
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                    placeholder="e.g. Bifocal, Anti-glare"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      {detailSale && detailSale.prescription && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#2c3437]">Prescription Details</h3>
                <p className="text-sm text-gray-400">{detailSale.customerName} • {format(detailSale.createdAt, 'MMM d, yyyy')}</p>
              </div>
              <button onClick={() => setDetailSale(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              {[{ label: 'OD', key: 'od', color: 'bg-[#0b0f10]' }, { label: 'OS', key: 'os', color: 'bg-[#3856c4]' }].map(({ label, key, color }) => (
                <div key={key} className="bg-[#f7f9fb] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} text-white flex items-center justify-center text-[10px] font-black`}>{label}</div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label === 'OD' ? 'Right Eye' : 'Left Eye'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {['sph', 'cyl', 'axis', 'add'].map(f => (
                      <div key={f} className="text-center">
                        <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest mb-1">{f}</p>
                        <p className="text-sm font-black text-[#2c3437]">{(detailSale.prescription![key as 'od' | 'os'] as any)[f] || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {detailSale.prescription.pd && (
                <div className="flex justify-between items-center p-4 bg-[#f7f9fb] rounded-2xl">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">PD</span>
                  <span className="text-sm font-bold text-[#2c3437]">{detailSale.prescription.pd}</span>
                </div>
              )}
              {detailSale.prescription.notes && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Notes</p>
                  <p className="text-sm text-amber-800">{detailSale.prescription.notes}</p>
                </div>
              )}
              <button
                onClick={() => { setDetailSale(null); handleEditClick(detailSale); }}
                className="w-full py-4 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Edit Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
