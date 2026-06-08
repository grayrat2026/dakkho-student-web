'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle, Loader2, Play } from 'lucide-react';
import { useAuthStore, useNavigationStore } from '@/lib/store';
import { studentProfileApi } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  enrolledAt: string;
  enrolledVia: string;
  status: string;
  course: {
    id: string;
    title: string;
    thumbnailUrl: string;
    price: number;
    level: string;
    duration: number;
    totalVideos: number;
    technology: string;
    isPublished: boolean;
  } | null;
}

export function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigationStore((s) => s.navigate);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function fetchEnrollments() {
    setLoading(true);
    setError(null);
    try {
      const res = await studentProfileApi.enrollments({ limit: 50 });
      if (res.success) {
        setEnrollments(res.enrollments as EnrolledCourse[]);
      }
    } catch (err: any) {
      console.error('Failed to fetch enrollments:', err);
      setError('Failed to load your courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Filter courses with valid course data
  const validEnrollments = enrollments.filter(e => e.course !== null);

  // For now, all enrolled courses are "in progress" since we don't track completion
  // In the future, check watch progress to determine completion
  const inProgressCourses = validEnrollments;
  const completedCourses: EnrolledCourse[] = []; // Will be populated when completion tracking is implemented

  const displayEnrollments = activeTab === 'all'
    ? validEnrollments
    : activeTab === 'in-progress'
    ? inProgressCourses
    : completedCourses;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading your courses...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Sign in to see your courses</h3>
        <p className="text-sm text-muted-foreground/60 mt-1 mb-6">Enroll in courses and track your learning progress.</p>
        <GradientButton onClick={() => navigate('login')}>Sign In</GradientButton>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-foreground mb-2">My Courses</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {validEnrollments.length > 0
            ? `${validEnrollments.length} course${validEnrollments.length > 1 ? 's' : ''} enrolled`
            : 'Track your learning progress'
          }
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/30 rounded-xl p-1">
        {[
          { key: 'all' as const, label: `All (${validEnrollments.length})`, icon: BookOpen },
          { key: 'in-progress' as const, label: `In Progress (${inProgressCourses.length})`, icon: Clock },
          { key: 'completed' as const, label: `Completed (${completedCourses.length})`, icon: CheckCircle },
        ].map((tab) => (
          <motion.button
            key={tab.key}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-600 dark:text-sky-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.key)}
            whileTap={{ scale: 0.97 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <GlassCard className="p-4 mb-6 border-red-200 dark:border-red-800/50">
          <p className="text-sm text-red-500 text-center">{error}</p>
          <div className="flex justify-center mt-2">
            <button onClick={fetchEnrollments} className="text-xs text-sky-500 font-semibold hover:underline">Retry</button>
          </div>
        </GlassCard>
      )}

      {/* Enrolled courses grid */}
      {displayEnrollments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayEnrollments.map((enrollment, i) => {
            const course = enrollment.course!;
            return (
              <motion.div
                key={enrollment.enrollmentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard
                  hover
                  className="overflow-hidden cursor-pointer"
                  onClick={() => navigate('course-detail', { courseId: course.id })}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted/30 relative overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <motion.div
                      className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      whileHover={{ opacity: 1 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-sky-600 ml-0.5" />
                      </div>
                    </motion.div>
                    {/* Technology badge */}
                    {course.technology && (
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/90 text-white font-bold">
                        {course.technology}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1">{course.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{course.level}</span>
                      <span>·</span>
                      <span>{course.totalVideos} videos</span>
                    </div>
                    {/* Progress bar placeholder */}
                    <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.random() * 40 + 10, 60)}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {activeTab === 'in-progress' ? 'No courses in progress' : activeTab === 'completed' ? 'No completed courses yet' : 'No enrolled courses'}
          </h3>
          <p className="text-sm text-muted-foreground/60 mt-1 mb-6">
            {activeTab === 'all' ? 'Explore courses and enroll to start learning.' : 'Keep learning to see courses here.'}
          </p>
          {activeTab === 'all' && (
            <GradientButton onClick={() => navigate('explore')}>
              Explore Courses
            </GradientButton>
          )}
        </div>
      )}
    </div>
  );
}
