'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  X,
} from 'lucide-react';
import { booksApi } from '@/lib/api-client';
import { useNavigationStore } from '@/lib/store';

export function BookReaderPage() {
  const navigate = useNavigationStore((s) => s.navigate);
  const goBack = useNavigationStore((s) => s.goBack);
  const pageParams = useNavigationStore((s) => s.pageParams);
  const bookId = (pageParams as any)?.bookId as string;

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageDirection, setPageDirection] = useState(0); // -1 for prev, 1 for next

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const fetchBook = async () => {
    setLoading(true);
    try {
      const data = await booksApi.get(bookId);
      const bookData = data.book || data;
      setBook(bookData);
      setTotalPages(Number(bookData.page_count) || 0);
    } catch (err) {
      console.error('Failed to fetch book:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setPageDirection(-1);
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages || totalPages === 0) {
      setPageDirection(1);
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, totalPages]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(200, z + 25));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(50, z - 25));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'Escape') {
        goBack();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevPage, handleNextPage, goBack]);

  // Progress calculation
  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center animate-pulse">
            <BookOpen className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm text-slate-400">Loading book...</p>
        </motion.div>
      </div>
    );
  }

  if (!book || !book.pdf_url) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">PDF not available for this book</p>
          <button
            onClick={goBack}
            className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{book.title}</h1>
            <p className="text-[10px] text-slate-400">{book.author}</p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4 text-white" />
          </button>
          <span className="text-xs text-slate-400 w-10 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-white" /> : <Maximize2 className="h-4 w-4 text-white" />}
          </button>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: pageDirection * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -pageDirection * 50 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
          >
            <iframe
              ref={iframeRef}
              src={`${book.pdf_url}#page=${currentPage}&toolbar=0&navpanes=0`}
              className="w-full h-full rounded-lg border border-white/10"
              title={book.title}
              style={{ minHeight: '70vh' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 bg-[#0f0f1a]/90 backdrop-blur-xl border-t border-white/[0.06]"
      >
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-white" />
          <span className="text-sm text-white">Previous</span>
        </button>

        <div className="text-center">
          <span className="text-sm text-white font-medium">
            {currentPage}
            {totalPages > 0 && <span className="text-slate-400"> / {totalPages}</span>}
          </span>
          {totalPages > 0 && (
            <p className="text-[10px] text-slate-400">{progress}% complete</p>
          )}
        </div>

        <button
          onClick={handleNextPage}
          disabled={totalPages > 0 && currentPage >= totalPages}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-sm text-white">Next</span>
          <ChevronRight className="h-4 w-4 text-white" />
        </button>
      </motion.div>
    </div>
  );
}

export default BookReaderPage;
