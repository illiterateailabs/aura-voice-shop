
import React, { useState } from 'react';
import { CreditCard, Lock, User, MapPin } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useOrderStore } from '../stores/orderStore';
import { useNotificationStore } from '../stores/notificationStore';

const CheckoutForm = () => {
  const { items, total, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const { addNotification } = useNotificationStore();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });

  const [processing, setProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const shippingAddress = {
      name: `${formData.firstName} ${formData.lastName}`,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
    };

    createOrder(items, shippingAddress, 'Credit Card');
    clearCart();
    
    addNotification({
      type: 'success',
      title: 'Order Placed!',
      message: 'Your order has been successfully placed and will be processed soon.',
    });

    setProcessing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold">Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              
              <input
                type="text"
                name="address"
                placeholder="Street Address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <input
                type="text"
                name="zipCode"
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold">Payment Information</h2>
                <Lock className="w-4 h-4 text-green-500 ml-auto" />
              </div>
              
              <input
                type="text"
                name="cardName"
                placeholder="Name on Card"
                value={formData.cardName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              
              <input
                type="text"
                name="cardNumber"
                placeholder="Card Number"
                value={formData.cardNumber}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  name="cvv"
                  placeholder="CVV"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border h-fit">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} 
                   className="flex items-center space-x-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-gray-600">Qty: {item.quantity}</p>
                  {(item.selectedColor || item.selectedSize) && (
                    <p className="text-sm text-gray-500">
                      {item.selectedColor} {item.selectedSize}
                    </p>
                  )}
                </div>
                <span className="font-medium">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatPrice(total * 0.08)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(total * 1.08)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
