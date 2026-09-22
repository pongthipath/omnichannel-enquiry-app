import { useMemo } from 'react';
import { Permission } from '../constants/permissions';
import { hasPermission, parseMask } from '../helpers/permission.helper';
import { useMe } from './queries/use-session';

/** `can(Permission.X)` for the signed-in staff member (customers have no bits). */
export function usePermissions() {
  const me = useMe().data;
  return useMemo(() => {
    const mask = parseMask(me?.permissions);
    return {
      me,
      isStaff: me?.userType === 'staff',
      can: (p: Permission) => hasPermission(mask, p),
    };
  }, [me]);
}
