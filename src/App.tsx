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

      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 52, flexShrink: 0,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--accent-border)',
        boxShadow: '0 1px 12px rgba(233, 69, 96, 0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5, color: 'var(--accent)' }}>
            على الشلته
          </span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>Lead Manager</span>
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
          width: 340, flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          overflowY: 'auto',
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <Card>
            <UploadZone onFile={loadFile} stats={stats} error={error} onResetHistory={resetHistory} loading={loading} />
          </Card>
          <Card>
            <CampaignPanel campaign={campaign} onChange={setCampaign} />
          </Card>
          <Card>
            <MessageBuilder
              template={template}
              onChange={setTemplate}
              previewLead={activeLead}
              campaign={campaign}
              onChangeCampaign={setCampaign}
            />
          </Card>
          {stats.total > 0 && (
            <Card>
              <ProgressPanel stats={stats} />
            </Card>
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--accent-muted)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      transition: 'border-color var(--transition-base)',
    }}>
      {children}
    </div>
  );
}