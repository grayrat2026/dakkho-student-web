'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Star, ThumbsUp, ThumbsDown, MessageCircle, Filter,
  TrendingUp, Award, Users, ChevronDown, BarChart3,
  AlertCircle, PenLine, X,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { useInstructor } from '@/lib/data-hooks';
import { reviewsApi, type InstructorReview, type ReviewStats } from '@/lib/api-client';
import { useAuthStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { GlassCard } from '../shared/GlassCard';
import { AnimatedPage } from '../shared/AnimatedPage';
import { GradientButton } from '../shared/GradientButton';
import { ProgressBar } from '../shared/ProgressBar';

const DEFAULT_STATS: ReviewStats = {
  average_rating: 0,
  total_reviews: 0,
  rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
};

export function InstructorReviewsPage() {
  const { pageParams, navigate, goBack } = useNavigationStore();
  const instructorId = pageParams.instructorId as string;
  const { data: instructor, loading: instructorLoading } = useInstructor(instructorId);
  const { user, isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = useState<InstructorReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest'>('recent');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!instructorId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await reviewsApi.getInstructorReviews(instructorId, page, 10);
      if (result.success) {
        setReviews(result.reviews || []);
        setStats(result.stats || DEFAULT_STATS);
      } else {
        setReviews([]);
        setStats(DEFAULT_STATS);
      }
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setError(err.message || 'Failed to load reviews');
      setReviews([]);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [instructorId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const result = await reviewsApi.createReview(instructorId, {
        rating: reviewRating,
        review: reviewText,
        is_anonymous: isAnonymous,
      });
      if (result.success) {
        toast({ title: 'Review submitted successfully' });
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewText('');
        setIsAnonymous(false);
        fetchReviews();
      } else {
        toast({ title: result.error || 'Failed to submit review', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err.message || 'Failed to submit review', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewsApi.markHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
      );
    } catch (err: any) {
      toast({ title: 'Failed to mark as helpful', variant: 'destructive' });
    }
  };

  const handleMarkUnhelpful = async (reviewId: string) => {
    try {
      await reviewsApi.markUnhelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, unhelpful: r.unhelpful + 1 } : r))
      );
    } catch (err: any) {
      toast({ title: 'Failed to mark as unhelpful', variant: 'destructive' });
    }
  };

  if (instructorLoading) {
    return (
      <AnimatedPage>
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Loading instructor...</p>
        </div>
      </AnimatedPage>
    );
  }

  if (!instructor) {
    return (
      <AnimatedPage>
        <div className="text-center py-16">
          <p className="text-lg font-bold">Instructor not found</p>
          <GradientButton onClick={goBack} className="mt-4">Go Back</GradientButton>
        </div>
      </AnimatedPage>
    );
  }

  const filteredReviews = reviews
    .filter((r) => ratingFilter === null || r.rating === ratingFilter)
    .sort((a, b) => {
      if (sortBy === 'helpful') return b.helpful - a.helpful;
      if (sortBy === 'highest') return b.rating - a.rating;
      return 0; // recent — API already sorted
    });

  const ratingDist = [5, 4, 3, 2, 1].map((star) => {
    const count = stats.rating_distribution[star] || 0;
    return {
      star,
      count,
      percentage: stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0,
    };
  });

  const averageRating = stats.average_rating || instructor.rating || 0;
  const totalReviews = stats.total_reviews || 0;

  return (
    <AnimatedPage keyProp={`instructor-reviews-${instructorId}`}>
      <div className="pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <motion.div className="flex items-center gap-2 text-sm text-muted-foreground mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => navigate('home')} className="hover:text-sky-500 transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => navigate('instructor-profile', { instructorId })} className="hover:text-sky-500 transition-colors">{instructor.name}</button>
          <span>/</span>
          <span className="text-foreground font-semibold">Reviews</span>
        </motion.div>

        {/* Header with rating overview */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-lg font-extrabold"
              whileHover={{ scale: 1.05 }}
            >
              {instructor.name.charAt(0)}
            </motion.div>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold text-foreground">Instructor Reviews</h1>
              <p className="text-sm text-sky-500 font-semibold">{instructor.name}</p>
            </div>
            {isAuthenticated && (
              <GradientButton size="sm" onClick={() => setShowReviewForm(true)}>
                <PenLine className="w-3 h-3" /> Write a Review
              </GradientButton>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Overall rating */}
            <div className="text-center sm:text-left sm:pr-6 sm:border-r border-white/20 dark:border-white/5 flex-shrink-0">
              <div className="text-4xl font-extrabold text-foreground">{averageRating.toFixed(1)}</div>
              <div className="flex gap-0.5 justify-center sm:justify-start mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{totalReviews} reviews</p>
              <p className="text-xs text-muted-foreground">{instructor.totalStudents.toLocaleString()} students</p>
            </div>

            {/* Distribution */}
            <div className="flex-1 space-y-2">
              {ratingDist.map((item) => (
                <button
                  key={item.star}
                  className="w-full flex items-center gap-3 group"
                  onClick={() => setRatingFilter(ratingFilter === item.star ? null : item.star)}
                >
                  <span className="text-xs font-medium text-foreground w-3">{item.star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <ProgressBar value={item.percentage} size="sm" className="flex-1" color={ratingFilter === item.star ? 'bg-sky-500' : 'bg-amber-400'} />
                  <span className="text-xs text-muted-foreground w-6 text-right">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Review Form Modal */}
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <GlassCard className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Write a Review</h3>
                <button onClick={() => setShowReviewForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Star selector */}
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.button
                    key={s}
                    onClick={() => setReviewRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Star className={`w-7 h-7 transition-colors ${
                      s <= (hoverRating || reviewRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted'
                    }`} />
                  </motion.button>
                ))}
                {reviewRating > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {reviewRating === 1 ? 'Poor' : reviewRating === 2 ? 'Fair' : reviewRating === 3 ? 'Good' : reviewRating === 4 ? 'Very Good' : 'Excellent'}
                  </span>
                )}
              </div>

              {/* Text area */}
              <textarea
                className="w-full p-3 rounded-xl bg-muted/30 border border-white/10 dark:border-white/5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                rows={4}
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              {/* Anonymous checkbox */}
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-muted-foreground"
                />
                <span className="text-xs text-muted-foreground">Submit anonymously</span>
              </label>

              {/* Submit */}
              <div className="flex justify-end mt-4">
                <GradientButton
                  onClick={handleSubmitReview}
                  disabled={submitting || reviewRating === 0}
                >
                  {submitting ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Review'
                  )}
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Error state */}
        {error && !loading && (
          <GlassCard className="p-6 mb-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Failed to load reviews</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <GradientButton size="sm" onClick={fetchReviews} className="ml-auto">Retry</GradientButton>
            </div>
          </GlassCard>
        )}

        {/* Sort */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-foreground">{filteredReviews.length} Reviews</span>
          <div className="flex gap-2">
            {[
              { key: 'recent' as const, label: 'Recent' },
              { key: 'helpful' as const, label: 'Helpful' },
              { key: 'highest' as const, label: 'Highest' },
            ].map((option) => (
              <motion.button
                key={option.key}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  sortBy === option.key ? 'bg-sky-500 text-white' : 'bg-muted/30 text-muted-foreground'
                }`}
                onClick={() => setSortBy(option.key)}
                whileTap={{ scale: 0.95 }}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-muted/30 rounded animate-pulse" />
                    <div className="h-3 w-1/4 bg-muted/30 rounded animate-pulse" />
                    <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-muted/30 rounded animate-pulse" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Reviews list */}
        {!loading && (
          <div className="space-y-4">
            {filteredReviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {review.studentName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-foreground">{review.studentName}</h4>
                        <span className="text-[10px] text-muted-foreground">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                          ))}
                        </div>
                        {review.courseName && (
                          <span className="text-xs text-sky-500 font-semibold truncate">{review.courseName}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <motion.button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-sky-500 transition-colors"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleMarkHelpful(review.id)}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Helpful ({review.helpful})
                        </motion.button>
                        <motion.button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleMarkUnhelpful(review.id)}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          ({review.unhelpful})
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredReviews.length === 0 && (
          <GlassCard className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {ratingFilter ? 'No reviews found for this filter.' : 'No reviews yet.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {ratingFilter ? 'Try changing the filter.' : 'Be the first to share your experience!'}
            </p>
            {isAuthenticated && !ratingFilter && (
              <GradientButton size="sm" className="mt-4" onClick={() => setShowReviewForm(true)}>
                <PenLine className="w-3 h-3" /> Write a Review
              </GradientButton>
            )}
          </GlassCard>
        )}

        {/* Pagination */}
        {totalReviews > 10 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <GradientButton
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </GradientButton>
            <span className="text-xs text-muted-foreground">Page {page}</span>
            <GradientButton
              size="sm"
              disabled={reviews.length < 10}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </GradientButton>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
