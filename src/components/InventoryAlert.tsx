
import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { useProductStore } from '../stores/productStore';

const InventoryAlert = () => {
  const { products } = useProductStore();
  
  const lowStockProducts = products.filter(product => product.stock < 10 && product.stock > 0);
  const outOfStockProducts = products.filter(product => product.stock === 0);

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
        <h3 className="text-lg font-semibold text-yellow-800">Inventory Alerts</h3>
      </div>
      
      {outOfStockProducts.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-red-700 mb-2 flex items-center">
            <Package className="w-4 h-4 mr-1" />
            Out of Stock ({outOfStockProducts.length})
          </h4>
          <div className="space-y-1">
            {outOfStockProducts.slice(0, 5).map(product => (
              <div key={product.id} className="text-sm text-red-600">
                • {product.name} - {product.sku}
              </div>
            ))}
            {outOfStockProducts.length > 5 && (
              <div className="text-sm text-red-500">
                + {outOfStockProducts.length - 5} more items
              </div>
            )}
          </div>
        </div>
      )}
      
      {lowStockProducts.length > 0 && (
        <div>
          <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Low Stock ({lowStockProducts.length})
          </h4>
          <div className="space-y-1">
            {lowStockProducts.slice(0, 5).map(product => (
              <div key={product.id} className="text-sm text-yellow-600">
                • {product.name} - {product.stock} left - {product.sku}
              </div>
            ))}
            {lowStockProducts.length > 5 && (
              <div className="text-sm text-yellow-500">
                + {lowStockProducts.length - 5} more items
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAlert;
