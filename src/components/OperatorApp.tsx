import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLeads } from '../hooks/useLeads';
import { UploadZone } from './UploadZone';
import { CampaignPanel } from './CampaignPanel';
import { MessageBuilder } from './MessageBuilder';
import { ProgressPanel } from './ProgressPanel';
import { LeadTable } from './LeadTable';
import { BulkSendQueue } from './BulkSendQueue';
import { LoginGate } from './LoginGate';
import type { Lead } from '../types';

export default function OperatorApp() {
  const {
    leads, campaign, template, activeLeadId, stats, error, loading,
    loadFile, markSent, setCampaign, setTemplate, resetHistory, exportCsv,
  } = useLeads();

  const [queueLeads, setQueueLeads] = useState<Lead[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);

  const activeLead = leads.find(l => l.id === activeLeadId) ?? null;

  const openBulkQueue = (selected: Lead[]) => {
    setQueueLeads(selected);
    setQueueOpen(true);
  };

  const closeBulkQueue = () => {
    setQueueOpen(false);
    setQueueLeads([]);
  };

  return (
    <LoginGate>
    <div className="app-shell">

      <header className="liquid-glass app-header">
        <div className="app-brand">
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5, color: 'var(--text-primary)' }}>
            على الشلته
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Operator Panel
          </span>
        </div>

        {stats.total > 0 && (
          <div className="app-stats">
            <span>Campaign: <strong style={{ color: 'var(--text-primary)' }}>{campaign.name || '—'}</strong></span>
            <span className="tabular-nums">
              Total: <strong style={{ color: 'var(--text-primary)' }}>{stats.total}</strong>
            </span>
            <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              {stats.sent} sent
            </span>
            <span style={{ color: 'var(--pending)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              {stats.pending} pending
            </span>
          </div>
        )}
      </header>

      <div className="app-body">

        <aside className="app-sidebar">
          <div className="sidebar-section sidebar-section-first">
            <UploadZone onFile={loadFile} stats={stats} error={error} onResetHistory={resetHistory} loading={loading} />
          </div>
          <div className="sidebar-section">
            <CampaignPanel campaign={campaign} onChange={setCampaign} />
          </div>
          <div className="sidebar-section">
            <MessageBuilder
              template={template}
              onChange={setTemplate}
              previewLead={activeLead}
              campaign={campaign}
              onChangeCampaign={setCampaign}
            />
          </div>
          {stats.total > 0 && (
            <div className="sidebar-section">
              <ProgressPanel stats={stats} />
            </div>
          )}
        </aside>

        <main className="app-main">
          <LeadTable
            leads={leads}
            activeLeadId={activeLeadId}
            campaign={campaign}
            template={template}
            loading={loading}
            onSend={markSent}
            onBulkSend={openBulkQueue}
            onExport={exportCsv}
          />
        </main>
      </div>

      <AnimatePresence>
        {queueOpen && (
          <BulkSendQueue
            leads={queueLeads}
            campaign={campaign}
            template={template}
            onMarkSent={markSent}
            onClose={closeBulkQueue}
          />
        )}
      </AnimatePresence>
    </div>
    </LoginGate>
  );
}