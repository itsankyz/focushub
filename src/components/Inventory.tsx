import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Edit2, 
  Trash2,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  SlidersHorizontal,
  Upload,
  Image as ImageIcon,
  Check,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Product } from '../types';
import { cn } from '../lib/utils';
import getCroppedImg from '../lib/cropImage';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onEditProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

export default function Inventory({ products, onAddProduct, onEditProduct, onDeleteProduct }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  
  // Advanced Filters
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    stockStatus: 'all' // all, low, out
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'frames' as any,
    price: 0,
    stock: 0,
    brand: '',
    description: '',
    imageUrl: '',
    imageUrls: [] as string[]
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Cropping State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImage) {
        setNewProduct(prev => ({
          ...prev,
          imageUrl: prev.imageUrl || croppedImage, // Set as primary if none exists
          imageUrls: [...prev.imageUrls, croppedImage]
        }));
      }
    }
    setIsCropping(false);
    setImageToCrop(null);
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => {
      const newUrls = prev.imageUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        imageUrls: newUrls,
        imageUrl: index === 0 ? (newUrls[0] || '') : prev.imageUrl
      };
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filters.category === 'all' || p.category === filters.category;
    const matchesMinPrice = !filters.minPrice || p.price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || p.price <= parseFloat(filters.maxPrice);
    
    let matchesStock = true;
    if (filters.stockStatus === 'low') matchesStock = p.stock > 0 && p.stock < 10;
    if (filters.stockStatus === 'out') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesStock;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddProduct(newProduct);
    setIsAdding(false);
    setNewProduct({ name: '', category: 'frames', price: 0, stock: 0, brand: '', description: '', imageUrl: '', imageUrls: [] });
    setCurrentPage(1);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onEditProduct(editingProduct.id, editForm);
      setEditingProduct(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            className="w-full bg-[#f7f9fb] border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all" 
            placeholder="Search frames, lenses, accessories..." 
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
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#3856c4] text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-[#3856c4]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Category</label>
              <select 
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="all">All Categories</option>
                <option value="frames">Frames</option>
                <option value="lenses">Lenses</option>
                <option value="sunglasses">Sunglasses</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Min Price (₹)</label>
              <input 
                type="number"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Max Price (₹)</label>
              <input 
                type="number"
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                placeholder="Any"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Stock Level</label>
              <select 
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-3 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/10 transition-all"
                value={filters.stockStatus}
                onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock (&lt;10)</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setFilters({ category: 'all', minPrice: '', maxPrice: '', stockStatus: 'all' })}
              className="text-xs font-black uppercase tracking-widest text-[#3856c4] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f9fb] border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Product Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length > 0 ? pagedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#f7f9fb] flex items-center justify-center text-gray-300 overflow-hidden border border-gray-50">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#2c3437]">{product.name}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{product.brand || 'Visionary'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-[#3856c4]">₹{product.price.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            product.stock < 10 ? "bg-red-500" : "bg-green-500"
                          )}
                          style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-bold",
                        product.stock < 10 ? "text-red-500" : "text-gray-500"
                      )}>
                        {product.stock} in stock
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingProduct(product); setEditForm({ name: product.name, brand: product.brand, price: product.price, stock: product.stock, category: product.category }); }}
                        className="p-2 text-gray-400 hover:text-[#3856c4] hover:bg-[#3856c4]/5 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${product.name}"?`)) onDeleteProduct(product.id); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-16 h-16 text-gray-100 mb-4" />
                      <p className="text-gray-400 font-medium">No products found in the inventory</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

          <div className="px-8 py-6 bg-[#f7f9fb] border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredProducts.length)}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-black disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn('w-8 h-8 rounded-lg text-xs font-bold transition-colors', page === currentPage ? 'bg-[#3856c4] text-white' : 'hover:bg-gray-200 text-gray-600')}
                >{page}</button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-black disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-[#2c3437]">New Product</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Multiple Image Management */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Product Gallery</label>
                <div className="grid grid-cols-4 gap-3">
                  {newProduct.imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100">
                      <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      {index === 0 && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#3856c4] text-white text-[8px] font-black uppercase tracking-widest rounded-md">Main</div>
                      )}
                    </div>
                  ))}
                  {newProduct.imageUrls.length < 4 && (
                    <label className="aspect-square flex flex-col items-center justify-center bg-[#f7f9fb] border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <Plus className="w-5 h-5 text-gray-300" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Product Name</label>
                <input
                  required
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                  placeholder="e.g. Ray-Ban Aviator Classic"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Brand</label>
                  <input
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                    placeholder="Ray-Ban"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Category</label>
                  <select
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })}
                  >
                    <option value="frames">Frames</option>
                    <option value="lenses">Lenses</option>
                    <option value="sunglasses">Sunglasses</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Price (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                    placeholder="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Initial Stock</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                    placeholder="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cropper Modal */}
      {isCropping && imageToCrop && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#2c3437]">Crop Image</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Adjust your product photo</p>
              </div>
              <button 
                onClick={() => setIsCropping(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative h-96 bg-gray-900">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zoom Level</label>
                  <span className="text-xs font-bold text-[#3856c4]">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#3856c4]"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsCropping(false)}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCrop}
                  className="flex-1 py-4 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-[#2c3437]">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Product Name</label>
                <input required className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Brand</label>
                  <input className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20" value={editForm.brand || ''} onChange={e => setEditForm({...editForm, brand: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Category</label>
                  <select className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20" value={editForm.category || 'frames'} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                    <option value="frames">Frames</option>
                    <option value="lenses">Lenses</option>
                    <option value="sunglasses">Sunglasses</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Price (₹)</label>
                  <input type="number" required className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20" value={editForm.price ?? ''} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Stock</label>
                  <input type="number" required className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-[#3856c4]/20" value={editForm.stock ?? ''} onChange={e => setEditForm({...editForm, stock: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
