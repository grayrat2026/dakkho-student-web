'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ThumbsUp, ThumbsDown, ChevronLeft, Send, User,
  MessageCircle, Filter, TrendingUp, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { useCourse } from '@/lib/data-hooks';
import { courseReviewsApi, getAuthToken } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { AnimatedPage } from '../shared/AnimatedPage';
import { GradientButton } from '../shared/GradientButton';
import { ProgressBar } from '../shared/ProgressBar';

interface CourseReview {
  id: number;
  course_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  review: string | null;
  is_anonymous: number;
  helpful: number;
  unhelpful: number;
  created_at: string;
  updated_at: string;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

export function CourseReviewsPage() {
  const { pageParams, navigate, goBack } = useNavigationStore();
  const courseId = pageParams.courseId as string;
  const { data: course, loading: courseLoading, error: courseError } = useCourse(courseId);

  // Reviews state
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter / sort state
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');

  // Review form state
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Helpful/unhelpful tracking
  const [votedReviews, setVotedReviews] = useState<Record<number, 'helpful' | 'unhelpful'>>({});

  const fetchReviews = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setReviewsLoading(!append);
      setReviewsError(null);

      const result = await courseReviewsApi.getReviews(courseId, pageNum, 10);

      if (result.success) {
        const newReviews = result.reviews as CourseReview[];
        setReviews(append ? (prev) => [...prev, ...newReviews] : newReviews);
        setStats(result.stats);
        setPage(pageNum);
        setHasMore(newReviews.length >= 10);
      }
    } catch (err: any) {
      console.error('Failed to fetch course reviews:', err);
      setReviewsError(err.message || 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchReviews(1);
    }
  }, [courseId, fetchReviews]);

  // Derived filtered & sorted reviews
  const filteredReviews = reviews
    .filter((r) => ratingFilter === null || r.rating === ratingFilter)
    .sort((a, b) => {
      if (sortBy === 'helpful') return (b.helpful || 0) - (a.helpful || 0);
      // 'recent' — already sorted by created_at DESC from API, keep order
      return 0;
    });

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: stats.rating_distribution[star] || 0,
    percentage: stats.total_reviews > 0
      ? ((stats.rating_distribution[star] || 0) / stats.total_reviews) * 100
      : 0,
  }));

  const handleSubmitReview = async () => {
    if (newRating < 1) return;

    const token = getAuthToken();
    if (!token) {
      setSubmitError('Please login to submit a review');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      await courseReviewsApi.createReview(courseId, {
        rating: newRating,
        review: newReview || undefined,
        is_anonymous: isAnonymous,
      });

      setSubmitSuccess(true);
      setNewReview('');
      setNewRating(0);
      setIsAnonymous(false);
      setShowReviewForm(false);

      // Refresh reviews
      await fetchReviews(1);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setSubmitError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: number) => {
    if (votedReviews[reviewId]) return;
    try {
      await courseReviewsApi.markHelpful(String(reviewId));
      setVotedReviews((prev) => ({ ...prev, [reviewId]: 'helpful' }));
      setReviews((prev) =>
        prev.map((r) => r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r)
      );
    } catch {}
  };

  const handleUnhelpful = async (reviewId: number) => {
    if (votedReviews[reviewId]) return;
    try {
      await courseReviewsApi.markUnhelpful(String(reviewId));
      setVotedReviews((prev) => ({ ...prev, [reviewId]: 'unhelpful' }));
      setReviews((prev) =>
        prev.map((r) => r.id === reviewId ? { ...r, unhelpful: (r.unhelpful || 0) + 1 } : r)
      );
    } catch {}
  };

  // Format date relative
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
      if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (courseLoading) {
    return (
      <AnimatedPage>
        <div className="text-center py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted/30 rounded-lg w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted/30 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (courseError || !course) {
    return (
      <AnimatedPage>
        <div className="text-center py-16">
          <p className="text-lg font-bold">Course not found</p>
          <GradientButton onClick={goBack} className="mt-4">Go Back</GradientButton>
        </div>
      </AnimatedPage>
    );
  }

  // Use API stats for the overview, falling back to course data
  const displayRating = stats.total_reviews > 0 ? stats.average_rating : (course.rating || 0);
  const displayTotalReviews = stats.total_reviews > 0 ? stats.total_reviews : (course.totalReviews || 0);

  return (
    <AnimatedPage keyProp={`course-reviews-${courseId}`}>
      <div className="pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <motion.div
          className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button onClick={() => navigate('home')} className="hover:text-sky-500 transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => navigate('course-detail', { courseId })} className="hover:text-sky-500 transition-colors">{course.title}</button>
          <span>/</span>
          <span className="text-foreground font-semibold">Reviews</span>
        </motion.div>

        {/* Rating Overview */}
        <GlassCard className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Overall rating */}
            <div className="text-center sm:text-left sm:pr-6 sm:border-r border-white/20 dark:border-white/5">
              <div className="text-4xl font-extrabold text-foreground">{displayRating.toFixed(1)}</div>
              <div className="flex gap-0.5 justify-center sm:justify-start mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(displayRating) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{displayTotalReviews} review{displayTotalReviews !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground">{course.totalStudents} students</p>
            </div>

            {/* Rating distribution */}
            <div className="flex-1 space-y-2">
              {ratingDist.map((item) => (
                <button
                  key={item.star}
                  className="w-full flex items-center gap-3 group"
                  onClick={() => setRatingFilter(ratingFilter === item.star ? null : item.star)}
                >
                  <span className="text-xs font-medium text-foreground w-3">{item.star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <ProgressBar
                    value={item.percentage}
                    size="sm"
                    className="flex-1"
                    color={ratingFilter === item.star ? 'bg-sky-500' : 'bg-amber-400'}
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Filter and Sort */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {filteredReviews.length} Review{filteredReviews.length !== 1 ? 's' : ''}
              {ratingFilter && ` (${ratingFilter} star)`}
            </span>
          </div>
          <div className="flex gap-2">
            <motion.button
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                sortBy === 'recent' ? 'bg-sky-500 text-white' : 'bg-muted/30 text-muted-foreground'
              }`}
              onClick={() => setSortBy('recent')}
              whileTap={{ scale: 0.95 }}
            >
              Recent
            </motion.button>
            <motion.button
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                sortBy === 'helpful' ? 'bg-sky-500 text-white' : 'bg-muted/30 text-muted-foreground'
              }`}
              onClick={() => setSortBy('helpful')}
              whileTap={{ scale: 0.95 }}
            >
              Most Helpful
            </motion.button>
          </div>
        </div>

        {/* Write Review Button */}
        <motion.div className="mb-6">
          <GlassCard
            hover
            className="p-4 flex items-center gap-3 cursor-pointer"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-sky-500" />
            </div>
            <span className="text-sm font-semibold text-foreground flex-1">Write a Review</span>
            <GradientButton size="sm">Write</GradientButton>
          </GlassCard>
        </motion.div>

        {/* Review Form */}
        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-6 mb-6">
                <h3 className="text-sm font-bold text-foreground mb-4">Your Review</h3>

                {/* Star rating selector */}
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.button
                      key={s}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(s)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star className={`w-7 h-7 transition-colors ${
                        s <= (hoverRating || newRating) ? 'text-amber-400 fill-amber-400' : 'text-muted'
                      }`} />
                    </motion.button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {newRating > 0 ? `${newRating} Star${newRating > 1 ? 's' : ''}` : 'Select rating'}
                  </span>
                </div>

                {/* Review text */}
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your experience with this course..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-white/30 dark:border-white/10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                />

                {/* Anonymous toggle */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      isAnonymous ? 'bg-sky-500' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      isAnonymous ? 'translate-x-5' : ''
                    }`} />
                  </button>
                  <span className="text-xs text-muted-foreground">Submit anonymously</span>
                </div>

                {/* Error / Success messages */}
                {submitError && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
                  </div>
                )}
                {submitSuccess && (
                  <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400">Review submitted successfully!</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <motion.button
                    className="px-4 py-2 rounded-xl bg-muted/30 text-sm font-semibold text-foreground"
                    onClick={() => { setShowReviewForm(false); setNewReview(''); setNewRating(0); setSubmitError(null); }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <GradientButton
                    size="sm"
                    onClick={handleSubmitReview}
                    disabled={submitting || newRating < 1}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Review
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews Loading State */}
        {reviewsLoading && reviews.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading reviews...</p>
          </div>
        )}

        {/* Reviews Error State */}
        {reviewsError && reviews.length === 0 && (
          <GlassCard className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Failed to load reviews</p>
            <GradientButton size="sm" onClick={() => fetchReviews(1)}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </GradientButton>
          </GlassCard>
        )}

        {/* Reviews List */}
        {!reviewsLoading && !reviewsError && (
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
                      {(review.is_anonymous ? 'A' : review.user_name.charAt(0))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-foreground">
                          {review.is_anonymous ? 'Anonymous' : review.user_name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground">{formatDate(review.created_at)}</span>
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                        ))}
                      </div>
                      {review.review && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.review}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <motion.button
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            votedReviews[review.id] === 'helpful'
                              ? 'text-sky-500 font-semibold'
                              : 'text-muted-foreground hover:text-sky-500'
                          }`}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleHelpful(review.id)}
                          disabled={!!votedReviews[review.id]}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Helpful ({review.helpful || 0})
                        </motion.button>
                        <motion.button
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            votedReviews[review.id] === 'unhelpful'
                              ? 'text-red-500 font-semibold'
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleUnhelpful(review.id)}
                          disabled={!!votedReviews[review.id]}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          ({review.unhelpful || 0})
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && reviews.length > 0 && (
          <div className="text-center mt-6">
            <GradientButton
              size="sm"
              onClick={() => fetchReviews(page + 1, true)}
              disabled={reviewsLoading}
            >
              {reviewsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load More'}
            </GradientButton>
          </div>
        )}

        {/* Empty State */}
        {!reviewsLoading && !reviewsError && filteredReviews.length === 0 && (
          <GlassCard className="p-8 text-center">
            {stats.total_reviews === 0 ? (
              <>
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">No reviews yet</p>
                <p className="text-xs text-muted-foreground">Be the first to review this course!</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reviews found for this filter.</p>
              </>
            )}
          </GlassCard>
        )}
      </div>
    </AnimatedPage>
  );
}
