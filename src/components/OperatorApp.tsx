import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLeads } from '../hooks/useLeads';
import { UploadZone } from './UploadZone';
import { CampaignPanel } from './CampaignPanel';
import { SmartMenuEditor } from './SmartMenuEditor';
import { SmartMenuPublishPanel } from './SmartMenuPublishPanel';
import { MessageBuilder } from './MessageBuilder';
import { ProgressPanel } from './ProgressPanel';
import { LeadTable } from './LeadTable';
import { BulkSendQueue } from './BulkSendQueue';
import { LoginGate } from './LoginGate';
import { createPage, updatePage } from '../lib/smartMenuApi';
import { generateSlug } from '../lib/slugUtils';
import type { Lead, SmartMenuPage } from '../types';

export default function OperatorApp() {
  const {
    leads, campaign, template, activeLeadId, stats, error, loading,
    loadFile, markSent, setCampaign, setTemplate, resetHistory, exportCsv,
  } = useLeads();

  const [queueLeads, setQueueLeads] = useState<Lead[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);

  const [smartMenuPage, setSmartMenuPage] = useState<Partial<SmartMenuPage>>(() => {
    if (!campaign.name) return {};
    return {
      campaignName: campaign.name,
      slug: generateSlug(campaign.name),
      imageUrls: campaign.imageUrls?.length ? campaign.imageUrls : [],
    };
  });

  // Sync campaign name and images into the draft if they change
  useEffect(() => {
    setSmartMenuPage(prev => ({
      ...prev,
      campaignName: campaign.name || prev.campaignName,
      imageUrls: campaign.imageUrls,
    }));
  }, [campaign.name, campaign.imageUrls]);

  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const activeLead = leads.find(l => l.id === activeLeadId) ?? null;

  const openBulkQueue = (selected: Lead[]) => {
    setQueueLeads(selected);
    setQueueOpen(true);
  };

  const closeBulkQueue = () => {
    setQueueOpen(false);
    setQueueLeads([]);
  };

  const handlePublish = async () => {
    setPublishError(null);
    setPublishing(true);

    const pageData = {
      slug: smartMenuPage.slug ?? '',
      campaignName: smartMenuPage.campaignName ?? campaign.name,
      title: smartMenuPage.title ?? '',
      offerHeadline: smartMenuPage.offerHeadline ?? '',
      offerDescription: smartMenuPage.offerDescription ?? '',
      imageUrls: smartMenuPage.imageUrls ?? campaign.imageUrls,
      orderPhone: smartMenuPage.orderPhone ?? '',
      orderMessage: smartMenuPage.orderMessage ?? '',
      isActive: smartMenuPage.isActive ?? true,
    };

    const result = await createPage(pageData);
    if (result.error) {
      setPublishError(result.error);
    } else if (result.data) {
      const url = `/m/${result.data.slug}`;
      setPublishedUrl(url);
      setSmartMenuPage(result.data);
      setCampaign({ ...campaign, url });
    }
    setPublishing(false);
  };

  const handleUpdate = async () => {
    if (!smartMenuPage.id) return;
    setPublishError(null);
    setPublishing(true);

    const pageData = {
      slug: smartMenuPage.slug ?? '',
      campaignName: smartMenuPage.campaignName ?? campaign.name,
      title: smartMenuPage.title ?? '',
      offerHeadline: smartMenuPage.offerHeadline ?? '',
      offerDescription: smartMenuPage.offerDescription ?? '',
      imageUrls: smartMenuPage.imageUrls ?? campaign.imageUrls,
      orderPhone: smartMenuPage.orderPhone ?? '',
      orderMessage: smartMenuPage.orderMessage ?? '',
      isActive: smartMenuPage.isActive ?? true,
    };

    const result = await updatePage(smartMenuPage.id, pageData);
    if (result.error) {
      setPublishError(result.error);
    } else if (result.data) {
      const url = `/m/${result.data.slug}`;
      setPublishedUrl(url);
      setSmartMenuPage(result.data);
      setCampaign({ ...campaign, url });
    }
    setPublishing(false);
  };

  return (
    <LoginGate>
    <div className="app-shell">

      <header className="liquid-glass app-header">
        <div className="app-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.jpeg" alt="Logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5, color: 'var(--text-primary)' }}>
              على الشلته
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              لوحة تحكم التشغيل
            </span>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="app-stats">
            <span>الحملة: <strong style={{ color: 'var(--text-primary)' }}>{campaign.name || '—'}</strong></span>
            <span className="tabular-nums">
              الإجمالي: <strong style={{ color: 'var(--text-primary)' }}>{stats.total}</strong>
            </span>
            <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              تم الإرسال {stats.sent}
            </span>
            <span style={{ color: 'var(--pending)', fontFamily: 'var(--font-mono)' }} className="tabular-nums">
              قيد الانتظار {stats.pending}
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

        <aside className="app-config-sidebar">
          <div className="sidebar-section sidebar-section-first">
            <MessageBuilder
              template={template}
              onChange={setTemplate}
              previewLead={activeLead}
              campaign={campaign}
              onChangeCampaign={setCampaign}
            />
          </div>
          <div className="sidebar-section">
            <SmartMenuEditor
              page={smartMenuPage}
              onChange={setSmartMenuPage}
              error={publishError}
            />
            <div style={{ marginTop: 12 }}>
              <SmartMenuPublishPanel
                publishedUrl={publishedUrl}
                publishing={publishing}
                error={publishError}
                onPublish={handlePublish}
                onUpdate={handleUpdate}
                isExisting={!!smartMenuPage.id}
                imageUrls={smartMenuPage.imageUrls ?? []}
                onRetry={handlePublish}
              />
            </div>
          </div>
        </aside>
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