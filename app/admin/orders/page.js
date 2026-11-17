'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package,
  Calendar,
  User,
  CreditCard,
  Truck,
  Eye,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
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
    case 'refunded':
      return { label: 'Refunded', bg: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
    default:
      return { label: s, bg: 'bg-neutral-50 text-neutral-600 border-neutral-200' };
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  async function loadOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function handleUpdateStatus(orderId, nextStatus) {
    if (!nextStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, notes: statusNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Order status updated to ${nextStatus}`);
        setStatusNotes('');
        setSelectedOrder(data.order);
        loadOrders();
      } else {
        toast.error(data.error || 'Failed to update order status');
      }
    } catch {
      toast.error('Network error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#000000] tracking-tight">Order Management</h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Track multi-vendor customer orders, verify dispatch status, and manage fulfilment workflows.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] text-[#000000]">
          Total Orders: <strong>{orders.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-[#E8E8E8] shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#8A8A8A]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-[#D6D6D6] outline-none bg-white text-[#000000] font-medium"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-[#C9A227] hover:text-[#000000] transition-all"
        >
          Search
        </button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#8A8A8A]">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E8E8]">
          <Package size={32} className="mx-auto text-[#C9A227] mb-2 opacity-60" />
          <p className="font-bold text-sm text-[#000000]">No Orders Found</p>
          <p className="text-xs text-[#6B6B6B] mt-1">There are no orders matching the selected criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E8E8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#E8E8E8] text-[11px] font-bold uppercase tracking-wider text-[#000000]">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Supplier(s)</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0] text-[#333333]">
                {orders.map((o) => {
                  const badge = getStatusBadge(o.status);
                  const orderDate = new Date(o.createdAt || Date.now());
                  const suppliers = Array.from(
                    new Set(
                      (o.items || []).map((it) =>
                        it.seller?.storeName || it.seller?.name || 'Digital World (Official)'
                      )
                    )
                  );

                  return (
                    <tr key={o._id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold font-mono text-[#000000] text-xs">
                          {o.orderNumber || o._id.slice(-8)}
                        </span>
                        <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                          {orderDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          •{' '}
                          {orderDate.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-[#000000]">{o.customer?.name || 'Guest Customer'}</p>
                        <p className="text-[11px] text-[#6B6B6B]">{o.customer?.phone || '—'}</p>
                        {o.customer?.email && (
                          <p className="text-[10px] text-[#8A8A8A] truncate max-w-[150px]">
                            {o.customer.email}
                          </p>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <p className="font-medium text-[#000000] truncate">
                          {o.items?.[0]?.name || 'Item'}
                          {o.items?.length > 1 && ` + ${o.items.length - 1} more`}
                        </p>
                        <p className="text-[11px] text-[#8A8A8A]">
                          Total pieces: {o.items?.reduce((acc, it) => acc + (it.qty || 1), 0)}
                        </p>
                      </td>

                      {/* Suppliers */}
                      <td className="py-3.5 px-4 align-top max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {suppliers.map((sup, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] text-[10px] font-semibold text-[#000000] truncate max-w-[150px]"
                            >
                              {sup}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold uppercase text-[10px] text-[#000000]">
                          {o.paymentMethod === 'cod' ? 'COD' : 'Online / UPI'}
                        </span>
                        <p
                          className={`text-[10px] font-semibold ${
                            o.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {o.paymentStatus?.toUpperCase() || 'PENDING'}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold text-sm text-[#000000]">
                          {formatINR(o.total || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(o);
                            setNewStatus(o.status || 'confirmed');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#000000] text-xs font-bold text-[#000000] hover:bg-[#000000] hover:text-white transition-colors"
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comprehensive Order Detail Modal (Feature 12) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8E8E8] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#F0F0F0] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-[#000000]">
                    Order #{selectedOrder.orderNumber || selectedOrder._id}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      getStatusBadge(selectedOrder.status).bg
                    }`}
                  >
                    {getStatusBadge(selectedOrder.status).label}
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F0] text-[#000000] hover:bg-[#E8E8E8] flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Order Status Management Box */}
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E2D6] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#000000]">
                    Update Order Status
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#D6D6D6] bg-white text-[#000000] outline-none"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={updatingStatus || newStatus === selectedOrder.status}
                      onClick={() => handleUpdateStatus(selectedOrder._id, newStatus)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-[#C9A227] hover:text-[#000000] disabled:opacity-40 transition-colors"
                    >
                      {updatingStatus ? 'Updating…' : 'Update Status'}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Optional status notes (e.g. Courier dispatched via Bluedart tracking #12345)"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#D6D6D6] outline-none bg-white"
                />
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="border border-[#E8E8E8] rounded-2xl divide-y divide-[#F0F0F0] overflow-hidden">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {it.image ? (
                          <div className="w-12 h-12 rounded-xl border border-[#E8E8E8] overflow-hidden relative shrink-0">
                            <Image
                              src={it.image}
                              alt={it.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] border border-[#E8E8E8] flex items-center justify-center text-[#C9A227] shrink-0 font-bold">
                            DW
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#000000] truncate">{it.name}</p>
                          <p className="text-[11px] text-[#6B6B6B]">
                            {[it.color, it.size, it.sku].filter(Boolean).join(' • ')}
                          </p>
                          <p className="text-[10px] text-[#C9A227] font-semibold">
                            Supplier:{' '}
                            {it.seller?.storeName || it.seller?.name || 'Digital World (Official)'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs text-[#000000]">
                          {formatINR((it.price || 0) * (it.qty || 1))}
                        </p>
                        <p className="text-[11px] text-[#8A8A8A]">
                          {formatINR(it.price || 0)} × {it.qty || 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two Column Grid: Customer/Shipping & Price Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Customer & Shipping */}
                <div className="p-4 rounded-2xl border border-[#E8E8E8] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000]">
                    <User size={14} className="text-[#C9A227]" />
                    <span>Customer & Delivery Details</span>
                  </div>
                  <div className="space-y-1 text-xs text-[#5E5E5E]">
                    <p className="font-bold text-[#000000]">{selectedOrder.customer?.name}</p>
                    <p>Phone: {selectedOrder.customer?.phone}</p>
                    {selectedOrder.customer?.email && <p>Email: {selectedOrder.customer.email}</p>}
                    <div className="pt-2 border-t border-[#F0F0F0]">
                      <p className="text-[11px] font-bold text-[#000000] uppercase tracking-wider mb-1">
                        Shipping Address:
                      </p>
                      <p>{selectedOrder.shippingAddress?.line1}</p>
                      {selectedOrder.shippingAddress?.line2 && (
                        <p>{selectedOrder.shippingAddress?.line2}</p>
                      )}
                      <p>
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} —{' '}
                        {selectedOrder.shippingAddress?.pincode}
                      </p>
                      {selectedOrder.shippingAddress?.landmark && (
                        <p className="text-[#8A8A8A]">
                          Landmark: {selectedOrder.shippingAddress?.landmark}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-2xl border border-[#E8E8E8] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000]">
                    <CreditCard size={14} className="text-[#C9A227]" />
                    <span>Payment & Bill Breakdown</span>
                  </div>

                  <div className="space-y-2 text-xs text-[#5E5E5E]">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-[#000000]">
                        {formatINR(selectedOrder.subtotal || 0)}
                      </span>
                    </div>

                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Discount / Savings</span>
                        <span>−{formatINR(selectedOrder.discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Shipping Fee</span>
                      <span className="font-semibold text-[#000000]">
                        {selectedOrder.shippingFee === 0 ? (
                          <span className="text-emerald-700 font-bold">FREE</span>
                        ) : (
                          formatINR(selectedOrder.shippingFee || 0)
                        )}
                      </span>
                    </div>

                    {/* Per-seller breakdown */}
                    {selectedOrder.deliveryBreakdown?.length > 0 && (
                      <div className="p-2 rounded-xl bg-[#FAF7F0] space-y-1 text-[11px]">
                        <p className="font-bold text-[#6B6B6B] uppercase text-[10px]">
                          Per-Supplier Delivery Breakdown:
                        </p>
                        {selectedOrder.deliveryBreakdown.map((b, i) => (
                          <div key={i} className="flex justify-between text-[#5E5E5E]">
                            <span>{b.sellerName || 'Supplier'}</span>
                            <span className="font-semibold">
                              {b.isFreeDelivery ? 'FREE' : formatINR(b.deliveryFee)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#F0F0F0] flex justify-between items-baseline">
                      <span className="font-bold text-sm text-[#000000]">Grand Total</span>
                      <span className="font-bold text-base text-[#000000]">
                        {formatINR(selectedOrder.total || 0)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#F0F0F0] text-[11px] space-y-1 text-[#6B6B6B]">
                      <p>
                        Payment Method:{' '}
                        <strong className="text-[#000000] uppercase">
                          {selectedOrder.paymentMethod || 'Razorpay'}
                        </strong>
                      </p>
                      {selectedOrder.razorpayPaymentId && (
                        <p className="font-mono">
                          Payment Ref: {selectedOrder.razorpayPaymentId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline History */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">
                  Order Status Timeline History
                </h4>
                {selectedOrder.statusHistory?.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-[#C9A227] ml-2 pl-4">
                    {selectedOrder.statusHistory.map((h, i) => (
                      <div key={i} className="relative text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227] absolute -left-[21px] top-1" />
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold uppercase tracking-wider text-[#000000]">
                            {h.status?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-[#8A8A8A]">
                            {new Date(h.timestamp).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono">
                            {h.updaterRole || 'system'}
                          </span>
                        </div>
                        {h.notes && <p className="text-[11px] text-[#5E5E5E] mt-0.5">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8A8A8A]">No status changes recorded yet.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F0F0F0] bg-[#FAFAFA] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold border border-[#000000] text-[#000000] hover:bg-[#000000] hover:text-white transition-colors"
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
