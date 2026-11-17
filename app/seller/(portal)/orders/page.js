'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package,
  Calendar,
  User,
  Truck,
  Eye,
  X,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const SELLER_STATUS_OPTIONS = [
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

function getStatusBadge(status) {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'pending':
      return { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'confirmed':
    case 'placed':
      return { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'processing':
    case 'packed':
      return { label: 'Processing', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'shipped':
      return { label: 'Shipped', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'out_for_delivery':
      return { label: 'Out for Delivery', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'delivered':
      return { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { label: s, bg: 'bg-neutral-50 text-neutral-600 border-neutral-200' };
  }
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  async function load(status = statusFilter) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/seller/orders?${params}`);
      if (res.status === 401) {
        router.push('/seller/login');
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(orderId, nextStatus) {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not update order status');
        return;
      }
      toast.success(`Order marked as ${nextStatus}`);
      setNotes('');
      if (selectedOrder) {
        setSelectedOrder((prev) => ({ ...prev, status: nextStatus }));
      }
      load();
    } catch {
      toast.error('Error updating status');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#000000] tracking-tight">Supplier Orders</h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Orders containing your items. Process packages, dispatch shipments, and track fulfillment.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] text-[#000000]">
          Total Assigned Orders: <strong>{orders.length}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-[#E8E8E8] shadow-xs">
        <Filter size={15} className="text-[#8A8A8A]" />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            load(e.target.value);
          }}
          className="text-xs px-3 py-2 rounded-xl border border-[#D6D6D6] outline-none bg-white font-medium"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#8A8A8A]">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E8]">
          <Package size={32} className="mx-auto text-[#C9A227] mb-2 opacity-60" />
          <p className="font-bold text-sm text-[#000000]">No Orders Found</p>
          <p className="text-xs text-[#6B6B6B] mt-1">You do not have any orders in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const badge = getStatusBadge(o.status);
            const orderDate = new Date(o.createdAt || Date.now());

            return (
              <div
                key={o._id}
                className="bg-white rounded-2xl p-5 border border-[#E8E8E8] shadow-xs space-y-4 hover:border-[#D6D6D6] transition-all"
              >
                {/* Header row */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#F0F0F0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm text-[#000000]">
                        #{o.orderNumber || o._id.slice(-8)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                      {orderDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      at {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      className="px-3 py-1.5 rounded-xl border border-[#000000] text-xs font-bold text-[#000000] hover:bg-[#000000] hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <Eye size={13} />
                      <span>Order Details</span>
                    </button>
                  </div>
                </div>

                {/* Items in this order belonging to this seller */}
                <div className="space-y-2">
                  {o.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 text-[#333333]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#FAF7F0] text-[#000000] font-bold flex items-center justify-center text-[10px] shrink-0">
                          {it.qty}x
                        </span>
                        <span className="font-medium truncate">{it.name}</span>
                        {it.size && (
                          <span className="text-[10px] text-[#6B6B6B] font-semibold">
                            ({it.size})
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[#000000] shrink-0">
                        {formatINR((it.price || 0) * (it.qty || 1))}
                      </span>
                    </div>
                  ))}
                </div>

                {o.otherSellerItemsCount > 0 && (
                  <p className="text-[11px] text-[#8A8A8A] italic">
                    Note: Customer also purchased {o.otherSellerItemsCount} item(s) from other platform suppliers in this combined order.
                  </p>
                )}

                {/* Bottom Total & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F0F0F0] flex-wrap gap-2 text-xs">
                  <div>
                    <span className="text-[#6B6B6B]">Customer: </span>
                    <strong className="text-[#000000]">
                      {o.customer?.name} ({o.customer?.phone})
                    </strong>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[#6B6B6B]">Your Subtotal: </span>
                      <strong className="text-sm text-[#000000]">
                        {formatINR(o.mySubtotal || 0)}
                      </strong>
                    </div>

                    {/* Quick status selector */}
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o._id, e.target.value)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#D6D6D6] bg-white outline-none"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Seller Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E8E8E8] space-y-5">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
              <div>
                <h3 className="font-bold text-base text-[#000000]">
                  Order #{selectedOrder.orderNumber || selectedOrder._id}
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Customer shipping details & fulfilment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Shipping Address */}
            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E7E2D6] space-y-1.5 text-xs">
              <p className="font-bold text-[#000000] uppercase tracking-wider text-[10px]">
                Ship To:
              </p>
              <p className="font-semibold text-sm text-[#000000]">
                {selectedOrder.customer?.name}
              </p>
              <p className="text-[#5E5E5E]">Phone: {selectedOrder.customer?.phone}</p>
              <p className="text-[#5E5E5E]">
                {selectedOrder.shippingAddress?.line1}
                {selectedOrder.shippingAddress?.line2 && `, ${selectedOrder.shippingAddress.line2}`}
              </p>
              <p className="text-[#5E5E5E]">
                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} —{' '}
                {selectedOrder.shippingAddress?.pincode}
              </p>
            </div>

            {/* Status change in modal */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-[#000000]">Update Status:</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder._id, e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-[#D6D6D6]"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing (Packaging)</option>
                  <option value="shipped">Shipped (Dispatched)</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#000000] text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
