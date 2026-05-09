import { useState, useCallback } from 'react';
import type { Lead, Campaign } from '../types';
import { parseFile, extractPhone, extractName } from '../lib/parseFile';
import { normalizeEgyptianPhone, isValidPhone } from '../lib/phoneNorm';
import { getSentPhones, addSentPhone, saveCampaign, loadCampaign, clearSentPhones } from '../lib/storage';
import { DEFAULT_TEMPLATE } from '../lib/buildMessage';

const DEFAULT_CAMPAIGN: Campaign = {
  name: 'Ramadan 25%',
  discount: '25%',
  duration: 'أسبوع',
  url: '',
  imageUrl: '',
};

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaign, setCampaignState] = useState<Campaign>(
    () => loadCampaign() ?? DEFAULT_CAMPAIGN
  );
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      setError(null);
      const rows = await parseFile(file);
      const sentPhones = getSentPhones();

      const newLeads: Lead[] = rows
        .map((row, i) => {
          const rawPhone = extractPhone(row);
          const phone = normalizeEgyptianPhone(rawPhone);
          if (!isValidPhone(phone)) return null;
          return {
            id: `${phone}-${i}`,
            name: extractName(row),
            phone,
            rawPhone,
            status: sentPhones.has(phone) ? ('sent' as const) : ('pending' as const),
            rowData: row,
          };
        })
        .filter((l): l is Lead => l !== null);

      setLeads(newLeads);
      const first = newLeads.find(l => l.status === 'pending');
      setActiveLeadId(first?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, []);

  const markSent = useCallback((id: string) => {
    setLeads(prev => {
      const updated = prev.map(l =>
        l.id === id ? { ...l, status: 'sent' as const } : l
      );
      const next = updated.find(l => l.id !== id && l.status === 'pending');
      setActiveLeadId(next?.id ?? null);
      const lead = prev.find(l => l.id === id);
      if (lead) addSentPhone(lead.phone);
      return updated;
    });
  }, []);

  const setCampaign = useCallback((camp: Campaign) => {
    setCampaignState(camp);
    saveCampaign(camp);
  }, []);

  const resetHistory = useCallback(() => {
    clearSentPhones();
    setLeads(prev => prev.map(l => ({ ...l, status: 'pending' as const })));
    setActiveLeadId(leads[0]?.id ?? null);
  }, [leads]);

  const exportCsv = useCallback(() => {
    if (!leads.length) return;
    const lines = [
      'Name,Phone,Status',
      ...leads.map(l => `"${l.name}","${l.phone}","${l.status}"`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.name || 'leads'}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [leads, campaign.name]);

  const stats = {
    total: leads.length,
    sent: leads.filter(l => l.status === 'sent').length,
    pending: leads.filter(l => l.status === 'pending').length,
  };

  return {
    leads,
    campaign,
    template,
    activeLeadId,
    stats,
    error,
    loading,
    loadFile,
    markSent,
    setCampaign,
    setTemplate,
    resetHistory,
    exportCsv,
  };
}
