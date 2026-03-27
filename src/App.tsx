import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, Customer, UserProfile, Prescription } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Prescriptions from './components/Prescriptions';
import Auth from './components/Auth';
import UserProfileSettings from './components/UserProfileSettings';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  clearSession,
  getSession,
  isCloudEnabled,
  login,
  pullFromCloudOrLocal,
  pushToCloudBestEffort,
  register,
} from './lib/hybridStore';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : fallback;
  return msg.replace(/[\r\n\t]/g, ' ').slice(0, 200);
}

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const initialize = async () => {
      const session = getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUserProfile(session.user);
      setAuthToken(session.token);
      const data = await pullFromCloudOrLocal(session.token);
      setProducts(data.products);
      setSales(data.sales);
      setCustomers(data.customers);
      if (data.profile) {
        setUserProfile(data.profile);
      }
      setLoading(false);
    };

    void initialize().catch((err) => {
      setError(sanitizeError(err, 'Failed to initialize'));
      setLoading(false);
    });
  }, []);

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || !userProfile) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      void pushToCloudBestEffort(
        { products, sales, customers, profile: userProfile },
        authToken || undefined,
      ).catch(() => { /* silent — local copy already saved */ });
    }, 1500);
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current); };
  }, [products, sales, customers, loading, authToken, userProfile]);

  const handleLogin = async (email: string, password: string) => {
    const session = await login(email, password);
    setUserProfile(session.user);
    setAuthToken(session.token);
    const data = await pullFromCloudOrLocal(session.token);
    setProducts(data.products);
    setSales(data.sales);
    setCustomers(data.customers);
    if (data.profile) {
      setUserProfile(data.profile);
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const session = await register(name, email, password);
    setUserProfile(session.user);
    setAuthToken(session.token);
    const data = await pullFromCloudOrLocal(session.token);
    setProducts(data.products);
    setSales(data.sales);
    setCustomers(data.customers);
    if (data.profile) {
      setUserProfile(data.profile);
    }
  };

  const handleLogout = () => {
    clearSession();
    setUserProfile(null);
    setAuthToken(null);
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setActiveTab('dashboard');
  };

  const handleEditProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)
    );
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddProduct = async (product: any) => {
    try {
      const now = Date.now();
      const newProduct: Product = {
        id: createId('prd'),
        name: product.name || 'Untitled Product',
        sku: product.sku || createId('sku'),
        category: product.category || 'frames',
        brand: product.brand || '',
        price: Number(product.price) || 0,
        cost: Number(product.cost) || Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        minStock: Number(product.minStock) || 5,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls : [],
        createdAt: now,
        updatedAt: now,
      };

      setProducts((prev) => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(sanitizeError(err, 'Failed to add product'));
    }
  };

  const handleAddSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    try {
      const frameItem = sale.items.find((item) =>
        products.find((p) => p.id === item.productId)?.category === 'frames',
      );
      const lensItem = sale.items.find((item) =>
        products.find((p) => p.id === item.productId)?.category === 'lenses',
      );
      const rightEye = sale.prescription
        ? `SPH:${sale.prescription.od.sph} CYL:${sale.prescription.od.cyl} AXIS:${sale.prescription.od.axis} ADD:${sale.prescription.od.add}`
        : undefined;
      const leftEye = sale.prescription
        ? `SPH:${sale.prescription.os.sph} CYL:${sale.prescription.os.cyl} AXIS:${sale.prescription.os.axis} ADD:${sale.prescription.os.add}`
        : undefined;

      const saleData: Sale = {
        id: createId('sal'),
        ...sale,
        createdAt: Date.now(),
      };

      setSales((prev) => [saleData, ...prev].sort((a, b) => b.createdAt - a.createdAt));

      setProducts((prev) =>
        prev.map((product) => {
          const soldItem = sale.items.find((item) => item.productId === product.id);
          if (!soldItem) return product;

          return {
            ...product,
            stock: Math.max(0, product.stock - soldItem.quantity),
            updatedAt: Date.now(),
          };
        }),
      );

      if (sale.customerId && sale.customerId !== 'new-customer') {
        setCustomers((prev) =>
          prev.map((customer) => {
            if (customer.id !== sale.customerId) return customer;
            return {
              ...customer,
              totalSpent: (customer.totalSpent || 0) + sale.total,
              lastVisit: Date.now(),
              latestPrescription: sale.prescription || customer.latestPrescription,
              latestRightEyeNumber: rightEye || customer.latestRightEyeNumber,
              latestLeftEyeNumber: leftEye || customer.latestLeftEyeNumber,
              latestFrameName: sale.frameSelection || frameItem?.name || customer.latestFrameName,
              latestFrameCost: sale.frameSelection ? (Number((sale as any).manualFrameCost) || frameItem?.total || customer.latestFrameCost) : (frameItem?.total || customer.latestFrameCost),
              latestLensName: sale.lensType || lensItem?.name || customer.latestLensName,
              latestLensCost: sale.lensType ? (Number((sale as any).manualLensCost) || lensItem?.total || customer.latestLensCost) : (lensItem?.total || customer.latestLensCost),
              latestOrderTotal: sale.total,
            };
          }),
        );
      } else if (sale.customerName?.trim()) {
        const newCustomer: Customer = {
          id: createId('cus'),
          name: sale.customerName.trim(),
          totalSpent: sale.total,
          lastVisit: Date.now(),
          createdAt: Date.now(),
          latestPrescription: sale.prescription,
          latestRightEyeNumber: rightEye,
          latestLeftEyeNumber: leftEye,
          latestFrameName: sale.frameSelection || frameItem?.name,
          latestFrameCost: Number((sale as any).manualFrameCost) || frameItem?.total,
          latestLensName: sale.lensType || lensItem?.name,
          latestLensCost: Number((sale as any).manualLensCost) || lensItem?.total,
          latestOrderTotal: sale.total,
        };
        setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      setError(sanitizeError(err, 'Failed to process sale'));
    }
  };

  const handleAddCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    try {
      const newCustomer: Customer = {
        id: createId('cus'),
        ...customer,
        createdAt: Date.now(),
      };
      setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      return newCustomer;
    } catch (err) {
      setError(sanitizeError(err, 'Failed to add customer'));
      throw err;
    }
  };

  const handleUpdatePrescription = async (saleId: string, prescription: Prescription) => {
    try {
      const sale = sales.find((s) => s.id === saleId);
      setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, prescription } : s)));

      if (sale && sale.customerId && sale.customerId !== 'new-customer') {
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === sale.customerId ? { ...customer, latestPrescription: prescription } : customer,
          ),
        );
      }
    } catch (err) {
      setError(sanitizeError(err, 'Failed to update prescription'));
    }
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f7f9fb] gap-4">
        <Loader2 className="w-12 h-12 text-[#3856c4] animate-spin" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Initializing FocusHub...</p>
      </div>
    );
  }

  if (!userProfile) {
    return <Auth cloudEnabled={isCloudEnabled()} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} onLogout={handleLogout}>
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-xs font-black uppercase tracking-widest">Dismiss</button>
        </div>
      )}
      
      {activeTab === 'dashboard' && (
        <Dashboard sales={sales} products={products} customers={customers} onNavigate={setActiveTab} />
      )}
      {activeTab === 'inventory' && (
        <Inventory products={products} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />
      )}
      {activeTab === 'sales' && (
        <Sales 
          customers={customers} 
          products={products} 
          userProfile={userProfile}
          onAddSale={handleAddSale} 
          onAddCustomer={handleAddCustomer} 
        />
      )}
      {activeTab === 'customers' && (
        <Customers customers={customers} sales={sales} onAddCustomer={handleAddCustomer} />
      )}
      {activeTab === 'prescriptions' && (
        <Prescriptions sales={sales} onUpdatePrescription={handleUpdatePrescription} />
      )}
      {activeTab === 'settings' && (
        <UserProfileSettings userProfile={userProfile} onSave={handleSaveProfile} />
      )}
    </Layout>
  );
}
