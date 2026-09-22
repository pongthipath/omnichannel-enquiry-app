import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authService, LoginInput } from '../../services/auth.service';
import { session } from '../../services/session';

export const meKey = ['auth', 'me'] as const;

/** The signed-in user; null when signed out. */
export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: authService.me, retry: false, staleTime: 5 * 60_000 });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      await session.login(input);
      return authService.me();
    },
    onSuccess: (me) => {
      qc.setQueryData(meKey, me);
      router.replace('/enquiries');
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: session.logout,
    onSettled: () => {
      qc.clear(); // no data of the previous user stays in the cache
      router.replace('/login');
    },
  });
}
