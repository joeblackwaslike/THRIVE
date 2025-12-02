import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applicationsResolver } from '../../graphql/resolvers/applications.ts';
import { supabase } from '../../lib/supabase.ts';

// Mock the supabase module
vi.mock('../../lib/supabase.ts', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

describe('Applications GraphQL Resolvers', () => {
  const mockContext = { userId: 'test-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query.applications', () => {
    it('should fetch applications for the user', async () => {
      const mockApplications = [
        { id: '1', user_id: 'test-user-id', company_name: 'Company A', position: 'Developer' },
        { id: '2', user_id: 'test-user-id', company_name: 'Company B', position: 'Designer' },
      ];

      const mockSupabase = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockApplications, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Query.applications(null, {}, mockContext);

      expect(supabase.from).toHaveBeenCalledWith('applications');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockApplications);
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');

      const mockSupabase = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      await expect(applicationsResolver.Query.applications(null, {}, mockContext)).rejects.toThrow(
        'Database error'
      );
    });

    it('should return empty array when no applications found', async () => {
      const mockSupabase = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Query.applications(null, {}, mockContext);

      expect(result).toEqual([]);
    });
  });

  describe('Query.application', () => {
    it('should fetch a single application by ID', async () => {
      const mockApplication = {
        id: '1',
        user_id: 'test-user-id',
        company_name: 'Company A',
        position: 'Developer',
      };

      const mockSupabase = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockApplication, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Query.application(null, { id: '1' }, mockContext);

      expect(supabase.from).toHaveBeenCalledWith('applications');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockApplication);
    });

    it('should return null when application not found', async () => {
      const mockSupabase = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Query.application(null, { id: '999' }, mockContext);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');

      const mockSupabase = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      await expect(
        applicationsResolver.Query.application(null, { id: '1' }, mockContext)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Mutation.createApplication', () => {
    it('should create a new application', async () => {
      const input = {
        companyName: 'New Company',
        position: 'Senior Developer',
        status: 'applied',
      };

      const mockCreatedApplication = {
        id: 'new-id',
        user_id: 'test-user-id',
        company_name: 'New Company',
        position: 'Senior Developer',
        status: 'applied',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSupabase = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedApplication, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Mutation.createApplication(
        null,
        { input },
        mockContext
      );

      expect(supabase.from).toHaveBeenCalledWith('applications');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          user_id: 'test-user-id',
          company_name: 'New Company',
          position: 'Senior Developer',
          status: 'applied',
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      ]);
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedApplication);
    });

    it('should handle creation errors', async () => {
      const input = {
        companyName: 'New Company',
        position: 'Senior Developer',
      };

      const mockError = new Error('Creation failed');

      const mockSupabase = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      await expect(
        applicationsResolver.Mutation.createApplication(null, { input }, mockContext)
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('Mutation.updateApplication', () => {
    it('should update an existing application', async () => {
      const id = '1';
      const input = {
        companyName: 'Updated Company',
        position: 'Lead Developer',
      };

      const mockUpdatedApplication = {
        id: '1',
        user_id: 'test-user-id',
        company_name: 'Updated Company',
        position: 'Lead Developer',
        updated_at: new Date().toISOString(),
      };

      const mockSupabase = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedApplication, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Mutation.updateApplication(
        null,
        { id, input },
        mockContext
      );

      expect(supabase.from).toHaveBeenCalledWith('applications');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        company_name: 'Updated Company',
        position: 'Lead Developer',
        updated_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedApplication);
    });

    it('should return null when application not found', async () => {
      const id = '999';
      const input = { companyName: 'Updated Company' };

      const mockSupabase = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Mutation.updateApplication(
        null,
        { id, input },
        mockContext
      );

      expect(result).toBeNull();
    });

    it('should handle update errors', async () => {
      const id = '1';
      const input = { companyName: 'Updated Company' };

      const mockError = new Error('Update failed');

      const mockSupabase = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockSupabase);

      await expect(
        applicationsResolver.Mutation.updateApplication(null, { id, input }, mockContext)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('Mutation.deleteApplication', () => {
    it('should delete an existing application', async () => {
      const id = '1';

      const mockSupabase = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn(),
      };
      // First eq() for id chaining, second eq() resolves the final awaited result
      mockSupabase.eq
        .mockImplementationOnce(() => mockSupabase)
        .mockImplementationOnce(() => Promise.resolve({ error: null }));

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Mutation.deleteApplication(
        null,
        { id },
        mockContext
      );

      expect(supabase.from).toHaveBeenCalledWith('applications');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      // No select() in delete flow; final eq() returns the awaited result
      expect(result).toBe(true);
    });

    it('should return false when application not found', async () => {
      const id = '999';

      const mockSupabase = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn(),
      };
      mockSupabase.eq
        .mockImplementationOnce(() => mockSupabase)
        .mockImplementationOnce(() => Promise.resolve({ error: null }));

      (supabase.from as any).mockReturnValue(mockSupabase);

      const result = await applicationsResolver.Mutation.deleteApplication(
        null,
        { id },
        mockContext
      );

      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      const id = '1';

      const mockError = new Error('Deletion failed');

      const mockSupabase = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn(),
      };
      mockSupabase.eq
        .mockImplementationOnce(() => mockSupabase)
        .mockImplementationOnce(() => Promise.resolve({ error: mockError }));

      (supabase.from as any).mockReturnValue(mockSupabase);

      await expect(
        applicationsResolver.Mutation.deleteApplication(null, { id }, mockContext)
      ).rejects.toThrow('Deletion failed');
    });
  });
});
