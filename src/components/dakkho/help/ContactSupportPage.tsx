'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ChevronLeft, Send, Paperclip, AlertCircle,
  CheckCircle2, Clock, User, Mail, Phone, X, FileText, Loader2,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { useAuthStore } from '@/lib/store';
import { supportApi, studentProfileApi } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

export function ContactSupportPage() {
  const { goBack } = useNavigationStore();
  const { user } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('General');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previousTickets, setPreviousTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auto-fill name and email from auth store when logged in
  useEffect(() => {
    if (user) {
      setName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Fetch previous tickets from API
  useEffect(() => {
    async function fetchTickets() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const result = await supportApi.getMyTickets();
        if (result.success) {
          setPreviousTickets(result.tickets);
        }
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [user]);

  const categories = ['General', 'Technical Issue', 'Billing', 'Course Content', 'Account', 'Feature Request'];
  const priorities = [
    { label: 'Low', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    { label: 'Medium', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    { label: 'High', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
    { label: 'Urgent', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' },
  ];

  const statusColors: Record<string, string> = {
    resolved: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    'in-progress': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    open: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
    closed: 'bg-muted/30 text-muted-foreground',
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    else if (description.trim().length < 20) newErrors.description = 'Please provide at least 20 characters';
    // If not logged in, name and email are required
    if (!user) {
      if (!name.trim()) newErrors.name = 'Name is required';
      if (!email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setError('');

    try {
      const result = await supportApi.createTicket({
        name: user?.fullName || name,
        email: user?.email || email,
        category: category,
        sub_category: subCategory,
        priority: priority,
        subject: subject,
        description: description,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : attachmentPreviews,
        user_id: user?.id,
      });

      if (result.success) {
        setTicketId(result.ticket_id);
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to create ticket');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttach = () => {
    if (attachmentPreviews.length < 3) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = 3 - attachmentPreviews.length;
    const toAdd = files.slice(0, remaining);

    // Upload each file to R2 immediately
    setIsUploading(true);
    const newUrls: string[] = [];
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of toAdd) {
      try {
        const result = await studentProfileApi.uploadSupportAttachment(file);
        if (result.success && result.url) {
          newUrls.push(result.url);
          newFiles.push(file);
          newPreviews.push(file.name);
        }
      } catch (err) {
        console.error('Failed to upload attachment:', err);
      }
    }

    setAttachmentFiles(prev => [...prev, ...newFiles]);
    setAttachmentPreviews(prev => [...prev, ...newPreviews]);
    setAttachmentUrls(prev => [...prev, ...newUrls]);
    setIsUploading(false);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
    setAttachmentUrls(prev => prev.filter((_, i) => i !== index));
  };

  if (submitted) {
    return (
      <div className="pb-20 lg:pb-0">
        <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={goBack} whileTap={{ scale: 0.9 }}>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-extrabold text-foreground">Contact Support</h1>
        </motion.div>
        <GlassCard className="p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold mb-2">Ticket Created!</h3>
          <p className="text-muted-foreground mb-2">Your ticket ID is:</p>
          <p className="text-2xl font-mono font-bold text-sky-500">{ticketId}</p>
          <p className="text-sm text-muted-foreground mt-4">
            We&apos;ll respond within 24-48 hours. Check your email for updates.
          </p>
          <div className="mt-6">
            <GradientButton onClick={goBack} size="sm">Back to Help</GradientButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <motion.button className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground" onClick={goBack} whileTap={{ scale: 0.9 }}>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Contact Support</h1>
          <p className="text-xs text-muted-foreground">We are here to help you</p>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Previous Tickets */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard className="p-5 mb-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-sky-500" /> Recent Tickets
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
              </div>
            ) : previousTickets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No previous tickets found.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {previousTickets.map((ticket, i) => (
                  <motion.div
                    key={ticket.id || i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <div>
                      <p className="text-xs font-bold text-sky-500">{ticket.id || ticket.ticket_id}</p>
                      <p className="text-xs font-semibold text-foreground">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{ticket.date || ticket.created_at}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${statusColors[ticket.status] || statusColors.open}`}>
                      {ticket.status === 'in-progress' ? 'In Progress' : ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1) || 'Open'}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Contact Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-sky-500" /> New Ticket
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Name — only shown if not logged in */}
              {!user && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: '' }); }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                        errors.name ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                      }`}
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>
              )}

              {/* Email — only shown if not logged in */}
              {!user && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                        errors.email ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setErrors({ ...errors, subject: '' }); }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                      errors.subject ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                    }`}
                    placeholder="Brief description of your issue"
                  />
                </div>
                {errors.subject && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.subject}</p>}
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-white/30 dark:border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Priority</label>
                  <div className="flex gap-1 flex-wrap">
                    {priorities.map((p) => (
                      <motion.button
                        key={p.label}
                        type="button"
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold border ${priority === p.label ? p.color : 'bg-muted/30 text-muted-foreground border-transparent'}`}
                        onClick={() => setPriority(p.label)}
                        whileTap={{ scale: 0.95 }}
                      >
                        {p.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrors({ ...errors, description: '' }); }}
                  rows={5}
                  className={`w-full px-4 py-3 rounded-xl bg-muted/30 border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none ${
                    errors.description ? 'border-red-500' : 'border-white/30 dark:border-white/10'
                  }`}
                  placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and relevant screenshots..."
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description ? (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>
                  ) : <span />}
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Attachments</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.log"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <motion.button
                  type="button"
                  className="w-full p-3 rounded-xl border-2 border-dashed border-muted/50 text-muted-foreground flex items-center justify-center gap-2 hover:border-sky-500/50 hover:text-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAttach}
                  whileTap={isUploading ? {} : { scale: 0.98 }}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-semibold">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Paperclip className="w-4 h-4" />
                      <span className="text-xs font-semibold">Add files ({attachmentPreviews.length}/3)</span>
                    </>
                  )}
                </motion.button>
                <AnimatePresence>
                  {attachmentPreviews.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {attachmentPreviews.map((file, i) => (
                        <motion.div
                          key={`${file}-${i}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-3 h-3 text-sky-500" />
                            <span className="text-xs font-medium text-foreground">{file}</span>
                          </div>
                          <button type="button" onClick={() => removeAttachment(i)}>
                            <X className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <GradientButton onClick={handleSubmit as any} loading={isSubmitting} className="w-full" size="sm">
                <Send className="w-4 h-4" /> Submit Ticket
              </GradientButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
