/**
 * useCases / useInvestigations / useReports / useUsers Hooks
 *
 * Server state management hooks following the useAlerts pattern.
 *
 * @module hooks/useDomainData
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caseService } from '@services/caseService';
import { investigationService } from '@services/investigationService';
import { reportService } from '@services/reportService';
import { userService } from '@services/userService';
import type { ICase, IInvestigation, IUser } from '@app-types';
import { useAuthStore } from '@stores/authStore';
import toast from 'react-hot-toast';

// ============================================
// Cases
// ============================================

interface UseListOptions {
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
  enabled?: boolean;
}

export const useCases = (options: UseListOptions = {}) => {
  const { page = 1, pageSize = 25, filters = {} } = options;
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const casesQuery = useQuery({
    queryKey: ['cases', { page, pageSize, ...filters }],
    queryFn: () => caseService.listCases(page, pageSize, filters),
    staleTime: 1000 * 60 * 5,
    enabled: !!accessToken,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cases'] });

  const createMutation = useMutation({
    mutationFn: caseService.createCase,
    onSuccess: () => { invalidate(); toast.success('Case created'); },
    onError: (error: any) => toast.error(error.message || 'Failed to create case'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ICase> }) => caseService.updateCase(id, data),
    onSuccess: () => { invalidate(); toast.success('Case updated'); },
    onError: (error: any) => toast.error(error.message || 'Failed to update case'),
  });

  const deleteMutation = useMutation({
    mutationFn: caseService.deleteCase,
    onSuccess: () => { invalidate(); toast.success('Case deleted'); },
    onError: (error: any) => toast.error(error.message || 'Failed to delete case'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => caseService.assignCase(id, userId),
    onSuccess: () => { invalidate(); toast.success('Case assigned'); },
    onError: (error: any) => toast.error(error.message || 'Failed to assign case'),
  });

  return {
    cases: casesQuery.data?.items || [],
    pagination: casesQuery.data?.pagination,
    isLoading: casesQuery.isLoading,
    isError: casesQuery.isError,
    refetch: casesQuery.refetch,
    createCase: createMutation.mutateAsync,
    updateCase: updateMutation.mutateAsync,
    deleteCase: deleteMutation.mutateAsync,
    assignCase: assignMutation.mutateAsync,
  };
};

export const useCaseStats = () => {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['caseStats'],
    queryFn: () => caseService.getCaseStats(),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
    enabled: !!accessToken,
  });
};

// ============================================
// Investigations
// ============================================

export const useInvestigations = (options: UseListOptions = {}) => {
  const { page = 1, pageSize = 25, filters = {} } = options;
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const investigationsQuery = useQuery({
    queryKey: ['investigations', { page, pageSize, ...filters }],
    queryFn: () => investigationService.listInvestigations(page, pageSize, filters),
    staleTime: 1000 * 60 * 5,
    enabled: !!accessToken,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['investigations'] });

  const createMutation = useMutation({
    mutationFn: investigationService.createInvestigation,
    onSuccess: () => { invalidate(); toast.success('Investigation created'); },
    onError: (error: any) => toast.error(error.message || 'Failed to create investigation'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IInvestigation> }) =>
      investigationService.updateInvestigation(id, data),
    onSuccess: () => { invalidate(); toast.success('Investigation updated'); },
    onError: (error: any) => toast.error(error.message || 'Failed to update investigation'),
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, closeReason, conclusion }: { id: string; closeReason: string; conclusion?: string }) =>
      investigationService.closeInvestigation(id, closeReason, conclusion),
    onSuccess: () => { invalidate(); toast.success('Investigation closed'); },
    onError: (error: any) => toast.error(error.message || 'Failed to close investigation'),
  });

  return {
    investigations: investigationsQuery.data?.items || [],
    pagination: investigationsQuery.data?.pagination,
    isLoading: investigationsQuery.isLoading,
    isError: investigationsQuery.isError,
    refetch: investigationsQuery.refetch,
    createInvestigation: createMutation.mutateAsync,
    updateInvestigation: updateMutation.mutateAsync,
    closeInvestigation: closeMutation.mutateAsync,
  };
};

export const useInvestigationTimeline = (id: string) => {
  return useQuery({
    queryKey: ['investigationTimeline', id],
    queryFn: () => investigationService.getTimeline(id),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
    enabled: !!id,
  });
};

// ============================================
// Reports
// ============================================

export const useReports = (options: UseListOptions = {}) => {
  const { page = 1, pageSize = 25, filters = {} } = options;
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['reports', { page, pageSize, ...filters }],
    queryFn: () => reportService.listReports(page, pageSize, filters),
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reports'] });

  const generateMutation = useMutation({
    mutationFn: reportService.generateReport,
    onSuccess: () => { invalidate(); toast.success('Report generated'); },
    onError: (error: any) => toast.error(error.message || 'Failed to generate report'),
  });

  const deleteMutation = useMutation({
    mutationFn: reportService.deleteReport,
    onSuccess: () => { invalidate(); toast.success('Report deleted'); },
    onError: (error: any) => toast.error(error.message || 'Failed to delete report'),
  });

  return {
    reports: reportsQuery.data?.items || [],
    pagination: reportsQuery.data?.pagination,
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    refetch: reportsQuery.refetch,
    generateReport: generateMutation.mutateAsync,
    deleteReport: deleteMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
};

// ============================================
// Users
// ============================================

export const useUsers = (options: UseListOptions = {}) => {
  const { page = 1, pageSize = 25, filters = {} } = options;
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', { page, pageSize, ...filters }],
    queryFn: () => userService.listUsers(page, pageSize, filters),
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => { invalidate(); toast.success('User created'); },
    onError: (error: any) => toast.error(error.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IUser> }) => userService.updateUser(id, data),
    onSuccess: () => { invalidate(); toast.success('User updated'); },
    onError: (error: any) => toast.error(error.message || 'Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => { invalidate(); toast.success('User deleted'); },
    onError: (error: any) => toast.error(error.message || 'Failed to delete user'),
  });

  return {
    users: usersQuery.data?.items || [],
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    refetch: usersQuery.refetch,
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
  };
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles(),
    staleTime: 1000 * 60 * 10,
    select: (data) => data.data,
  });
};
