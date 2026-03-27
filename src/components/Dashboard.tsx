import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Sale, Product, Customer } from '../types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import SalesHistory from './SalesHistory';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  onNavigate: (tab: string) => void;
}

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
        change >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
      )}>
        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(change)}%
      </div>
    </div>
    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-2xl font-black text-[#2c3437]">{value}</p>
  </div>
);


export default function Dashboard({ sales, products, customers, onNavigate }: DashboardProps) {
  const [showAllSales, setShowAllSales] = useState(false);

  // Build last-7-days chart data from real sales
  const chartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const value = sales
        .filter(s => s.createdAt >= dayStart && s.createdAt < dayEnd)
        .reduce((acc, s) => acc + s.total, 0);
      return { name: days[d.getDay()], value };
    });
  }, [sales]);

  const exportInvoices = () => {
    const data = sales.map(s => ({
      'Invoice ID': s.id.slice(-6).toUpperCase(),
      'Customer': s.customerName || 'N/A',
      'Items': s.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
      'Subtotal': `₹${s.subtotal}`,
      'Tax': `₹${s.tax}`,
      'Discount': `₹${s.discount}`,
      'Total': `₹${s.total}`,
      'Payment': s.paymentMethod,
      'Status': s.status,
      'Date': format(s.createdAt, 'MMM d, yyyy HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `FocusHub_Invoices_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSales = sales.length;
  const totalCustomers = customers.length;
  const totalItemsSold = sales.reduce((acc, sale) => acc + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const lowStock = products.filter(p => p.stock < 10).length;

  const recentSales = [...sales].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          change={12.5} 
          icon={TrendingUp} 
          color="bg-[#3856c4]" 
        />
        <StatCard 
          title="Total Sales" 
          value={totalSales} 
          change={8.2} 
          icon={Receipt} 
          color="bg-[#6d89fa]" 
        />
        <StatCard 
          title="Items Sold" 
          value={totalItemsSold} 
          change={15.4} 
          icon={Package} 
          color="bg-[#0b0f10]" 
        />
        <StatCard 
          title="Total Clients" 
          value={totalCustomers} 
          change={-2.4} 
          icon={Users} 
          color="bg-[#6366f1]" 
        />
        <StatCard 
          title="Low Stock" 
          value={lowStock} 
          change={0} 
          icon={AlertCircle} 
          color="bg-red-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#2c3437]">Sales Performance</h3>
              <p className="text-gray-400 text-xs">Revenue growth over the last 7 days</p>
            </div>
            <select className="bg-[#f7f9fb] border-none rounded-full px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-[#3856c4]/10">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3856c4" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3856c4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3856c4" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-[#2c3437]">Recent Activity</h3>
            <button 
              onClick={exportInvoices}
              className="flex items-center gap-2 px-4 py-2 bg-[#f7f9fb] text-[#3856c4] rounded-full text-xs font-bold hover:bg-[#3856c4]/5 transition-colors"
            >
              <Receipt className="w-3 h-3" />
              <span>Export Invoices</span>
            </button>
          </div>
          <div className="space-y-6">
            {recentSales.length > 0 ? recentSales.map((sale) => (
              <div key={sale.id} className="flex items-start gap-4 group cursor-pointer">
                <div className={cn(
                  "mt-1 w-2 h-2 rounded-full shrink-0",
                  sale.status === 'ready_for_pickup' ? "bg-green-500" : "bg-blue-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2c3437] group-hover:text-[#3856c4] transition-colors">
                    Order #{sale.id.slice(-4).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {sale.customerName} • ₹{sale.total.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    {format(sale.createdAt, 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  sale.status === 'ready_for_pickup' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                )}>
                  {sale.status?.replace('_', ' ') || 'Pending'}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowAllSales(true)}
            className="w-full mt-8 py-3 text-xs font-bold text-[#3856c4] border border-[#3856c4]/10 rounded-xl hover:bg-[#3856c4]/5 transition-colors"
          >
            View All Transactions
          </button>
        </div>
      </div>

      {/* Sales History Modal */}
      {showAllSales && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#f7f9fb] w-full max-w-6xl rounded-[3rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#2c3437]">Transaction History</h3>
                <p className="text-sm text-gray-400">Search and filter through all sales records.</p>
              </div>
              <button 
                onClick={() => setShowAllSales(false)}
                className="p-3 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <SalesHistory sales={sales} />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0b0f10] p-8 rounded-[2rem] text-white overflow-hidden relative group cursor-pointer">
          <div className="relative z-10">
            <h4 className="text-xl font-bold mb-2">New Prescription</h4>
            <p className="text-gray-400 text-sm mb-6">Quickly add eye test results for a client.</p>
            <button onClick={() => onNavigate('sales')} className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
              Start Test
            </button>
          </div>
          <Eye className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-[#3856c4] p-8 rounded-[2rem] text-white overflow-hidden relative group cursor-pointer">
          <div className="relative z-10">
            <h4 className="text-xl font-bold mb-2">Inventory Check</h4>
            <p className="text-white/60 text-sm mb-6">Manage frames, lenses and accessories.</p>
            <button onClick={() => onNavigate('inventory')} className="bg-white text-[#3856c4] px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
              Open Stock
            </button>
          </div>
          <Package className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 overflow-hidden relative group cursor-pointer">
          <div className="relative z-10">
            <h4 className="text-xl font-bold mb-2 text-[#2c3437]">Client Registry</h4>
            <p className="text-gray-400 text-sm mb-6">View and manage your visionary community.</p>
            <button onClick={() => onNavigate('customers')} className="bg-[#0b0f10] text-white px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
              View Clients
            </button>
          </div>
          <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-50 group-hover:scale-110 transition-transform" />
        </div>
      </div>
    </div>
  );
}
