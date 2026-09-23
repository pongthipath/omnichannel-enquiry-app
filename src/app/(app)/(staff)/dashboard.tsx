import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Alert, Badge, Card, EmptyState, SegmentedTabs, Spinner } from '../../../components/common';
import { PageHeader, StatTile } from '../../../components/layout/page-header';
import { Permission } from '../../../constants/permissions';
import { errorMessage } from '../../../helpers/error.helper';
import { useDashboard } from '../../../hooks/queries/use-catalog';
import { usePermissions } from '../../../hooks/use-permissions';
import { DashboardPeriod } from '../../../services/dashboard.service';
import { ChatStatus } from '../../../services/enquiry.service';

const STATUS_COLOR: Record<ChatStatus, string> = {
  OPEN: '#0B76B7',
  ASSIGNED: '#6B83FA',
  IN_PROGRESS: '#3758F9',
  WAITING_FOR_CUSTOMER: '#FBBF24',
  RESOLVED: '#22AD5C',
  CLOSED: '#9CA3AF',
};

type Period = 'all' | '1' | '7' | '30';

/** Dashboard (design Dashboard.dc.html) — every number is inside the viewer's scope. */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [period, setPeriod] = useState<Period>('all');
  const days = (period === 'all' ? undefined : Number(period)) as DashboardPeriod;
  const dashboard = useDashboard(days);
  const d = dashboard.data;

  if (!can(Permission.DASHBOARD_PAGE_VIEW)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const max = (xs: { count: number }[]) => Math.max(1, ...xs.map((x) => x.count));
  const openInbox = (id: string) => router.push({ pathname: '/inbox', params: { id } });

  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <View className="w-[320px]">
            <SegmentedTabs
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'all', label: t('dashboard.period.all') },
                { value: '1', label: t('dashboard.period.today') },
                { value: '7', label: t('dashboard.period.week') },
                { value: '30', label: t('dashboard.period.month') },
              ]}
            />
          </View>
        }
      />
      {dashboard.isError && <Alert tone="error" message={errorMessage(dashboard.error, t)} />}
      {!d ? (
        <Spinner />
      ) : (
        <>
          {can(Permission.DASHBOARD_KPI_VIEW) && (
            <View className="flex-row flex-wrap gap-4">
              <StatTile label={t('dashboard.kpi.notClosed')} value={d.totals.notClosed} note={t('dashboard.kpi.notClosedNote')} />
              <StatTile label={t('dashboard.kpi.unassigned')} value={d.totals.unassigned} note={t('dashboard.kpi.unassignedNote')} tone="cyan" />
              <StatTile label={t('enquiry.slaBreached')} value={d.totals.slaBreached} note={t('dashboard.kpi.breachedNote')} tone={d.totals.slaBreached ? 'red' : 'default'} />
              <StatTile label={t('enquiry.reopened')} value={d.totals.reopened} note={t('dashboard.kpi.reopenedNote')} tone={d.totals.reopened ? 'yellow' : 'default'} />
              <StatTile
                label={t('dashboard.kpi.firstResponse')}
                value={d.totals.avgFirstResponseMinutes === null ? '—' : t('dashboard.minutes', { n: d.totals.avgFirstResponseMinutes })}
                note={t('dashboard.kpi.firstResponseNote')}
              />
            </View>
          )}

          <View className="flex-row flex-wrap gap-4">
            <Card className="min-w-[280px] flex-1 gap-3.5 p-5">
              <Text className="font-bold text-base text-dark dark:text-white">{t('dashboard.byStatus')}</Text>
              <View className="h-3 flex-row overflow-hidden rounded-full bg-gray-2">
                {d.byStatus.map((s) => (
                  <View key={s.status} style={{ flexGrow: s.count, backgroundColor: STATUS_COLOR[s.status] }} />
                ))}
              </View>
              {d.byStatus.map((s) => (
                <View key={s.status} className="flex-row items-center gap-2.5">
                  <View style={{ backgroundColor: STATUS_COLOR[s.status] }} className="h-2.5 w-2.5 rounded-sm" />
                  <Text className="flex-1 font-sans text-sm text-dark dark:text-white">{t(`enquiry.status.${s.status}`)}</Text>
                  <Text className="font-bold text-sm text-dark dark:text-white">{s.count}</Text>
                </View>
              ))}
            </Card>
            {can(Permission.DASHBOARD_CATEGORY_VIEW) && (
              <>
                <BarCard title={t('dashboard.byDepartment')} rows={d.byDepartment.map((x) => ({ key: x.departmentId, label: x.name, count: x.count }))} max={max(d.byDepartment)} color="bg-primary" />
                <BarCard title={t('dashboard.byChannel')} rows={d.byChannel.map((x) => ({ key: x.channel, label: t(`enquiry.channel.${x.channel}`), count: x.count }))} max={max(d.byChannel)} color="bg-cyan" />
              </>
            )}
          </View>

          <View className="flex-row flex-wrap gap-4">
            {can(Permission.DASHBOARD_NEAR_BREACH) && (
              <Card className="min-w-[320px] flex-1 gap-2.5 p-5">
                <Text className="font-bold text-base text-dark dark:text-white">{t('dashboard.urgent')}</Text>
                {d.urgent.length === 0 && <Text className="font-sans text-sm text-body">{t('dashboard.noUrgent')}</Text>}
                {d.urgent.map((e) => (
                  <Pressable
                    key={e.id}
                    accessibilityRole="link"
                    onPress={() => openInbox(e.id)}
                    className="flex-row items-center gap-3 rounded-lg border border-stroke px-3 py-2.5 active:bg-gray-1 dark:border-stroke-dark"
                  >
                    <Badge
                      label={e.isSlaBreached ? t('enquiry.slaBreached') : e.priority === 'URGENT' ? t('enquiry.priority.URGENT') : t('enquiry.reopened')}
                      tone={e.isSlaBreached || e.priority === 'URGENT' ? 'red' : 'yellow'}
                    />
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">{e.subject}</Text>
                      <Text numberOfLines={1} className="font-sans text-xs text-body">
                        {e.reference} · {e.customer?.companyName} · {e.assignedStaffName ?? t('inbox.panel.unassigned')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}
            <Card className="min-w-[320px] flex-1 gap-2 p-5">
              <Text className="font-bold text-base text-dark dark:text-white">{t('dashboard.team')}</Text>
              <View className="flex-row border-b border-gray-2 pb-2">
                <Text className="flex-[2] font-semibold text-xs text-body">{t('dashboard.teamCols.staff')}</Text>
                <Text className="flex-[2] font-semibold text-xs text-body">{t('dashboard.teamCols.department')}</Text>
                <Text className="flex-1 text-right font-semibold text-xs text-body">{t('dashboard.teamCols.active')}</Text>
                <Text className="flex-1 text-right font-semibold text-xs text-body">{t('dashboard.teamCols.waiting')}</Text>
              </View>
              {d.team.map((m) => (
                <View key={m.staffId ?? 'none'} className="flex-row border-b border-gray-2 py-2.5 dark:border-dark-3">
                  <Text className="flex-[2] font-semibold text-sm text-dark dark:text-white">{m.staffId ? m.name : t('inbox.panel.unassigned')}</Text>
                  <Text className="flex-[2] font-sans text-sm text-body">{m.departmentName ?? '—'}</Text>
                  <Text className="flex-1 text-right font-bold text-sm text-dark dark:text-white">{m.active}</Text>
                  <Text className="flex-1 text-right font-sans text-sm text-dark dark:text-white">{m.waiting}</Text>
                </View>
              ))}
            </Card>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function BarCard({ title, rows, max, color }: { title: string; rows: { key: string; label: string; count: number }[]; max: number; color: string }) {
  return (
    <Card className="min-w-[260px] flex-1 gap-3.5 p-5">
      <Text className="font-bold text-base text-dark dark:text-white">{title}</Text>
      {rows.map((r) => (
        <View key={r.key} className="gap-1">
          <View className="flex-row justify-between">
            <Text className="font-sans text-sm text-dark dark:text-white">{r.label}</Text>
            <Text className="font-bold text-sm text-dark dark:text-white">{r.count}</Text>
          </View>
          <View className="h-2 flex-row rounded-full bg-gray-2 dark:bg-dark-3">
            <View style={{ width: `${Math.round((r.count / max) * 100)}%` }} className={`rounded-full ${color}`} />
          </View>
        </View>
      ))}
    </Card>
  );
}
