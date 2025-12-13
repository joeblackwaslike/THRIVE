import { isAfter, startOfMonth, startOfWeek } from 'date-fns';
import { useMemo } from 'react';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useCompaniesStore } from '@/stores/companiesStore';
import { useContactsStore } from '@/stores/contactsStore';
import { useInterviewsStore } from '@/stores/interviewsStore';

export function useAnalytics() {
  const { applications } = useApplicationsStore();
  const { interviews } = useInterviewsStore();
  const { contacts } = useContactsStore();
  const { companies } = useCompaniesStore();

  const analytics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // Total counts
    const totalApplications = applications.length;
    const totalInterviews = interviews.length;
    const totalContacts = contacts.length;
    const totalCompanies = companies.length;

    // Applications this week/month
    const applicationsThisWeek = applications.filter(
      (app) => app.appliedDate && isAfter(new Date(app.appliedDate), weekStart),
    ).length;

    const applicationsThisMonth = applications.filter(
      (app) => app.appliedDate && isAfter(new Date(app.appliedDate), monthStart),
    ).length;

    // Interviews this week/month
    const interviewsThisWeek = interviews.filter(
      (interview) => interview.scheduledAt && isAfter(new Date(interview.scheduledAt), weekStart),
    ).length;

    const interviewsThisMonth = interviews.filter(
      (interview) => interview.scheduledAt && isAfter(new Date(interview.scheduledAt), monthStart),
    ).length;

    // Status breakdown
    const activeApplications = applications.filter((app) =>
      ['applied', 'screening', 'interviewing'].includes(app.status),
    ).length;

    const offersReceived = applications.filter((app) => app.status === 'offer').length;

    const rejections = applications.filter((app) => app.status === 'rejected').length;

    // Interview success metrics
    const completedInterviews = interviews.filter((i) => i.status === 'completed').length;
    const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled').length;
    const upcomingInterviews = interviews.filter(
      (i) => i.status === 'scheduled' && i.scheduledAt && isAfter(new Date(i.scheduledAt), now),
    ).length;

    // Response rate (applications with interviews / total applications)
    const responseRate =
      totalApplications > 0 ? Math.round((totalInterviews / totalApplications) * 100) : 0;

    // Interview to offer conversion
    const interviewToOfferRate =
      completedInterviews > 0 ? Math.round((offersReceived / completedInterviews) * 100) : 0;

    // Average time to response (simplified - would need more data tracking)
    const avgDaysToResponse = 7; // Placeholder

    return {
      totals: {
        applications: totalApplications,
        interviews: totalInterviews,
        contacts: totalContacts,
        companies: totalCompanies,
      },
      thisWeek: {
        applications: applicationsThisWeek,
        interviews: interviewsThisWeek,
      },
      thisMonth: {
        applications: applicationsThisMonth,
        interviews: interviewsThisMonth,
      },
      breakdown: {
        active: activeApplications,
        offers: offersReceived,
        rejections: rejections,
        completedInterviews,
        scheduledInterviews,
        upcomingInterviews,
      },
      metrics: {
        responseRate,
        interviewToOfferRate,
        avgDaysToResponse,
      },
    };
  }, [applications, interviews, contacts, companies]);

  return analytics;
}
