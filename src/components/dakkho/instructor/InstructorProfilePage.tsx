'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, BookOpen, Globe, Youtube, Linkedin, ChevronLeft, BookMarked } from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { useInstructor, useInstructorCourses } from '@/lib/data-hooks';
import { formatDuration } from '@/lib/mock-data';
import { GlassCard } from '../shared/GlassCard';
import { CourseCardGrid } from '../shared/CourseCardGrid';
import { AnimatedCounter } from '../shared/AnimatedCounter';
import { GradientButton } from '../shared/GradientButton';

type Tab = 'courses' | 'subjects';

export function InstructorProfilePage() {
  const { pageParams, navigate, goBack } = useNavigationStore();
  const instructorId = pageParams.instructorId as string;
  const { data: instructor, loading: instructorLoading } = useInstructor(instructorId);
  const { data: courses, subjectsData } = useInstructorCourses(instructorId);
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  if (instructorLoading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground mt-3">Loading instructor...</p>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold">Instructor not found</p>
        <GradientButton onClick={goBack} className="mt-4">Go Back</GradientButton>
      </div>
    );
  }

  const coverColors = ['from-sky-400 to-blue-600', 'from-emerald-400 to-teal-600', 'from-purple-400 to-indigo-600'];

  // Group subjects by course for the Subjects tab
  const subjectsByCourse = subjectsData.reduce<Record<string, { courseTitle: string; subjects: string[] }>>(
    (acc, item) => {
      if (!acc[item.courseId]) {
        acc[item.courseId] = { courseTitle: item.courseTitle, subjects: [] };
      }
      if (!acc[item.courseId].subjects.includes(item.subjectName)) {
        acc[item.courseId].subjects.push(item.subjectName);
      }
      return acc;
    },
    {}
  );

  return (
    <div>
      <motion.button
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        onClick={goBack}
        whileHover={{ x: -3 }}
      >
        <ChevronLeft className="w-4 h-4" />
        Go Back
      </motion.button>

      {/* Cover + Avatar */}
      <GlassCard className="overflow-hidden mb-6">
        <div className={`h-32 md:h-48 ${instructor.coverUrl && !coverError ? '' : 'bg-gradient-to-br ' + coverColors[0]} relative`}>
          {instructor.coverUrl && !coverError ? (
            <img
              src={instructor.coverUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setCoverError(true)}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            {instructor.avatarUrl && !avatarError ? (
              <img
                src={instructor.avatarUrl}
                alt={instructor.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-extrabold">
                {instructor.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 pt-4">
          <h1 className="text-xl font-extrabold text-foreground">{instructor.name}</h1>
          <p className="text-sm text-sky-500 font-semibold">{instructor.specialization}</p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{instructor.bio}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <AnimatedCounter target={instructor.totalStudents} className="text-xl font-extrabold text-foreground" />
              <p className="text-xs text-muted-foreground mt-0.5">Students</p>
            </div>
            <div className="text-center">
              <AnimatedCounter target={instructor.totalCourses} className="text-xl font-extrabold text-foreground" />
              <p className="text-xs text-muted-foreground mt-0.5">Courses</p>
            </div>
            <div className="text-center">
              <span className="text-xl font-extrabold text-foreground">{instructor.rating}</span>
              <p className="text-xs text-muted-foreground mt-0.5">Rating</p>
            </div>
          </div>

          {/* Social links */}
          {instructor.socialLinks && instructor.socialLinks.length > 0 && (
            <div className="flex gap-3 mt-4">
              {instructor.socialLinks.map((link, i) => (
                <motion.a
                  key={i}
                  href={link.url}
                  className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  {link.platform === 'linkedin' ? <Linkedin className="w-4 h-4 text-muted-foreground" /> : <Youtube className="w-4 h-4 text-muted-foreground" />}
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <motion.button
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-muted/30 text-muted-foreground'
          }`}
          onClick={() => setActiveTab('courses')}
          whileTap={{ scale: 0.95 }}
        >
          <BookOpen className="w-4 h-4" /> Courses
        </motion.button>
        <motion.button
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-muted/30 text-muted-foreground'
          }`}
          onClick={() => setActiveTab('subjects')}
          whileTap={{ scale: 0.95 }}
        >
          <BookMarked className="w-4 h-4" /> Subjects
        </motion.button>
      </div>

      {/* Tab Content */}
      {activeTab === 'courses' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-lg font-extrabold text-foreground mb-4">Courses by {instructor.name}</h2>
          <CourseCardGrid courses={courses} />
        </motion.div>
      )}

      {activeTab === 'subjects' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-lg font-extrabold text-foreground mb-4">Subjects by {instructor.name}</h2>
          {Object.keys(subjectsByCourse).length === 0 ? (
            <GlassCard className="p-6">
              <div className="text-center py-8">
                <BookMarked className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {courses.length > 0
                    ? 'No subject assignments found. The instructor may be directly assigned to courses.'
                    : 'No subjects or courses found for this instructor.'}
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {Object.entries(subjectsByCourse).map(([courseId, { courseTitle, subjects }]) => (
                <GlassCard key={courseId} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{courseTitle}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {subjects.map((subject, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                          >
                            <BookMarked className="w-3 h-3 mr-1" />
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
