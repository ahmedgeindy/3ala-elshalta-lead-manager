import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLeads } from './hooks/useLeads';
import { UploadZone } from './components/UploadZone';
import { CampaignPanel } from './components/CampaignPanel';
import { MessageBuilder } from './components/MessageBuilder';
import { ProgressPanel } from './components/ProgressPanel';
import { LeadTable } from './components/LeadTable';
import { BulkSendQueue } from './components/BulkSendQueue';
import { LoginGate } from './components/LoginGate';
import type { Lead } from './types';

export default function App() {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-base)' }}>

      <header className="liquid-glass" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64, flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5, color: 'var(--text-primary)' }}>
            على الشلته
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Operator Panel
          </span>
        </div>

        {stats.total > 0 && (
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'center' }}>
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

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        <aside style={{
          width: 380, flexShrink: 0,
          background: 'var(--bg-base)',
          borderRight: '1px solid var(--border-medium)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '32px 24px 40px' }}>
            <UploadZone onFile={loadFile} stats={stats} error={error} onResetHistory={resetHistory} loading={loading} />
          </div>
          <div style={{ padding: '32px 24px 40px', borderTop: '1px solid var(--border-subtle)' }}>
            <CampaignPanel campaign={campaign} onChange={setCampaign} />
          </div>
          <div style={{ padding: '32px 24px 40px', borderTop: '1px solid var(--border-subtle)' }}>
            <MessageBuilder
              template={template}
              onChange={setTemplate}
              previewLead={activeLead}
              campaign={campaign}
              onChangeCampaign={setCampaign}
            />
          </div>
          {stats.total > 0 && (
            <div style={{ padding: '32px 24px 40px', borderTop: '1px solid var(--border-subtle)' }}>
              <ProgressPanel stats={stats} />
            </div>
          )}
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
