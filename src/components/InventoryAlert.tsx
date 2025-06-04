
import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Product } from '../stores/productStore';

interface InventoryAlertProps {
  product: Product;
}

const InventoryAlert: React.FC<InventoryAlertProps> = ({ product }) => {
  const lowStockThreshold = 5;
  const isLowStock = product.inStock && product.stock !== undefined && product.stock <= lowStockThreshold;
  
  if (!product.inStock) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
        <Package className="w-5 h-5 text-red-500" />
        <div>
          <p className="text-red-800 font-medium">Out of Stock</p>
          <p className="text-red-600 text-sm">This item is currently unavailable</p>
        </div>
      </div>
    );
  }
  
  if (isLowStock) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <div>
          <p className="text-yellow-800 font-medium">Low Stock</p>
          <p className="text-yellow-600 text-sm">Only {product.stock} left in stock</p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default InventoryAlert;
