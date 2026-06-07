'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigationStore, useAuthStore, useNotificationStore, useServerConfigStore, urlToPage, PUBLIC_PAGES } from '@/lib/store';
// Notifications now come from OneSignal push notifications
import { ContentProtection } from './ContentProtection';
import { AppShell } from './AppShell';
import NotificationPermissionModal from './notifications/NotificationPermissionModal';

// Auth pages
import { LoginPage } from './auth/LoginPage';
import { SignupPage } from './auth/SignupPage';
import { ForgotPasswordPage } from './auth/ForgotPasswordPage';

// Main pages
import { HomePage } from './home/HomePage';
import { ExplorePage } from './explore/ExplorePage';
import { CourseDetailPage } from './course/CourseDetailPage';
import { VideoPlayerPage } from './video/VideoPlayerPage';
import { InstructorsPage } from './instructor/InstructorsPage';
import { InstructorProfilePage } from './instructor/InstructorProfilePage';
import { NotificationsPage } from './notifications/NotificationsPage';
import { ProfilePage } from './profile/ProfilePage';
import { MyCoursesPage } from './courses/MyCoursesPage';
import { BookmarksPage } from './bookmarks/BookmarksPage';
import { SearchPage } from './search/SearchPage';
import { SettingsPage } from './settings/SettingsPage';
import { HelpPage } from './settings/HelpPage';
import { Error404Page } from './error/Error404Page';
import { Error500Page } from './error/Error500Page';
import { CategoryPage } from './category/CategoryPage';
import { WatchHistoryPage } from './history/WatchHistoryPage';
import { DownloadsPage } from './downloads/DownloadsPage';
import { CertificatesPage } from './certificates/CertificatesPage';
import { LiveSessionsPage } from './live/LiveSessionsPage';
import { AchievementsPage } from './achievements/AchievementsPage';
import { AssignmentPage } from './assignment/AssignmentPage';
import { DiscussionPage } from './discussion/DiscussionPage';
import { AboutPage } from './about/AboutPage';

// Department pages
import { CSEPage } from './department/CSEPage';
import { ETEPage } from './department/ETEPage';
import { EEEPage } from './department/EEEPage';
import { MEPage } from './department/MEPage';
import { CEPage } from './department/CEPage';
import { ArchitecturePage } from './department/ArchitecturePage';
import { TextilePage } from './department/TextilePage';
import { ChemicalPage } from './department/ChemicalPage';
import { AutomobilePage } from './department/AutomobilePage';
import { RACPage } from './department/RACPage';
import { GlassCeramicPage } from './department/GlassCeramicPage';
import { PrintingPage } from './department/PrintingPage';
import { SurveyingPage } from './department/SurveyingPage';
import { MechatronicsPage } from './department/MechatronicsPage';
import { MiningPage } from './department/MiningPage';
import { MetallurgicalPage } from './department/MetallurgicalPage';
import { PowerPage } from './department/PowerPage';
import { InstrumentationPage } from './department/InstrumentationPage';
import { FoodPage } from './department/FoodPage';
import { LeatherPage } from './department/LeatherPage';

// Semester pages
import { Semester1Page } from './semester/Semester1Page';
import { Semester2Page } from './semester/Semester2Page';
import { Semester3Page } from './semester/Semester3Page';
import { Semester4Page } from './semester/Semester4Page';
import { Semester5Page } from './semester/Semester5Page';
import { Semester6Page } from './semester/Semester6Page';
import { Semester7Page } from './semester/Semester7Page';
import { Semester8Page } from './semester/Semester8Page';

// Course sub-pages
import { CourseCurriculumPage } from './course/CourseCurriculumPage';
import { CourseReviewsPage } from './course/CourseReviewsPage';
import { CourseQAPage } from './course/CourseQAPage';
import { CourseAnnouncementsPage } from './course/CourseAnnouncementsPage';
import { CourseResourcesPage } from './course/CourseResourcesPage';
import { CourseNotesPage } from './course/CourseNotesPage';
import { CourseQuizzesPage } from './course/CourseQuizzesPage';
import { CourseProgressPage } from './course/CourseProgressPage';

// Instructor sub-pages
import { InstructorCoursesPage } from './instructor/InstructorCoursesPage';
import { InstructorReviewsPage } from './instructor/InstructorReviewsPage';
import { InstructorSchedulePage } from './instructor/InstructorSchedulePage';
import { InstructorContactPage } from './instructor/InstructorContactPage';

// Profile sub-pages
import { EditProfilePage } from './profile/EditProfilePage';
import { ChangePasswordPage } from './profile/ChangePasswordPage';
import { LearningStatsPage } from './profile/LearningStatsPage';
import { SubscriptionPage } from './profile/SubscriptionPage';
import { ReferralPage } from './profile/ReferralPage';
import { DeleteAccountPage } from './profile/DeleteAccountPage';

// Settings sub-pages
import { AccountSettingsPage } from './settings/AccountSettingsPage';
import { NotificationSettingsPage } from './settings/NotificationSettingsPage';
import { PrivacySettingsPage } from './settings/PrivacySettingsPage';
import { LanguageSettingsPage } from './settings/LanguageSettingsPage';
import { ThemeSettingsPage } from './settings/ThemeSettingsPage';
import { DownloadSettingsPage } from './settings/DownloadSettingsPage';
import { VideoQualityPage } from './settings/VideoQualityPage';
import { NetworkDataPage } from './settings/NetworkDataPage';
import { ContentProtectionSettingsPage } from './settings/ContentProtectionSettingsPage';
import { ActiveSessionsPage } from './settings/ActiveSessionsPage';

// Help sub-pages
import { FAQPage } from './help/FAQPage';
import { ContactSupportPage } from './help/ContactSupportPage';
import { EmailUsPage } from './help/EmailUsPage';
import { ReportIssuePage } from './help/ReportIssuePage';
import { TermsOfServicePage } from './help/TermsOfServicePage';
import { PrivacyPolicyPage } from './help/PrivacyPolicyPage';
import { RefundPolicyPage } from './help/RefundPolicyPage';

// Exam pages
import { ExamPrepPage } from './exam/ExamPrepPage';
import { ExamSchedulePage } from './exam/ExamSchedulePage';
import { ExamResultsPage } from './exam/ExamResultsPage';
import { ExamPracticePage } from './exam/ExamPracticePage';
import { ExamTipsPage } from './exam/ExamTipsPage';

// Social/Community pages
import { LeaderboardPage } from './social/LeaderboardPage';
import { StudyGroupsPage } from './social/StudyGroupsPage';
import { PeerConnectionsPage } from './social/PeerConnectionsPage';
import { CommunityPage } from './social/CommunityPage';
import { FeedbackPage } from './social/FeedbackPage';
import { RoadmapPage } from './social/RoadmapPage';

// Misc pages
import { PricingPage } from './misc/PricingPage';
import { ChangelogPage } from './misc/ChangelogPage';
import { MaintenancePage } from './misc/MaintenancePage';
import { TermsPage } from './misc/TermsPage';
import { PrivacyPage } from './misc/PrivacyPage';
import { PaymentResultPage } from './misc/PaymentResultPage';
import { PaymentCancelPage } from './misc/PaymentCancelPage';
import PublicPageLayout from './misc/PublicPageLayout';

// Support pages
import CommunityRulesPage from './help/CommunityRulesPage';
import SupportWizardPage from './support/SupportWizardPage';
import TicketDetailPage from './support/TicketDetailPage';
import SupportChatPage from './support/SupportChatPage';

function PageRouter() {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const pageParams = useNavigationStore((s) => s.pageParams);

  const pages: Record<string, React.ReactNode> = {
    // Main pages
    home: <HomePage />,
    explore: <ExplorePage />,
    search: <SearchPage />,
    notifications: <NotificationsPage />,
    profile: <ProfilePage />,
    // Course pages
    'course-detail': <CourseDetailPage />,
    'video-player': <VideoPlayerPage />,
    'course-curriculum': <CourseCurriculumPage />,
    'course-reviews': <CourseReviewsPage />,
    'course-qa': <CourseQAPage />,
    'course-announcements': <CourseAnnouncementsPage />,
    'course-resources': <CourseResourcesPage />,
    'course-notes': <CourseNotesPage />,
    'course-quizzes': <CourseQuizzesPage />,
    'course-progress': <CourseProgressPage />,
    // Instructor pages
    instructors: <InstructorsPage />,
    'instructor-profile': <InstructorProfilePage />,
    'instructor-courses': <InstructorCoursesPage />,
    'instructor-reviews': <InstructorReviewsPage />,
    'instructor-schedule': <InstructorSchedulePage />,
    'instructor-contact': <InstructorContactPage />,
    // User pages
    'my-courses': <MyCoursesPage />,
    bookmarks: <BookmarksPage />,
    settings: <SettingsPage />,
    help: <HelpPage />,
    'watch-history': <WatchHistoryPage />,
    downloads: <DownloadsPage />,
    certificates: <CertificatesPage />,
    'live-sessions': <LiveSessionsPage />,
    achievements: <AchievementsPage />,
    assignment: <AssignmentPage />,
    discussion: <DiscussionPage />,
    about: <AboutPage />,
    // Department pages
    'dept-cse': <CSEPage />,
    'dept-ete': <ETEPage />,
    'dept-eee': <EEEPage />,
    'dept-me': <MEPage />,
    'dept-ce': <CEPage />,
    'dept-architecture': <ArchitecturePage />,
    'dept-textile': <TextilePage />,
    'dept-chemical': <ChemicalPage />,
    'dept-automobile': <AutomobilePage />,
    'dept-rac': <RACPage />,
    'dept-glass-ceramic': <GlassCeramicPage />,
    'dept-printing': <PrintingPage />,
    'dept-surveying': <SurveyingPage />,
    'dept-mechatronics': <MechatronicsPage />,
    'dept-mining': <MiningPage />,
    'dept-metallurgical': <MetallurgicalPage />,
    'dept-power': <PowerPage />,
    'dept-instrumentation': <InstrumentationPage />,
    'dept-food': <FoodPage />,
    'dept-leather': <LeatherPage />,
    // Semester pages
    'semester-1': <Semester1Page />,
    'semester-2': <Semester2Page />,
    'semester-3': <Semester3Page />,
    'semester-4': <Semester4Page />,
    'semester-5': <Semester5Page />,
    'semester-6': <Semester6Page />,
    'semester-7': <Semester7Page />,
    'semester-8': <Semester8Page />,
    // Profile sub-pages
    'edit-profile': <EditProfilePage />,
    'change-password': <ChangePasswordPage />,
    'learning-stats': <LearningStatsPage />,
    subscription: <SubscriptionPage />,
    referral: <ReferralPage />,
    'delete-account': <DeleteAccountPage />,
    // Settings sub-pages
    'settings-account': <AccountSettingsPage />,
    'settings-notifications': <NotificationSettingsPage />,
    'settings-privacy': <PrivacySettingsPage />,
    'settings-language': <LanguageSettingsPage />,
    'settings-theme': <ThemeSettingsPage />,
    'settings-downloads': <DownloadSettingsPage />,
    'settings-video-quality': <VideoQualityPage />,
    'settings-download-settings': <DownloadSettingsPage />,
    'settings-network-data': <NetworkDataPage />,
    'settings-content-protection': <ContentProtectionSettingsPage />,
    'settings-sessions': <ActiveSessionsPage />,
    // Help sub-pages
    faq: <FAQPage />,
    'contact-support': <ContactSupportPage />,
    'email-us': <EmailUsPage />,
    'report-issue': <ReportIssuePage />,
    'terms-of-service': <TermsOfServicePage />,
    'privacy-policy': <PrivacyPolicyPage />,
    'refund-policy': <RefundPolicyPage />,
    // Exam pages
    'exam-prep': <ExamPrepPage />,
    'exam-schedule': <ExamSchedulePage />,
    'exam-results': <ExamResultsPage />,
    'exam-practice': <ExamPracticePage />,
    'exam-tips': <ExamTipsPage />,
    // Social/Community pages
    leaderboard: <LeaderboardPage />,
    'study-groups': <StudyGroupsPage />,
    'peer-connections': <PeerConnectionsPage />,
    community: <CommunityPage />,
    feedback: <FeedbackPage />,
    roadmap: <RoadmapPage />,
    // Category
    category: <CategoryPage />,
    // Misc pages
    pricing: <PricingPage />,
    changelog: <ChangelogPage />,
    maintenance: <MaintenancePage />,
    terms: <TermsPage />,
    privacy: <PrivacyPage />,
    'payment-result': <PaymentResultPage />,
    'payment-cancel': <PaymentCancelPage />,
    // Error pages
    'error-404': <Error404Page />,
    'error-500': <Error500Page />,
    // Support pages
    'community-rules': <CommunityRulesPage />,
    'support-wizard': <SupportWizardPage />,
    'ticket-detail': <TicketDetailPage />,
    'support-chat': <SupportChatPage />,
    // Public pages wrapped in PublicPageLayout (no AppShell)
    'terms-public': <PublicPageLayout><TermsOfServicePage /></PublicPageLayout>,
    'privacy-public': <PublicPageLayout><PrivacyPolicyPage /></PublicPageLayout>,
    'rules-public': <PublicPageLayout><CommunityRulesPage /></PublicPageLayout>,
    'refund-public': <PublicPageLayout><RefundPolicyPage /></PublicPageLayout>,
    'support-public': <PublicPageLayout><SupportWizardPage /></PublicPageLayout>,
  };

  // Include pageParams in key for pages that need full remount on param change
  const paramKey = (pageParams?.videoId || pageParams?.courseId || pageParams?.instructorId)
    ? `-${pageParams.videoId || ''}${pageParams.courseId || ''}${pageParams.instructorId || ''}`
    : '';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentPage}${paramKey}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {pages[currentPage] || <Error404Page />}
      </motion.div>
    </AnimatePresence>
  );
}

export function DakkhoApp() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPendingVerification = useAuthStore((s) => s.isPendingVerification);
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);
  const syncFromUrl = useNavigationStore((s) => s.syncFromUrl);
  const setUser = useAuthStore((s) => s.setUser);
  const notifications = useNotificationStore((s) => s.notifications);

  // Initialize server config on mount
  const fetchConfig = useServerConfigStore((s) => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ─── Handle Admin Impersonation Token ──────────────────────
  // When admin clicks "Login as User", the student app opens with
  // ?impersonate_token=xxx — we pick it up and set the auth state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const impersonateToken = params.get('impersonate_token');
    if (impersonateToken) {
      // Store the token
      localStorage.setItem('dakkho_student_token', impersonateToken);
      // Clean URL to remove the token param
      const url = new URL(window.location.href);
      url.searchParams.delete('impersonate_token');
      window.history.replaceState({}, '', url.pathname);
      // Fetch user profile with the new token and set auth state
      (async () => {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dakkho-admin-api.dakkho-admin.workers.dev';
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${impersonateToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser({
                id: data.user.id,
                fullName: data.user.name || '',
                email: data.user.email || '',
                technology: data.user.technology || undefined,
                emailVerified: data.user.emailVerified || false,
                avatarUrl: data.user.avatarUrl || '',
                role: 'student',
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch impersonated user profile:', err);
        }
      })();
    }
  }, [setUser]);

  // Notifications managed by OneSignal + store
  // No longer seeding from mock data

  // Sync from browser URL on initial load
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== '/') {
      syncFromUrl(currentPath);
    }
  }, []);

  // Listen for browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      const currentPath = window.location.pathname;
      syncFromUrl(currentPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncFromUrl]);

  // Auth pages (no shell)
  const authPages: Record<string, React.ReactNode> = {
    login: <LoginPage />,
    signup: <SignupPage />,
    'forgot-password': <ForgotPasswordPage />,
  };

  // Redirect authenticated users away from auth pages
  // BUT NOT when they're pending OTP verification (signup flow)
  const authPageKeys = ['login', 'signup', 'forgot-password'];
  const redirectingRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !isPendingVerification && authPageKeys.includes(currentPage) && !redirectingRef.current) {
      redirectingRef.current = true;
      navigate('home');
      requestAnimationFrame(() => { redirectingRef.current = false; });
    }
  }, [isAuthenticated, isPendingVerification, currentPage, navigate]);

  const isPublicPage = PUBLIC_PAGES.has(currentPage);

  // Public pages render without AppShell for both authenticated and unauthenticated users
  if (isPublicPage) {
    return (
      <ContentProtection>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PageRouter />
          </motion.div>
        </AnimatePresence>
      </ContentProtection>
    );
  }

  // Show auth pages when:
  // 1. User is NOT authenticated, OR
  // 2. User is authenticated BUT pending OTP verification AND on an auth page
  // 3. User is NOT authenticated AND pending verification (signup flow)
  if (!isAuthenticated || isPendingVerification) {
    // During signup flow, force signup page
    const effectivePage = isPendingVerification && !authPageKeys.includes(currentPage) ? 'signup' : currentPage;
    return (
      <ContentProtection>
        <AnimatePresence mode="wait">
          <motion.div
            key={effectivePage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {authPages[effectivePage] || <SignupPage />}
          </motion.div>
        </AnimatePresence>
      </ContentProtection>
    );
  }

  // If authenticated and still on an auth page (but NOT pending verification), show loading while redirecting
  if (authPageKeys.includes(currentPage)) {
    return null;
  }

  // Authenticated pages (with shell)
  return (
    <ContentProtection>
      <AppShell>
        <NotificationPermissionModal />
        <PageRouter />
      </AppShell>
    </ContentProtection>
  );
}
