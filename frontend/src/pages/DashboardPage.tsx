// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads } from '../api/leads';
import { fetchContracts } from '../api/contracts';
import { fetchEstimates } from '../api/estimates';
import { fetchFollowUps } from '../api/followUps';
import Spinner from '../components/ui/Spinner';
import type { Lead } from '../types/lead';
import type { Contract } from '../types/contract';
import type { Estimate } from '../types/estimate';
import type { FollowUp } from '../types/followUp';

// Format a YYYY-MM-DD date without parsing it as a Date: `new Date`
// treats a bare date as UTC midnight, which shifts the day back in US
// timezones.
function formatDueDate(value: string): string {
  const [year, month, day] = value.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthName = months[Number(month) - 1];
  if (!year || !monthName || !day) return value;
  return `${monthName} ${Number(day)}, ${year}`;
}

const LEAD_STATUS_LABELS: { value: Lead['status']; label: string }[] = [  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

// Dribbble admin-panel palette: pale blue page, white cards, near-black text,
// muted blue-grey secondary text, one strong royal-blue accent.
const INK = 'text-[#0B0D10]';
const MUTED = 'text-[#A1BACA]';
const CARD =
  'bg-white border border-[#E6EEF5] rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.05)]';

function StatCard({
  testId,
  label,
  value,
  caption,
  iconBg,
  icon,
}: {
  testId: string;
  label: string;
  value: number;
  caption: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div data-testid={testId} className={`${CARD} p-6`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg} text-white`}
        >
          {icon}
        </span>
        <p className={`text-sm font-semibold ${INK}`}>{label}</p>
      </div>
      <p className={`mt-4 text-4xl font-bold ${INK}`}>{value}</p>
      <p className={`mt-1 text-sm ${MUTED}`}>{caption}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Estimates / follow-ups fail soft: the dashboard must still render
    // its stat cards if those endpoints are unavailable.
    Promise.all([
      fetchLeads(),
      fetchContracts(),
      fetchEstimates().catch(() => [] as Estimate[]),
      fetchFollowUps().catch(() => [] as FollowUp[]),
    ])
      .then(([leadData, contractData, estimateData, followUpData]) => {
        setLeads(leadData);
        setContracts(contractData);
        setEstimates(estimateData);
        setFollowUps(followUpData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const pendingContracts = contracts.filter((c) => c.status === 'pending').length;
  const signedContracts = contracts.filter((c) => c.status === 'signed').length;
  const convertedLeads = leads.filter((lead) => lead.status === 'converted').length;

  // "Today": incomplete follow-ups due today or overdue (due_date is
  // YYYY-MM-DD, so a plain string comparison against today's date works).
  const today = new Date().toISOString().split('T')[0];
  const dueToday = followUps
    .filter((f) => !f.completed && f.due_date <= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id);
  // Estimates still waiting on a follow-up (sent, not yet followed up).
  const awaitingFollowUp = estimates.filter((e) => e.status === 'sent').length;

  const leadName = (leadId: number | null): string => {
    if (leadId === null) return '—';
    const lead = leads.find((l) => l.id === leadId);
    return lead ? lead.full_name : `Lead #${leadId}`;
  };

  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
        b.id - a.id,
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-bold ${INK}`}>Dashboard</h1>

      {/* Today: follow-ups due today or overdue, plus estimates still
          awaiting a follow-up. */}
      <div data-testid="dashboard-today" className={`${CARD} p-6`}>
        <h2 className={`text-lg font-semibold ${INK} mb-4`}>Today</h2>
        <p className={`text-sm ${INK} mb-4`}>
          Estimates awaiting follow-up: {awaitingFollowUp}
        </p>
        {dueToday.length === 0 ? (
          <p className={`text-sm ${MUTED}`}>Nothing due today.</p>
        ) : (
          <ul className="divide-y divide-[#EEF3F7]">
            {dueToday.map((followUp) => (
              <li
                key={followUp.id}
                className="flex justify-between items-center py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <span>
                  <Link
                    to="/leads"
                    className="font-semibold text-[#214EDF] hover:underline"
                  >
                    {followUp.title}
                  </Link>
                  <span className={`ml-2 ${MUTED}`}>
                    {leadName(followUp.lead)}
                  </span>
                </span>
                <span className={MUTED}>
                  {followUp.due_date < today ? 'Overdue · ' : ''}
                  {formatDueDate(followUp.due_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          testId="stat-active-leads"
          label="Active Leads"
          value={leads.length}
          caption="across all statuses"
          iconBg="bg-[#214EDF]"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          testId="stat-total-contracts"
          label="Total Contracts"
          value={contracts.length}
          caption={`${signedContracts} signed`}
          iconBg="bg-[#16A34A]"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          testId="stat-pending-contracts"
          label="Contracts Pending Signature"
          value={pendingContracts}
          caption={`of ${contracts.length} total contracts`}
          iconBg="bg-[#F59E0B]"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          testId="stat-converted-leads"
          label="Converted Leads"
          value={convertedLeads}
          caption={`of ${leads.length} total leads`}
          iconBg="bg-[#7C3AED]"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Leads by status */}
      <div className={`${CARD} p-6`}>
        <h2 className={`text-lg font-semibold ${INK} mb-4`}>Leads by Status</h2>
        <ul className="divide-y divide-[#EEF3F7]">
          {LEAD_STATUS_LABELS.map(({ value, label }) => (
            <li key={value} className="flex justify-between py-2.5 text-sm first:pt-0 last:pb-0">
              <span className={INK}>{label}</span>
              <span className={`font-semibold ${INK}`}>
                {leads.filter((lead) => lead.status === value).length}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent leads */}
      <div className={`${CARD} p-6`}>
        <h2 className={`text-lg font-semibold ${INK} mb-4`}>Recent Leads</h2>
        {recentLeads.length === 0 ? (
          <p className={`text-sm ${MUTED}`}>No leads yet.</p>
        ) : (
          <ul className="divide-y divide-[#EEF3F7]">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="flex justify-between items-center py-2.5 text-sm first:pt-0 last:pb-0">
                <Link to="/leads" className="font-semibold text-[#214EDF] hover:underline">
                  {lead.full_name}
                </Link>
                <span className={`${MUTED} capitalize`}>{lead.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
