import { UserType } from '../services/auth.service';

/** Seeded accounts (API `npm run seed`). Shown on the login screen in development builds only. */
export const DEMO_PASSWORD = 'Password123!';

export const demoAccounts: Record<UserType, { email: string; label: string }[]> = {
  customer: [
    { email: 'malee@bkkbistro.test', label: 'Bangkok Bistro' },
    { email: 'purchasing@siamriverside.test', label: 'Siam Riverside' },
    { email: 'ann@cmbakehouse.test', label: 'CM Bakehouse' },
    { email: 'jo@nanapizza.test', label: 'Nana Pizza' },
    { email: 'nid@phuketseafood.test', label: 'Phuket Seafood' },
  ],
  staff: [
    { email: 'cs.agent@foodlink.test', label: 'Agent · CS' },
    { email: 'qc.agent@foodlink.test', label: 'Agent · QC' },
    { email: 'sales.agent@foodlink.test', label: 'Agent · Sales' },
    { email: 'cs.supervisor@foodlink.test', label: 'Supervisor' },
    { email: 'manager@foodlink.test', label: 'Manager' },
    { email: 'admin@foodlink.test', label: 'Admin' },
  ],
};
