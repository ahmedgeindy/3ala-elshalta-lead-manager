import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLeads } from './hooks/useLeads';
import { UploadZone } from './components/UploadZone';
import { CampaignPanel } from './components/CampaignPanel';
import { MessageBuilder } from './components/MessageBuilder';
import { ProgressPanel } from './components/ProgressPanel';
import { LeadTable } from './components/LeadTable';
import { BulkSendQueue } from './components/BulkSendQueue';
import type { Lead } from './types';

export default function App() {
  const {
    leads, campaign, template, activeLeadId, stats, error,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0d0d1f' }}>

      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 52, flexShrink: 0,
        background: 'linear-gradient(90deg, #1a0a2e 0%, #16213e 100%)',
        borderBottom: '1px solid #e94560',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: '#e94560' }}>
          على الشلته{' '}
          <span style={{ color: '#f97316' }}>|</span>
          <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>Lead Manager</span>
        </div>

        {stats.total > 0 && (
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#64748b', alignItems: 'center' }}>
            <span>Campaign: <strong style={{ color: '#e2e8f0' }}>{campaign.name || '—'}</strong></span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              Total: <strong style={{ color: '#e2e8f0' }}>{stats.total}</strong>
            </span>
            <span style={{ color: '#10b981', fontFamily: '"JetBrains Mono", monospace' }}>
              ✓ {stats.sent} sent
            </span>
            <span style={{ color: '#f97316', fontFamily: '"JetBrains Mono", monospace' }}>
              {stats.pending} pending
            </span>
          </div>
        )}
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 340, flexShrink: 0,
          background: '#100f24',
          borderRight: '1px solid rgba(233,69,96,0.15)',
          overflowY: 'auto',
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <Card>
            <UploadZone onFile={loadFile} stats={stats} error={error} onResetHistory={resetHistory} />
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
            />
          </Card>
          {stats.total > 0 && (
            <Card>
              <ProgressPanel stats={stats} />
            </Card>
          )}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <LeadTable
            leads={leads}
            activeLeadId={activeLeadId}
            campaign={campaign}
            template={template}
            onSend={markSent}
            onBulkSend={openBulkQueue}
            onExport={exportCsv}
          />
        </main>
      </div>

      {/* Bulk Queue Modal */}
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
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(233,69,96,0.04)',
      border: '1px solid rgba(233,69,96,0.14)',
      borderRadius: 12,
      padding: 16,
    }}>
      {children}
    </div>
  );
}
