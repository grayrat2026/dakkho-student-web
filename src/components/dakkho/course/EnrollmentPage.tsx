'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, CreditCard, Tag, Shield, ArrowLeft, BookOpen,
  Loader2, Lock, Gift, ChevronRight, X, Sparkles,
} from 'lucide-react';
import { useNavigationStore, useAuthStore } from '@/lib/store';
import { courseApi, packageApi, paymentApi, couponApi, studentProfileApi, enrollmentApi, type CoursePackage } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { AnimatedPage } from '../shared/AnimatedPage';

export function EnrollmentPage() {
  const navigate = useNavigationStore((s) => s.navigate);
  const pageParams = useNavigationStore((s) => s.pageParams);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const courseId = pageParams?.courseId as string || '';

  const [course, setCourse] = useState<any>(null);
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoursePackage | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount?: any; error?: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFreeEnrolling, setIsFreeEnrolling] = useState(false);

  useEffect(() => {
    if (!courseId) {
      navigate('home');
      return;
    }
    // Check if user is already enrolled — redirect to video player
    if (isAuthenticated) {
      studentProfileApi.enrollments({ limit: 100 }).then((res) => {
        const isEnrolled = res.enrollments?.some((e: any) => e.courseId === courseId) || false;
        if (isEnrolled) {
          navigate('video-player', { courseId });
          return;
        }
      }).catch(() => {
        // Not enrolled — continue to enrollment page
      });
    }
    loadData();
  }, [courseId, isAuthenticated]);

  async function loadData() {
    setLoading(true);
    try {
      const [courseRes, pkgRes] = await Promise.all([
        courseApi.get(courseId),
        packageApi.list(courseId).catch(() => ({ packages: [] })),
      ]);
      setCourse(courseRes.course);
      setPackages(pkgRes.packages);
      // Auto-select first/cheapest package
      if (pkgRes.packages.length > 0) {
        setSelectedPackage(pkgRes.packages[0]);
      }
    } catch (err) {
      console.error('Failed to load enrollment data:', err);
      setError('Failed to load course information. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponValid(null);
    try {
      const result = await couponApi.validate(couponCode.trim());
      setCouponValid(result);
    } catch (err: any) {
      setCouponValid({ valid: false, error: err?.message || 'Invalid coupon' });
    } finally {
      setCouponLoading(false);
    }
  }

  async function handlePaidEnroll() {
    if (!selectedPackage) {
      setError('Please select a package');
      return;
    }
    if (!user) {
      navigate('login');
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const result = await paymentApi.create({
        packageId: selectedPackage.id,
        couponCode: couponValid?.valid ? couponCode.trim() : undefined,
      });
      // Redirect to PipraPay checkout
      window.location.href = result.pp_url;
    } catch (err: any) {
      setError(err?.message || 'Payment creation failed. Please try again.');
      setPaying(false);
    }
  }

  async function handleFreeEnroll() {
    if (!user) {
      navigate('login');
      return;
    }
    setIsFreeEnrolling(true);
    setError(null);
    try {
      // Use the dedicated free enrollment API with server-side price validation
      const result = await enrollmentApi.freeEnroll(course.id);
      if (result.success) {
        // Enrollment successful — navigate to course content
        navigate('my-courses');
      } else {
        setError(result.message || 'Enrollment failed. Please try again.');
      }
    } catch (err: any) {
      // Show error instead of navigating to video player
      const errorMsg = err?.response?.data?.error || err?.message || 'Free enrollment failed. Please try again.';
      setError(errorMsg);
      console.error('Free enrollment error:', err);
    } finally {
      setIsFreeEnrolling(false);
    }
  }

  if (loading) {
    return (
      <AnimatedPage keyProp="enrollment-loading">
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-10 h-10 text-sky-500" />
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  if (!course) {
    return (
      <AnimatedPage keyProp="enrollment-error">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Course not found</p>
          <GradientButton onClick={() => navigate('home')} className="mt-4">Back to Home</GradientButton>
        </div>
      </AnimatedPage>
    );
  }

  const isFree = !course.price || course.price === 0;

  return (
    <AnimatedPage keyProp="enrollment">
      <div className="pb-20 lg:pb-0 max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <motion.div className="flex items-center gap-2 text-sm text-muted-foreground mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => navigate('course-detail', { courseId })} className="hover:text-sky-500 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Course
          </button>
          <span>/</span>
          <span className="text-foreground font-semibold">Enrollment</span>
        </motion.div>

        {/* Course Info Card */}
        <GlassCard className="p-5 mb-6">
          <div className="flex gap-4">
            {course.thumbnailUrl && (
              <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted/30">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-foreground line-clamp-2">{course.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {course.instructor?.name || 'Unknown Instructor'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isFree ? (
                  <span className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                    <Gift className="w-4 h-4" /> Free Course
                  </span>
                ) : (
                  <span className="text-lg font-extrabold text-foreground">&#2547;{course.price}</span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <AnimatePresence mode="wait">
          {isFree ? (
            /* ===== FREE COURSE ===== */
            <motion.div
              key="free-enrollment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard className="p-6 text-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <Gift className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h2 className="text-xl font-extrabold text-foreground mb-2">This Course is Free!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Click below to enroll and start learning right away. No payment required.
                </p>

                {/* What you'll get */}
                <div className="space-y-2 mb-6 text-left max-w-xs mx-auto">
                  {['Full course access', 'All video lectures', 'Course resources', 'Progress tracking'].map((item, i) => (
                    <motion.div
                      key={item}
                      className="flex items-center gap-2 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </motion.div>
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-500 mb-4">{error}</p>
                )}

                <GradientButton
                  className="w-full max-w-xs"
                  size="lg"
                  onClick={handleFreeEnroll}
                  loading={isFreeEnrolling}
                  disabled={isFreeEnrolling}
                >
                  <Sparkles className="w-4 h-4" />
                  Enroll for Free
                </GradientButton>
              </GlassCard>
            </motion.div>
          ) : (
            /* ===== PAID COURSE ===== */
            <motion.div
              key="paid-enrollment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Package Selection */}
              {packages.length > 0 && (
                <GlassCard className="p-6">
                  <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-500" />
                    Choose Your Package
                  </h2>
                  <div className="space-y-3">
                    {packages.map((pkg, i) => (
                      <motion.button
                        key={pkg.id}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedPackage?.id === pkg.id
                            ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-900/20'
                            : 'border-white/20 dark:border-white/10 hover:border-sky-300'
                        }`}
                        onClick={() => setSelectedPackage(pkg)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">
                              {pkg.package_type?.charAt(0).toUpperCase() + pkg.package_type?.slice(1) || 'Standard'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {pkg.duration_months ? `${pkg.duration_months} month${pkg.duration_months > 1 ? 's' : ''} access` : 'Lifetime access'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-extrabold text-foreground">&#2547;{pkg.price}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPackage?.id === pkg.id ? 'border-sky-500 bg-sky-500' : 'border-muted-foreground/30'
                            }`}>
                              {selectedPackage?.id === pkg.id && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Coupon Code */}
              <GlassCard className="p-6">
                <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  Have a Coupon?
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponValid(null); }}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 border border-white/20 dark:border-white/10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                  <GradientButton
                    onClick={handleApplyCoupon}
                    loading={couponLoading}
                    disabled={!couponCode.trim() || couponLoading}
                    size="sm"
                  >
                    Apply
                  </GradientButton>
                </div>
                {couponValid && couponValid.valid && (
                  <motion.p
                    className="text-xs text-emerald-500 mt-2 flex items-center gap-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CheckCircle className="w-3 h-3" /> Coupon applied! You'll save on this purchase.
                  </motion.p>
                )}
                {couponValid && !couponValid.valid && (
                  <motion.p
                    className="text-xs text-red-500 mt-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {couponValid.error || 'Invalid coupon code'}
                  </motion.p>
                )}
              </GlassCard>

              {/* Order Summary */}
              <GlassCard className="p-6">
                <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-500" />
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Course</span>
                    <span className="font-semibold text-foreground line-clamp-1 ml-4">{course.title}</span>
                  </div>
                  {selectedPackage && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-semibold text-foreground">
                          {selectedPackage.package_type?.charAt(0).toUpperCase() + selectedPackage.package_type?.slice(1) || 'Standard'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-semibold text-foreground">
                          {selectedPackage.duration_months ? `${selectedPackage.duration_months} month${selectedPackage.duration_months > 1 ? 's' : ''}` : 'Lifetime'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold text-foreground">&#2547;{selectedPackage.price}</span>
                      </div>
                    </>
                  )}
                  {couponValid?.valid && couponValid.discount && (
                    <div className="flex justify-between text-sm text-emerald-500">
                      <span>Coupon Discount</span>
                      <span>-&#2547;{couponValid.discount.discount_value || 0}</span>
                    </div>
                  )}
                  <div className="border-t border-white/20 dark:border-white/10 pt-3 flex justify-between">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-xl font-extrabold text-foreground">
                      &#2547;{selectedPackage?.price || course.price || 0}
                    </span>
                  </div>
                </div>
              </GlassCard>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure payment powered by PipraPay</span>
              </div>

              {error && (
                <GlassCard className="p-4 border-red-200 dark:border-red-800/50">
                  <p className="text-sm text-red-500 text-center">{error}</p>
                </GlassCard>
              )}

              {/* Pay Button */}
              <GradientButton
                className="w-full"
                size="lg"
                onClick={handlePaidEnroll}
                loading={paying}
                disabled={paying || !selectedPackage}
              >
                <Lock className="w-4 h-4" />
                {paying ? 'Processing...' : `Pay &#2547;${selectedPackage?.price || course.price || 0}`}
              </GradientButton>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  You'll need to <button onClick={() => navigate('login')} className="text-sky-500 font-semibold hover:underline">sign in</button> to complete enrollment
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
}
