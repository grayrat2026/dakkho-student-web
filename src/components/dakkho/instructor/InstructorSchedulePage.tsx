'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Video, MapPin, Users, Bell,
  ChevronLeft, ChevronRight, Plus, ExternalLink,
  Zap, BookOpen, Globe, Monitor, AlertCircle, CalendarDays,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { useInstructor } from '@/lib/data-hooks';
import { scheduleApi, type ScheduleSession } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import { GlassCard } from '../shared/GlassCard';
import { AnimatedPage } from '../shared/AnimatedPage';
import { GradientButton } from '../shared/GradientButton';

const TYPE_CONFIG = {
  'live': { icon: Video, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500', label: 'Live Session' },
  'office-hours': { icon: Clock, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20', border: 'border-l-sky-500', label: 'Office Hours' },
  'workshop': { icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', border: 'border-l-amber-500', label: 'Workshop' },
  'qna': { icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', border: 'border-l-emerald-500', label: 'Q&A Session' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function InstructorSchedulePage() {
  const { pageParams, navigate, goBack } = useNavigationStore();
  const instructorId = pageParams.instructorId as string;
  const { data: instructor, loading: instructorLoading } = useInstructor(instructorId);

  const [schedules, setSchedules] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [reminders, setReminders] = useState<Set<string>>(new Set());

  const fetchSchedule = useCallback(async () => {
    if (!instructorId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await scheduleApi.getInstructorSchedule(instructorId);
      if (result.success) {
        setSchedules(result.schedules || []);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch schedule:', err);
      setError(err.message || 'Failed to load schedule');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const toggleReminder = (id: string) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: 'Reminder removed' });
      } else {
        next.add(id);
        toast({ title: 'Reminder set!' });
      }
      return next;
    });
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

  const filteredSchedule = schedules
    .filter((s) => filterType === 'all' || s.type === filterType)
    .sort((a, b) => {
      if (a.status === 'live') return -1;
      if (b.status === 'live') return 1;
      return 0;
    });

  // Generate calendar days for current month view
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  // Derive session dates from real schedule data
  const sessionDates = new Set<number>();
  schedules.forEach((s) => {
    try {
      const d = new Date(s.date);
      if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
        sessionDates.add(d.getDate());
      }
    } catch {}
  });

  // Compute stats by type from real data
  const typeCounts = schedules.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  // Next session (first upcoming or live)
  const nextSession = schedules
    .filter((s) => s.status === 'live' || s.status === 'upcoming')
    .sort((a, b) => {
      if (a.status === 'live') return -1;
      if (b.status === 'live') return 1;
      return 0;
    })[0] || null;

  return (
    <AnimatedPage keyProp={`instructor-schedule-${instructorId}`}>
      <div className="pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <motion.div className="flex items-center gap-2 text-sm text-muted-foreground mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => navigate('home')} className="hover:text-sky-500 transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => navigate('instructor-profile', { instructorId })} className="hover:text-sky-500 transition-colors">{instructor.name}</button>
          <span>/</span>
          <span className="text-foreground font-semibold">Schedule</span>
        </motion.div>

        {/* Header */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-lg font-extrabold"
              whileHover={{ scale: 1.05 }}
            >
              {instructor.name.charAt(0)}
            </motion.div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Schedule & Sessions</h1>
              <p className="text-sm text-sky-500 font-semibold">{instructor.name}</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'live', 'office-hours', 'workshop', 'qna'].map((type) => (
              <motion.button
                key={type}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  filterType === type ? 'bg-sky-500 text-white' : 'bg-muted/30 text-muted-foreground'
                }`}
                onClick={() => setFilterType(type)}
                whileTap={{ scale: 0.95 }}
              >
                {type === 'qna' ? 'Q&A' : type === 'office-hours' ? 'Office Hours' : type === 'all' ? 'All Sessions' : type}
              </motion.button>
            ))}
          </div>
        </GlassCard>

        {/* Error state */}
        {error && !loading && (
          <GlassCard className="p-6 mb-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Failed to load schedule</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <GradientButton size="sm" onClick={fetchSchedule} className="ml-auto">Retry</GradientButton>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main schedule list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Loading skeletons */}
            {loading && (
              <>
                {[1, 2, 3].map((i) => (
                  <GlassCard key={i} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted/30 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 bg-muted/30 rounded animate-pulse" />
                        <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </>
            )}

            {/* Schedule items */}
            {!loading && filteredSchedule.map((session, i) => {
              const config = TYPE_CONFIG[session.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG['live'];
              const hasReminder = reminders.has(session.id);
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard className={`p-5 border-l-4 ${config.border} ${session.status === 'live' ? 'ring-2 ring-red-500/20' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <config.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-bold text-foreground">{session.title}</h3>
                          {session.status === 'live' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{session.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{session.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.time}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.attendees}/{session.maxAttendees}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>{config.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20 dark:border-white/5">
                      <motion.button
                        className={`flex items-center gap-1.5 text-xs font-semibold ${
                          hasReminder ? 'text-sky-500' : 'text-muted-foreground'
                        }`}
                        onClick={() => toggleReminder(session.id)}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Bell className={`w-3.5 h-3.5 ${hasReminder ? 'fill-sky-500' : ''}`} />
                        {hasReminder ? 'Reminder Set' : 'Set Reminder'}
                      </motion.button>
                      <GradientButton size="sm" onClick={() => { if (session.courseId) navigate('course-detail', { courseId: session.courseId }); }}>
                        {session.status === 'live' ? (
                          <><Video className="w-3 h-3" /> Join Now</>
                        ) : session.status === 'completed' ? (
                          'View Recording'
                        ) : (
                          'Register'
                        )}
                      </GradientButton>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}

            {/* Empty state */}
            {!loading && filteredSchedule.length === 0 && (
              <GlassCard className="p-8 text-center">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  {filterType !== 'all' ? 'No sessions found for this filter.' : 'No upcoming sessions.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filterType !== 'all' ? 'Try selecting a different session type.' : 'Check back later for new sessions!'}
                </p>
              </GlassCard>
            )}
          </div>

          {/* Sidebar - Mini Calendar */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{currentMonth}</h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.map((day) => (
                  <span key={day} className="text-[10px] font-bold text-muted-foreground py-1">{day}</span>
                ))}
                {calendarDays.map((day, i) => (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
                      day === today.getDate()
                        ? 'bg-sky-500 text-white font-bold'
                        : sessionDates.has(day || 0)
                          ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-semibold'
                          : day
                            ? 'text-foreground'
                            : ''
                    }`}
                  >
                    {day || ''}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> Today
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-200 dark:bg-sky-800" /> Sessions
                </span>
              </div>
            </GlassCard>

            {/* Quick Stats - derived from real data */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-500" /> Live Sessions
                  </span>
                  <span className="font-bold text-foreground">{typeCounts['live'] || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-500" /> Office Hours
                  </span>
                  <span className="font-bold text-foreground">{typeCounts['office-hours'] || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Workshops
                  </span>
                  <span className="font-bold text-foreground">{typeCounts['workshop'] || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" /> Q&A Sessions
                  </span>
                  <span className="font-bold text-foreground">{typeCounts['qna'] || 0}</span>
                </div>
              </div>
            </GlassCard>

            {/* Next Session Highlight - from real data */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Next Session</h3>
              {nextSession ? (
                <div className="text-center">
                  <div className={`w-14 h-14 rounded-xl ${TYPE_CONFIG[nextSession.type]?.color || TYPE_CONFIG['live'].color} flex items-center justify-center mx-auto mb-3`}>
                    {(() => {
                      const Icon = TYPE_CONFIG[nextSession.type]?.icon || Video;
                      return <Icon className="w-7 h-7" />;
                    })()}
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{nextSession.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{nextSession.date} at {nextSession.time}</p>
                  {nextSession.status === 'live' && (
                    <p className="text-xs text-red-500 font-bold mt-1">Starting Soon!</p>
                  )}
                  <GradientButton size="sm" className="mt-3 w-full" onClick={() => { if (nextSession.courseId) navigate('course-detail', { courseId: nextSession.courseId }); }}>
                    <Video className="w-3 h-3" /> {nextSession.status === 'live' ? 'Join Session' : 'View Details'}
                  </GradientButton>
                </div>
              ) : (
                <div className="text-center">
                  <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming sessions</p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
