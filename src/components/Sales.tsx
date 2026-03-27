import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Eye, 
  Plus, 
  Trash2, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Scan,
  UserPlus
} from 'lucide-react';
import { Customer, Product, Sale, Prescription, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface SalesProps {
  customers: Customer[];
  products: Product[];
  userProfile: UserProfile | null;
  onAddSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
}

export default function Sales({ customers, products, userProfile, onAddSale, onAddCustomer }: SalesProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // Form States
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    membershipType: 'standard' as 'standard' | 'premium'
  });

  const [prescription, setPrescription] = useState<Prescription>({
    od: { sph: '', cyl: '', axis: '', add: '' },
    os: { sph: '', cyl: '', axis: '', add: '' },
    date: new Date().toISOString(),
    notes: ''
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.18; // 18% GST
  
  const calculatedDiscount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100 
    : discountValue;

  const total = Math.max(0, subtotal + tax - calculatedDiscount);

  const handleNext = () => {
    setStepError(null);
    if (step === 1) {
      if (!isNewCustomer && !selectedCustomer) {
        setStepError('Please select an existing client or switch to New Client.');
        return;
      }
      if (isNewCustomer && !customerForm.name.trim()) {
        setStepError('Client name is required.');
        return;
      }
    }
    if (step === 3 && items.length === 0) {
      setStepError('Please add at least one product.');
      return;
    }
    setStep(s => s + 1);
  };
  const handleBack = () => { setStepError(null); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let customerId = selectedCustomer?.id;

      if (isNewCustomer) {
        const createdCustomer = await onAddCustomer({
          ...customerForm,
          totalSpent: 0,
          lastVisit: Date.now(),
        });
        customerId = createdCustomer.id;
      }

      await onAddSale({
        customerId: customerId || 'new-customer',
        customerName: selectedCustomer?.name || customerForm.name,
        items: items.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          total: i.product.price * i.quantity
        })),
        subtotal,
        tax,
        total,
        discount: calculatedDiscount,
        paymentMethod,
        status: 'pending',
        prescription,
        lensType: 'Single Vision',
        frameSelection: items.find(i => i.product.category === 'frames')?.product.name || '',
        userId: userProfile?.uid || 'unknown'
      });

      // Reset
      setStep(1);
      setSelectedCustomer(null);
      setIsNewCustomer(false);
      setCustomerForm({ name: '', phone: '', email: '', address: '', membershipType: 'standard' });
      setPrescription({ od: { sph: '', cyl: '', axis: '', add: '' }, os: { sph: '', cyl: '', axis: '', add: '' }, date: new Date().toISOString(), notes: '' });
      setItems([]);
      setDiscountValue(0);
      setPaymentMethod('cash');
      setCustomerSearch('');
      setProductSearch('');
      setStepError(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 px-4">
        {[
          { step: 1, label: 'Client Info', icon: User },
          { step: 2, label: 'Prescription', icon: Eye },
          { step: 3, label: 'Selection', icon: Plus },
          { step: 4, label: 'Checkout', icon: CreditCard },
        ].map((item, idx, arr) => (
          <React.Fragment key={item.step}>
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                step >= item.step ? "bg-[#3856c4] text-white shadow-lg shadow-[#3856c4]/20" : "bg-white text-gray-300 border border-gray-100"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                step >= item.step ? "text-[#3856c4]" : "text-gray-300"
              )}>{item.label}</span>
            </div>
            {idx < arr.length - 1 && (
              <div className="flex-1 h-[2px] bg-gray-100 mx-4 -mt-8 relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-[#3856c4] transition-transform duration-500 origin-left"
                  style={{ transform: `scaleX(${step > item.step ? 1 : 0})` }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
        {step === 1 && (
          <div className="p-10 flex-1 flex flex-col animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-[#2c3437]">Client Information</h3>
                <p className="text-gray-400 text-sm">Start by identifying the visionary client.</p>
              </div>
              <button 
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="flex items-center gap-2 px-6 py-3 bg-[#f7f9fb] text-[#3856c4] rounded-full text-sm font-bold hover:bg-[#3856c4]/5 transition-colors"
              >
                {isNewCustomer ? <User className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isNewCustomer ? 'Existing Client' : 'New Client'}</span>
              </button>
            </div>

            {isNewCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <input 
                      className="w-full bg-[#f7f9fb] border-none rounded-2xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                      placeholder="e.g. Arjun Mehta"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <input 
                      className="w-full bg-[#f7f9fb] border-none rounded-2xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                      placeholder="+91 98765 43210"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                    <input 
                      className="w-full bg-[#f7f9fb] border-none rounded-2xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                      placeholder="arjun@visionary.com"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Membership Type</label>
                  <select 
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-5 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all appearance-none"
                    value={customerForm.membershipType}
                    onChange={(e) => setCustomerForm({...customerForm, membershipType: e.target.value as any})}
                  >
                    <option value="standard">Standard Visionary</option>
                    <option value="premium">Premium Visionary</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Residential Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-6 text-gray-300 w-4 h-4" />
                    <textarea 
                      className="w-full bg-[#f7f9fb] border-none rounded-2xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all resize-none h-24" 
                      placeholder="Street, City, Pincode"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                  <input 
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                    placeholder="Search existing client by name or phone..." 
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {customers.filter(c =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    (c.phone || '').includes(customerSearch)
                  ).slice(0, 10).map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border transition-all",
                        selectedCustomer?.id === c.id ? "bg-[#3856c4]/5 border-[#3856c4]" : "bg-white border-gray-100 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#3856c4]/10 flex items-center justify-center text-[#3856c4] font-bold">
                          {c.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-[#2c3437]">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.phone}</p>
                        </div>
                      </div>
                      {selectedCustomer?.id === c.id && <CheckCircle2 className="w-5 h-5 text-[#3856c4]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="p-10 flex-1 flex flex-col animate-in fade-in duration-500">
            <div className="mb-10">
              <h3 className="text-2xl font-black text-[#2c3437]">Prescription Details</h3>
              <p className="text-gray-400 text-sm">Enter the visionary metrics for this client.</p>
            </div>

            <div className="space-y-10">
              {/* OD (Right Eye) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0b0f10] text-white flex items-center justify-center text-[10px] font-black">OD</div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Right Eye</h4>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {['sph', 'cyl', 'axis', 'add'].map(field => (
                    <div key={field} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-2">{field}</label>
                      <input 
                        className="w-full bg-[#f7f9fb] border-none rounded-xl py-3 px-4 text-center text-sm font-bold focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                        placeholder="0.00"
                        value={(prescription.od as any)[field]}
                        onChange={(e) => setPrescription({
                          ...prescription,
                          od: { ...prescription.od, [field]: e.target.value }
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
                <div className="grid grid-cols-4 gap-4">
                  {['sph', 'cyl', 'axis', 'add'].map(field => (
                    <div key={field} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-2">{field}</label>
                      <input 
                        className="w-full bg-[#f7f9fb] border-none rounded-xl py-3 px-4 text-center text-sm font-bold focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                        placeholder="0.00"
                        value={(prescription.os as any)[field]}
                        onChange={(e) => setPrescription({
                          ...prescription,
                          os: { ...prescription.os, [field]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Pupillary Distance (PD)</label>
                  <input 
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                    placeholder="e.g. 64mm"
                    value={prescription.pd}
                    onChange={(e) => setPrescription({...prescription, pd: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Additional Notes</label>
                  <input 
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                    placeholder="e.g. Bifocal, Anti-glare"
                    value={prescription.notes}
                    onChange={(e) => setPrescription({...prescription, notes: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-10 flex-1 flex flex-col animate-in fade-in duration-500">
            <div className="mb-10">
              <h3 className="text-2xl font-black text-[#2c3437]">Frame & Lens Selection</h3>
              <p className="text-gray-400 text-sm">Curate the perfect look for your client.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="relative">
                  <Scan className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                  <input 
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                    placeholder="Search products..." 
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {products.filter(p =>
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    (p.brand || '').toLowerCase().includes(productSearch.toLowerCase()) ||
                    p.category.toLowerCase().includes(productSearch.toLowerCase())
                  ).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-[#f7f9fb] rounded-2xl group hover:bg-[#3856c4]/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Plus className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#2c3437]">{p.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{p.brand || 'Visionary'} • {p.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-black text-sm text-[#3856c4]">₹{p.price}</p>
                        <button 
                          onClick={() => {
                            const existing = items.find(i => i.product.id === p.id);
                            if (existing) {
                              setItems(items.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
                            } else {
                              setItems([...items, { product: p, quantity: 1 }]);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-white text-[#3856c4] flex items-center justify-center shadow-sm hover:bg-[#3856c4] hover:text-white transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#f7f9fb] rounded-[2rem] p-8 flex flex-col">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Selected Items</h4>
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {items.length > 0 ? items.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between animate-in slide-in-from-right-4 duration-300">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2c3437] truncate">{item.product.name}</p>
                        <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-black text-[#2c3437]">₹{item.product.price * item.quantity}</p>
                        <button 
                          onClick={() => setItems(items.filter(i => i.product.id !== item.product.id))}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                      <Plus className="w-12 h-12 mb-2" />
                      <p className="text-sm">No items selected</p>
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Discount</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input 
                          type="number"
                          className="w-full bg-white border border-gray-100 rounded-xl py-2 px-4 text-sm font-bold focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                          placeholder={discountType === 'percentage' ? "0%" : "₹0"}
                          value={discountValue || ''}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex bg-white border border-gray-100 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => setDiscountType('amount')}
                          className={cn(
                            "px-3 py-2 text-[10px] font-black transition-all",
                            discountType === 'amount' ? "bg-[#3856c4] text-white" : "text-gray-400 hover:bg-gray-50"
                          )}
                        >
                          ₹
                        </button>
                        <button 
                          onClick={() => setDiscountType('percentage')}
                          className={cn(
                            "px-3 py-2 text-[10px] font-black transition-all",
                            discountType === 'percentage' ? "bg-[#3856c4] text-white" : "text-gray-400 hover:bg-gray-50"
                          )}
                        >
                          %
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Subtotal</span>
                    <span className="text-sm font-bold text-[#2c3437]">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tax (18%)</span>
                    <span className="text-sm font-bold text-[#2c3437]">₹{tax.toFixed(2)}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div className="flex items-center justify-between mb-2 text-green-600">
                      <span className="text-xs font-bold uppercase tracking-wider">Discount</span>
                      <span className="text-sm font-bold">-₹{calculatedDiscount}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</span>
                    <span className="text-xl font-black text-[#3856c4]">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-black text-[#2c3437] mb-4">Ready to Finalize?</h3>
            <p className="text-gray-400 max-w-md mb-12">
              Review all details before generating the invoice. This will record the prescription and update the inventory.
            </p>

            <div className="w-full max-w-md bg-[#f7f9fb] rounded-3xl p-8 text-left space-y-6 mb-12">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Client</span>
                <span className="text-sm font-bold text-[#2c3437]">{selectedCustomer?.name || customerForm.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items</span>
                <span className="text-sm font-bold text-[#2c3437]">{items.length} Products</span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                  <span className="text-sm font-bold">-₹{calculatedDiscount}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment</span>
                <div className="flex gap-2">
                  {(['cash', 'card', 'transfer'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
                        paymentMethod === m ? 'bg-[#3856c4] text-white' : 'bg-white text-gray-400 border border-gray-200'
                      )}
                    >{m}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</span>
                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">Pending Payment</span>
              </div>
              <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-black text-[#2c3437]">Total Amount</span>
                <span className="text-2xl font-black text-[#3856c4]">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4 w-full max-w-md">
              <button 
                onClick={handleBack}
                className="flex-1 py-5 bg-[#f7f9fb] text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                Review Items
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-5 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
              >
                {submitting ? 'Processing...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        )}

          {/* Step error */}
          {stepError && (
            <div className="px-10 py-4 bg-red-50 border-t border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {stepError}
            </div>
          )}
          {/* Footer Navigation */}
        {step < 4 && (
          <div className="px-10 py-8 bg-[#f7f9fb] border-t border-gray-100 flex items-center justify-between">
            <button 
              onClick={handleBack}
              disabled={step === 1}
              className="px-8 py-3 text-sm font-bold text-gray-400 hover:text-[#2c3437] disabled:opacity-0 transition-all"
            >
              Back
            </button>
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-10 py-4 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span>{step === 3 ? 'Finalize Order' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
