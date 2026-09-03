import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Truck, ChevronDown, Loader2, CreditCard, Ticket, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import { DISTRICT_AREA_DATA } from '../constants';

const Checkout: React.FC = () => {
  const { cart, appliedCoupon, placeOrder, shippingSettings, user, userProfile, addresses, restoreCart, clearCart } = useStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    district: '',
    area: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);
  const [redirectOrderInfo, setRedirectOrderInfo] = useState<{ id: string; amount: number } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

  useEffect(() => {
    if (user) {
      const defaultAddress = addresses.length > 0 ? addresses[0] : null;
      setFormData(prev => ({
        ...prev,
        fullName: userProfile?.full_name || user.user_metadata?.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: defaultAddress?.phone || prev.phone,
        address: defaultAddress?.addressLine || prev.address,
        district: defaultAddress?.district || prev.district,
        area: defaultAddress?.area || prev.area
      }));
    }

    const params = new URLSearchParams(window.location.search);
    const err = params.get('payment_error');
    if (err) {
      setCheckoutError(decodeURIComponent(err));
      // Auto-restore cart items if returning from failed or cancelled payment
      restoreCart();
    }
  }, [user, userProfile, addresses, restoreCart]);
  
  const districts = Object.keys(DISTRICT_AREA_DATA).sort((a, b) => a.localeCompare(b));
  const areas = formData.district ? DISTRICT_AREA_DATA[formData.district] : [];

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const isDhaka = formData.district?.toLowerCase() === 'dhaka';
  const shipping = formData.district ? (isDhaka ? shippingSettings.insideDhaka : shippingSettings.outsideDhaka) : 0;
  
  let discount = 0;
  if (appliedCoupon) {
      discount = appliedCoupon.discountType === 'Fixed' ? appliedCoupon.discountValue : (subtotal * appliedCoupon.discountValue / 100);
  }
  const total = subtotal + shipping - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'district') setFormData(prev => ({ ...prev, [name]: value, area: '' }));
    else setFormData(prev => ({ ...prev, [name]: value }));
    setCheckoutError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (cart.length === 0) {
      alert("Your cart is empty. Please add products to cart before checkout.");
      return;
    }

    // Capture the exact full order total (subtotal + shipping - discount) BEFORE any async action
    const calculatedPayableTotal = Math.max(1, Math.round(total));
    
    setIsSubmitting(true);
    setCheckoutError(null);
    if (paymentMethod === 'online') {
      setIsRedirectingPayment(true);
      setRedirectOrderInfo({
        id: '',
        amount: calculatedPayableTotal
      });
    }

    try {
      console.log("Placing order with formData:", formData);
      const order = await placeOrder({
        ...formData,
        paymentMethod: paymentMethod === 'online' ? 'Online Payment (Card/MFS)' : 'Cash on Delivery'
      });
      console.log("Order placed successfully:", order);

      // Get exact final amount from created order or fallback to calculatedPayableTotal
      const finalPayableAmount = Math.max(1, Math.round(Number(order.total) || calculatedPayableTotal));
      
      if (paymentMethod === 'online') {
        setRedirectOrderInfo({
          id: order.id,
          amount: finalPayableAmount
        });
        console.log("Initiating online payment for total amount:", finalPayableAmount);
        try {
          const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: finalPayableAmount,
              transactionId: order.id,
              customerName: formData.fullName,
              customerEmail: formData.email,
              customerPhone: formData.phone
            })
          });
          
          const data = await response.json();
          console.log("Payment API Response:", data);
          if (data.gatewayUrl) {
            console.log("Redirecting to:", data.gatewayUrl);
            clearCart();
            localStorage.removeItem('cart');
            window.location.href = data.gatewayUrl;
            return;
          } else {
            throw new Error(data.error || 'Failed to initialize payment');
          }

        } catch (err: any) {
          console.error("Payment Error:", err);
          restoreCart();
          setCheckoutError(`Order placed (ID: ${order.id}), but payment initialization failed: ${err.message}. Please contact support.`);
          setIsSubmitting(false);
          setIsRedirectingPayment(false);
          return;
        }
      }

      navigate(`/order-success/${order.id}`, { 
        state: { order, paymentMethod },
        replace: true 
      });

    } catch (err: any) {
      console.error("Detailed Checkout Error:", err);
      restoreCart();
      setIsRedirectingPayment(false);
      
      let msg = "Something went wrong while processing your order.";
      if (err) {
        if (typeof err === 'string') {
          msg = err;
        } else if (err.message && typeof err.message === 'string') {
          msg = err.message;
        } else if (err.details && typeof err.details === 'string') {
          msg = err.details;
        } else if (err.error_description && typeof err.error_description === 'string') {
          msg = err.error_description;
        } else {
          try {
            msg = JSON.stringify(err);
            if (msg === '{}' || msg === '[]') msg = "Database connection error. Please contact store support.";
          } catch (e) {
            msg = "An unexpected error occurred. Please check your internet connection.";
          }
        }
      }
      
      setCheckoutError(msg);
      setIsSubmitting(false);
      alert(`Checkout Failed: ${msg}`);
    }
  };

  // Reassuring, bank-grade redirection screen while connecting to SSLCommerz
  if (isRedirectingPayment || (isSubmitting && paymentMethod === 'online')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 text-center animate-in fade-in zoom-in duration-300">
          
          {/* Animated Spinner & Security Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-rose-100 animate-ping opacity-60"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#F0264C] border-r-transparent border-b-[#F0264C] border-l-transparent animate-spin"></div>
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#F0264C] shadow-inner">
              <CreditCard size={30} className="animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">
            Connecting to Payment Gateway...
          </h2>
          <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
            Please wait while we securely transfer you to <span className="font-bold text-[#F0264C]">SSLCommerz</span> to complete your payment.
          </p>

          {/* Order Details Preview Box */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 text-left space-y-2 text-xs">
            {redirectOrderInfo?.id && (
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-gray-800">#{redirectOrderInfo.id}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Payable Amount:</span>
              <span className="font-bold text-[#F0264C] text-sm">৳ {(redirectOrderInfo?.amount || total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Payment Gateway:</span>
              <span className="font-bold text-gray-700">SSLCommerz (Cards / bKash / Nagad)</span>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 font-medium mb-6 flex items-center gap-2 text-left">
            <span className="text-base shrink-0">⚠️</span>
            <span>Please do not refresh, go back, or close this window.</span>
          </div>

          {/* Trust & Security Badges */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1"><Lock size={12} /> 256-Bit SSL</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-500" /> Bank-Grade Security</span>
          </div>
        </div>
      </div>
    );
  }

  // Regular Empty Cart screen (only if not submitting / placing order)
  if (cart.length === 0 && !isSubmitting && !isRedirectingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Your cart is empty</h2>
          <button 
            onClick={() => navigate('/')} 
            className="bg-[#F0264C] hover:bg-[#d01c3f] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-black text-gray-800 mb-8 tracking-tight uppercase">Checkout</h1>
        
        {checkoutError && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
             <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#F0264C] shrink-0 border border-red-50">
                <AlertCircle size={28} />
             </div>
             <div className="pt-1">
               <h4 className="font-black text-red-800 uppercase text-[10px] tracking-[2px] mb-1">Processing Error</h4>
               <p className="text-sm font-bold text-red-600/90 leading-relaxed">{checkoutError}</p>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-5 md:p-12">
              <h2 className="text-xl font-black text-gray-800 mb-6 md:mb-8 flex items-center gap-4 uppercase tracking-tighter">
                <span className="w-10 h-10 rounded-2xl bg-[#fdf2f5] text-[#F0264C] flex items-center justify-center text-lg font-black border border-rose-100">01</span>
                Delivery Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input required name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="e.g. John Doe" className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:bg-white focus:border-[#F0264C] transition-all text-gray-800 font-bold text-sm md:text-base" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Street Address</label>
                  <input required name="address" value={formData.address} onChange={handleInputChange} placeholder="House, Road, Area details..." className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:bg-white focus:border-[#F0264C] transition-all text-gray-800 font-bold text-sm md:text-base" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">District</label>
                  <div className="relative">
                    <select required name="district" value={formData.district} onChange={handleInputChange} className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:bg-white focus:border-[#F0264C] transition-all appearance-none text-gray-800 font-bold text-sm md:text-base">
                      <option value="" disabled hidden>Select District</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area</label>
                  <div className="relative">
                    <select required name="area" value={formData.area} onChange={handleInputChange} disabled={!formData.district} className={`w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:bg-white focus:border-[#F0264C] transition-all appearance-none text-gray-800 font-bold text-sm md:text-base ${!formData.district ? 'opacity-50' : ''}`}>
                      <option value="" disabled hidden>Select Area</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="01XXXXXXXXX" className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:bg-white focus:border-[#F0264C] transition-all text-gray-800 font-bold text-sm md:text-base" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-5 md:p-12">
               <h2 className="text-xl font-black text-gray-800 mb-6 md:mb-8 flex items-center gap-4 uppercase tracking-tighter">
                 <span className="w-10 h-10 rounded-2xl bg-[#fdf2f5] text-[#F0264C] flex items-center justify-center text-lg font-black border border-rose-100">02</span>
                 Payment Method
               </h2>
               <div className="space-y-4">
                {/* Cash on Delivery */}
                <label className={`flex items-center gap-3 md:gap-6 p-4 md:p-8 border-2 rounded-[1.5rem] md:rounded-[2rem] cursor-pointer transition-all active:scale-[0.99] ${paymentMethod === 'cod' ? 'border-[#F0264C] bg-rose-50/20 shadow-xl shadow-rose-50/20' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 md:w-6 md:h-6 accent-[#F0264C] shrink-0 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-gray-800 text-sm md:text-lg block leading-tight mb-1 md:mb-2">Cash on Delivery</span>
                    <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-[0.5px] md:tracking-[1px] block leading-normal">Standard delivery in 2-3 business days. Pay in cash when receiving.</span>
                  </div>
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm md:shadow-md transition-colors shrink-0 ${paymentMethod === 'cod' ? 'bg-white text-[#F0264C]' : 'bg-gray-50 text-gray-400'}`}>
                    <Truck className="w-5 h-5 md:w-7 md:h-7" />
                  </div>
                </label>

                {/* Card / Online Payment / Mobile Banking */}
                <label className={`flex items-center gap-3 md:gap-6 p-4 md:p-8 border-2 rounded-[1.5rem] md:rounded-[2rem] cursor-pointer transition-all active:scale-[0.99] ${paymentMethod === 'online' ? 'border-[#F0264C] bg-rose-50/20 shadow-xl shadow-rose-50/20' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-5 h-5 md:w-6 md:h-6 accent-[#F0264C] shrink-0 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 md:mb-2 flex-wrap">
                      <span className="font-black text-gray-800 text-sm md:text-lg block leading-tight">Card / Mobile Banking / Net Banking</span>
                      <span className="bg-rose-100 text-[#F0264C] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">SSLCommerz</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-[0.5px] md:tracking-[1px] block leading-normal">Visa, Mastercard, bKash, Nagad, Rocket, DBBL Nexus, Islamic Banks & more.</span>
                  </div>
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm md:shadow-md transition-colors shrink-0 ${paymentMethod === 'online' ? 'bg-white text-[#F0264C]' : 'bg-gray-50 text-gray-400'}`}>
                    <CreditCard className="w-5 h-5 md:w-7 md:h-7" />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 md:p-10 sticky top-28 overflow-hidden">
              <h3 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-tighter flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-bold text-gray-400 capitalize">({cart.length} items)</span>
              </h3>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {cart.map((item, idx) => {
                  return (
                    <div key={idx} className="flex items-center gap-4 py-2 group">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-2 border border-gray-100 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        <img src={item.selectedVariantImage || item.images?.[0] || ''} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-gray-800 leading-tight mb-1 truncate">{item.name}</h4>
                        <div className="text-[10px] text-[#F0264C] font-black uppercase tracking-widest bg-rose-50 w-fit px-2 py-0.5 rounded-lg border border-rose-100">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-sm font-black text-gray-800 whitespace-nowrap">৳{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-gray-50 pt-8 space-y-5 relative z-10">
                <div className="flex justify-between text-[14px] font-bold text-gray-400 uppercase tracking-widest"><span>Subtotal</span><span className="text-gray-800">৳{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-[14px] font-bold text-gray-400 uppercase tracking-widest"><span>Shipping</span><span className="text-gray-800">৳{shipping.toFixed(2)}</span></div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-[14px] font-black text-[#F0264C] items-center bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-in slide-from-right-2">
                    <span className="flex items-center gap-2"><Ticket size={14}/> {appliedCoupon.code}</span>
                    <span>-৳{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                  <span className="text-xl font-black text-[#F0264C] uppercase tracking-tighter">Total</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">৳{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`w-full mt-6 md:mt-10 text-white font-black py-4 md:py-6 rounded-[15px] md:rounded-[20px] shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[1px] md:tracking-[2px] text-sm md:text-[16px] relative z-10 cursor-pointer ${isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#F0264C] hover:bg-[#d01c3f] shadow-rose-100/50 active:scale-95'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </span>
                ) : (
                  paymentMethod === 'online' ? 'Proceed to Payment (SSLCommerz)' : 'Confirm Order'
                )}
              </button>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
