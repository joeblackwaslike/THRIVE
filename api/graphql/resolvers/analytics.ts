import { GraphQLError } from 'graphql';
import { supabase } from '../../lib/supabase.ts';
import logger from '../../logger.ts';
import type { ApplicationRecordForAnalytics, ApplicationsOverTimeArgs, Context } from '../types.ts';

export const analyticsResolver = {
  Query: {
    applicationStats: async (_: unknown, __: unknown, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') {
          return {
            total: 0,
            byStatus: {},
            averageResponseTime: null,
            successRate: 0,
            activeApplications: 0,
            interviewsScheduled: 0,
            offersReceived: 0,
          };
        }

        // Get total applications count
        const { data: totalData, error: totalError } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (totalError) {
          logger.error('Error fetching total applications count:', totalError);
          throw totalError;
        }

        // Get applications by status
        const { data: statusData, error: statusError } = await supabase
          .from('applications')
          .select('status')
          .eq('user_id', userId);

        if (statusError) {
          logger.error('Error fetching applications by status:', statusError);
          throw statusError;
        }

        // Get interviews count
        const { data: interviewsData, error: interviewsError } = await supabase
          .from('interviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (interviewsError) {
          logger.error('Error fetching interviews count:', interviewsError);
          throw interviewsError;
        }

        // Get offers count (applications with status 'offer' or 'accepted')
        const { data: offersData, error: offersError } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['offer', 'accepted']);

        if (offersError) {
          logger.error('Error fetching offers count:', offersError);
          throw offersError;
        }

        // Calculate by status
        const byStatus: Record<string, number> = {};
        statusData.forEach((app: ApplicationRecordForAnalytics) => {
          byStatus[app.status] = (byStatus[app.status] || 0) + 1;
        });

        // Calculate success rate
        const successRate = totalData.length > 0 ? (offersData.length / totalData.length) * 100 : 0;

        return {
          total: totalData.length,
          byStatus,
          averageResponseTime: null, // Could be calculated from date differences
          successRate,
          activeApplications: totalData.length, // Could filter by active statuses
          interviewsScheduled: interviewsData.length,
          offersReceived: offersData.length,
        };
      } catch (error) {
        logger.error('Error fetching application stats:', error);
        throw new GraphQLError(`Failed to fetch application stats: ${error}`);
      }
    },

    applicationsByStatusCount: async (_: unknown, __: unknown, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') return {};
        const { data, error } = await supabase
          .from('applications')
          .select('status')
          .eq('user_id', userId);

        if (error) {
          logger.error('Error fetching applications by status count:', error);
          throw error;
        }

        const byStatus: Record<string, number> = {};
        data.forEach((app: ApplicationRecordForAnalytics) => {
          byStatus[app.status] = (byStatus[app.status] || 0) + 1;
        });

        return byStatus;
      } catch (error) {
        logger.error('Error fetching applications by status count:', error);
        throw new GraphQLError(`Failed to fetch applications by status count: ${error}`);
      }
    },

    applicationsOverTime: async (
      _: unknown,
      { startDate, endDate }: ApplicationsOverTimeArgs,
      { userId }: Context,
    ) => {
      try {
        if (!userId || userId === 'null') return [];
        const { data, error } = await supabase
          .from('applications')
          .select('created_at, status')
          .eq('user_id', userId)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: true });

        if (error) {
          logger.error('Error fetching applications over time:', error);
          throw error;
        }

        return data;
      } catch (error) {
        logger.error('Error fetching applications over time:', error);
        throw new GraphQLError(`Failed to fetch applications over time: ${error}`);
      }
    },
  },
};
