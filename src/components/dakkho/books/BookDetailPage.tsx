'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Package,
  ShoppingCart,
  Download,
  Star,
  Truck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { booksApi } from '@/lib/api-client';
import { useNavigationStore } from '@/lib/store';

export function BookDetailPage() {
  const navigate = useNavigationStore((s) => s.navigate);
  const pageParams = useNavigationStore((s) => s.pageParams);
  const bookId = (pageParams as any)?.bookId as string;

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<any[]>([]);

  useEffect(() => {
    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const fetchBook = async () => {
    setLoading(true);
    try {
      const data = await booksApi.get(bookId);
      setBook(data.book || data);

      // Fetch related books
      if (data.book?.technology_id) {
        const related = await booksApi.list({ technology: String(data.book.technology_id), limit: 4 });
        setRelatedBooks((related.books || []).filter((b: any) => (b.id || b.$id) !== bookId));
      }
    } catch (err) {
      console.error('Failed to fetch book:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!book) return;
    setOrdering(true);
    try {
      const data = await booksApi.order(bookId, {
        delivery_address: book.book_type === 'physical' || book.book_type === 'both' ? deliveryAddress : undefined,
      });
      if (data.pp_url) {
        // Redirect to payment gateway
        window.location.href = data.pp_url;
      } else if (data.success) {
        // Free book or direct access
        navigate('my-books' as any);
      }
    } catch (err: any) {
      console.error('Failed to order book:', err);
    } finally {
      setOrdering(false);
    }
  };

  const handleReadNow = () => {
    navigate('book-reader' as any, { bookId } as any);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a1a] dark:to-[#0F0F1A] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center animate-pulse">
            <BookOpen className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm text-slate-400 dark:text-muted-foreground">Loading book...</p>
        </motion.div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a1a] dark:to-[#0F0F1A] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-300 dark:text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-muted-foreground">Book not found</p>
          <button
            onClick={() => navigate('books' as any)}
            className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-xl"
          >
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  const hasDiscount = book.original_price && Number(book.original_price) > Number(book.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(book.price) / Number(book.original_price)) * 100)
    : 0;
  const isPdf = book.book_type === 'pdf' || book.book_type === 'both';
  const isPhysical = book.book_type === 'physical' || book.book_type === 'both';
  const isFree = Number(book.price) === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a1a] dark:to-[#0F0F1A]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0F0F1A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('books' as any)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-white" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">Book Details</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Book Cover & Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 mb-6"
        >
          {/* Cover */}
          <div className="w-32 h-44 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] shadow-lg">
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {book.title}
            </h2>
            {book.title_bn && (
              <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">{book.title_bn}</p>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">by {book.author}</p>

            {/* Type Badge */}
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                book.book_type === 'pdf' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                book.book_type === 'physical' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' :
                'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400'
              }`}>
                {book.book_type === 'pdf' ? <FileText className="h-3 w-3" /> :
                 book.book_type === 'physical' ? <Package className="h-3 w-3" /> :
                 <BookOpen className="h-3 w-3" />}
                {book.book_type === 'pdf' ? 'PDF Book' : book.book_type === 'physical' ? 'Physical Book' : 'PDF & Physical'}
              </span>
            </div>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">৳{book.price || 0}</span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-400 line-through">৳{book.original_price}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                    -{discountPercent}%
                  </span>
                </>
              )}
              {isFree && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                  FREE
                </span>
              )}
            </div>

            {/* Featured */}
            {book.is_featured && (
              <div className="mt-1.5 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Featured Book</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Description */}
        {book.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {book.description}
            </p>
          </motion.div>
        )}

        {/* Book Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Book Details</h3>
          <div className="space-y-2">
            {book.page_count && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-muted-foreground">Pages</span>
                <span className="text-slate-900 dark:text-white font-medium">{book.page_count}</span>
              </div>
            )}
            {book.category && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-muted-foreground">Category</span>
                <span className="text-slate-900 dark:text-white font-medium">{book.category}</span>
              </div>
            )}
            {book.technology_id && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-muted-foreground">Technology</span>
                <span className="text-slate-900 dark:text-white font-medium">{book.technology_name || book.technology_id}</span>
              </div>
            )}
            {book.stock_count !== undefined && isPhysical && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-muted-foreground">In Stock</span>
                <span className={`font-medium ${Number(book.stock_count) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {Number(book.stock_count) > 0 ? `${book.stock_count} copies` : 'Out of stock'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Delivery Info */}
        {isPhysical && book.delivery_info && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 rounded-2xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Delivery Info</h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400/80">{book.delivery_info}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6 space-y-3"
        >
          {/* PDF Read Now Button */}
          {isPdf && isFree && (
            <button
              onClick={handleReadNow}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:bg-blue-600 transition-colors"
            >
              <FileText className="h-5 w-5" /> Read Now
            </button>
          )}

          {/* Purchase Button */}
          {!isFree && (
            <>
              {/* Delivery address for physical books */}
              {isPhysical && (
                <div className="mb-2">
                  <label className="text-xs text-slate-500 dark:text-muted-foreground mb-1 block">Delivery Address</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your delivery address..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                </div>
              )}
              <button
                onClick={handleOrder}
                disabled={ordering || (isPhysical && !deliveryAddress.trim())}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ShoppingCart className="h-5 w-5" />
                {ordering ? 'Processing...' : isPhysical && isPdf ? 'Buy Book' : isPhysical ? 'Order Book' : 'Purchase PDF'}
              </button>
            </>
          )}

          {/* Already purchased - Read button for PDF */}
          {isPdf && !isFree && book.is_purchased && (
            <button
              onClick={handleReadNow}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 text-white font-semibold text-sm shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors"
            >
              <FileText className="h-5 w-5" /> Read Now
            </button>
          )}
        </motion.div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Related Books</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {relatedBooks.map((rBook: any) => (
                <button
                  key={rBook.id || rBook.$id}
                  onClick={() => {
                    navigate('book-detail' as any, { bookId: rBook.id || rBook.$id } as any);
                    fetchBook();
                  }}
                  className="flex-shrink-0 w-28 text-left"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06]">
                    {rBook.cover_image_url ? (
                      <img src={rBook.cover_image_url} alt={rBook.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-slate-300 dark:text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white mt-1.5 line-clamp-1">{rBook.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-muted-foreground">৳{rBook.price || 0}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default BookDetailPage;
