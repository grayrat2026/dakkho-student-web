'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Package,
  Download,
  Eye,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { booksApi } from '@/lib/api-client';
import { useNavigationStore } from '@/lib/store';

export function MyBooksPage() {
  const navigate = useNavigationStore((s) => s.navigate);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pdf' | 'physical'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await booksApi.myOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch book orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadBook = (bookId: string) => {
    navigate('book-reader' as any, { bookId } as any);
  };

  const handleViewBook = (bookId: string) => {
    navigate('book-detail' as any, { bookId } as any);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" /> {status === 'delivered' ? 'Delivered' : 'Completed'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
            <Truck className="h-3 w-3" /> Shipped
          </span>
        );
      case 'cancelled':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-muted-foreground">
            <AlertCircle className="h-3 w-3" /> {status}
          </span>
        );
    }
  };

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter((o) => {
        const type = o.order_type || o.book_type || 'pdf';
        return type === activeFilter || (activeFilter === 'pdf' && type === 'both') || (activeFilter === 'physical' && type === 'both');
      });

  const pdfOrders = orders.filter((o) => ['pdf', 'both'].includes(o.order_type || o.book_type || 'pdf'));
  const physicalOrders = orders.filter((o) => ['physical', 'both'].includes(o.order_type || o.book_type || 'physical'));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a1a] dark:to-[#0F0F1A]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0F0F1A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Books</h1>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                {pdfOrders.length} PDF &middot; {physicalOrders.length} Physical
              </p>
            </div>
            <button
              onClick={() => navigate('books' as any)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/25"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Browse
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(['all', 'pdf', 'physical'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'pdf' ? 'PDF Books' : 'Physical Books'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.03]">
                  <div className="flex gap-3">
                    <div className="w-16 h-22 rounded-xl bg-slate-200 dark:bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded bg-slate-200 dark:bg-white/5 w-3/4" />
                      <div className="h-3 rounded bg-slate-200 dark:bg-white/5 w-1/2" />
                      <div className="h-3 rounded bg-slate-200 dark:bg-white/5 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-muted-foreground mb-3" />
              <p className="text-sm text-slate-500 dark:text-muted-foreground">
                {activeFilter === 'all' ? 'No books purchased yet' : `No ${activeFilter} books yet`}
              </p>
              <button
                onClick={() => navigate('books' as any)}
                className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-xl"
              >
                Browse Books
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredOrders.map((order, index) => {
                const isPdf = ['pdf', 'both'].includes(order.order_type || order.book_type || 'pdf');
                const isPhysical = ['physical', 'both'].includes(order.order_type || order.book_type || 'physical');
                const isCompleted = ['completed', 'delivered'].includes(order.status);
                const bookId = order.book_id || order.book?.id || order.book?.$id;

                return (
                  <motion.div
                    key={order.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] shadow-sm"
                  >
                    <div className="flex gap-3">
                      {/* Cover */}
                      <div className="w-16 h-22 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06]">
                        {order.book?.cover_image_url || order.cover_image_url ? (
                          <img
                            src={order.book?.cover_image_url || order.cover_image_url}
                            alt={order.book?.title || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-slate-300 dark:text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {order.book?.title || order.book_title || 'Unknown Book'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                          {order.book?.author || order.book_author || ''}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5">
                          {getStatusBadge(order.status)}
                          {isPdf && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400">
                              <FileText className="h-3 w-3" /> PDF
                            </span>
                          )}
                          {isPhysical && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
                              <Package className="h-3 w-3" /> Physical
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-1">
                          Ordered: {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-2">
                          {isPdf && isCompleted && (
                            <button
                              onClick={() => handleReadBook(bookId)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                            >
                              <Eye className="h-3 w-3" /> Read
                            </button>
                          )}
                          {isPdf && isCompleted && (order.book?.pdf_url || order.pdf_url) && (
                            <a
                              href={order.book?.pdf_url || order.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white text-xs font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                              <Download className="h-3 w-3" /> Download
                            </a>
                          )}
                          {!isCompleted && (
                            <button
                              onClick={() => handleViewBook(bookId)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white text-xs font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                              View Details
                            </button>
                          )}
                          {isPhysical && isCompleted && order.tracking_info && (
                            <div className="text-[10px] text-slate-500 dark:text-muted-foreground flex items-center gap-1">
                              <Truck className="h-3 w-3" /> {order.tracking_info}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MyBooksPage;
