'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, FileText, Package, Filter } from 'lucide-react';
import { booksApi } from '@/lib/api-client';
import { useNavigationStore } from '@/lib/store';

const TYPE_TABS = [
  { id: 'all', label: 'All Books', icon: BookOpen },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'physical', label: 'Physical', icon: Package },
] as const;

export function BooksPage() {
  const navigate = useNavigationStore((s) => s.navigate);
  const [books, setBooks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    fetchBooks();
  }, [activeType, search]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeType !== 'all') params.book_type = activeType;
      if (search) params.search = search;
      const data = await booksApi.list(params);
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (bookId: string) => {
    navigate('book-detail' as any, { bookId } as any);
  };

  const getBookTypeBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
            <FileText className="h-3 w-3" /> PDF
          </span>
        );
      case 'physical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
            <Package className="h-3 w-3" /> Physical
          </span>
        );
      case 'both':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
            <BookOpen className="h-3 w-3" /> Both
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a1a] dark:to-[#0F0F1A]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0F0F1A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Books</h1>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">{total} books available</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
            <input
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TYPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveType(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-xl bg-slate-200 dark:bg-white/5" />
                  <div className="mt-2 h-4 rounded bg-slate-200 dark:bg-white/5 w-3/4" />
                  <div className="mt-1 h-3 rounded bg-slate-200 dark:bg-white/5 w-1/2" />
                </div>
              ))}
            </motion.div>
          ) : books.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-muted-foreground mb-3" />
              <p className="text-sm text-slate-500 dark:text-muted-foreground">No books found</p>
              {search && (
                <p className="text-xs text-slate-400 dark:text-muted-foreground mt-1">Try a different search term</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="books"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {books.map((book, index) => (
                <motion.button
                  key={book.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleBookClick(book.id || book.$id)}
                  className="text-left group"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] shadow-sm group-hover:shadow-lg transition-shadow">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <BookOpen className="h-8 w-8 text-slate-300 dark:text-muted-foreground" />
                        <span className="text-[10px] text-slate-400 dark:text-muted-foreground">No Cover</span>
                      </div>
                    )}
                    {/* Type Badge */}
                    <div className="absolute top-2 right-2">
                      {getBookTypeBadge(book.book_type)}
                    </div>
                    {/* Featured Badge */}
                    {book.is_featured && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="mt-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5 line-clamp-1">
                      {book.author}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ৳{book.price || 0}
                      </span>
                      {book.original_price && Number(book.original_price) > Number(book.price) && (
                        <span className="text-[10px] text-slate-400 dark:text-muted-foreground line-through">
                          ৳{book.original_price}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BooksPage;
