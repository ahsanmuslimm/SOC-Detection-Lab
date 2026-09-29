/**
 * useAlerts Hook
 * 
 * Custom React Hook for managing alert data and operations.
 * Provides server state management with React Query.
 * 
 * @module hooks/useAlerts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '@services/alertService';
import type { IAlert, IAlertStats, IPaginatedResponse } from '@types/index';
import toast from 'react-hot-toast';

interface UseAlertsOptions {
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
}

/**
 * Hook for querying and managing alerts
 */
export const useAlerts = (options: UseAlertsOptions = {}) => {
  const { page = 1, pageSize = 25, filters = {} } = options;
  const queryClient = useQueryClient();

  // Query for list of alerts
  const alertsQuery = useQuery({
    queryKey: ['alerts', { page, pageSize, ...filters }],
    queryFn: () => alertService.listAlerts(page, pageSize, filters as any),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for creating alert
  const createMutation = useMutation({
    mutationFn: alertService.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create alert');
    },
  });

  // Mutation for updating alert
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IAlert> }) =>
      alertService.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update alert');
    },
  });

  // Mutation for deleting alert
  const deleteMutation = useMutation({
    mutationFn: alertService.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete alert');
    },
  });

  // Mutation for acknowledging alert
  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      alertService.acknowledgeAlert(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert acknowledged');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to acknowledge alert');
    },
  });

  // Mutation for assigning alert
  const assignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      alertService.assignAlert(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign alert');
    },
  });

  return {
    // Query
    alerts: alertsQuery.data?.items || [],
    pagination: alertsQuery.data?.pagination,
    isLoading: alertsQuery.isLoading,
    isError: alertsQuery.isError,
    error: alertsQuery.error,
    refetch: alertsQuery.refetch,

    // Mutations
    createAlert: createMutation.mutateAsync,
    updateAlert: updateMutation.mutateAsync,
    deleteAlert: deleteMutation.mutateAsync,
    acknowledgeAlert: acknowledgeMutation.mutateAsync,
    assignAlert: assignMutation.mutateAsync,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook for getting alert statistics
 */
export const useAlertStats = () => {
  return useQuery({
    queryKey: ['alertStats'],
    queryFn: () => alertService.getAlertStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.data,
  });
};

/**
 * Hook for getting single alert
 */
export const useAlert = (id: string) => {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertService.getAlert(id),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
    enabled: !!id,
  });
};
