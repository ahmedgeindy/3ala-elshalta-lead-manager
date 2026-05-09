import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type RowSelectionState,
  type FilterFn,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass, Funnel, DownloadSimple,
  WhatsappLogo, CheckCircle, Clock, Lightning,
} from '@phosphor-icons/react';
import type { Lead, Campaign } from '../types';
import { buildMessage, buildWaLink } from '../lib/buildMessage';

interface Props {
  leads: Lead[];
  activeLeadId: string | null;
  campaign: Campaign;
  template: string;
  onSend: (id: string) => void;
  onBulkSend: (leads: Lead[]) => void;
  onExport: () => void;
}

type Filter = 'all' | 'pending' | 'sent';

const colHelper = createColumnHelper<Lead>();

const globalFilter: FilterFn<Lead> = (row, _, value) => {
  const q = String(value).toLowerCase();
  return row.original.name.toLowerCase().includes(q) || row.original.phone.includes(q);
};

export function LeadTable({ leads, activeLeadId, campaign, template, onSend, onBulkSend, onExport }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const filtered = useMemo(() => {
    if (filter === 'all') return leads;
    return leads.filter(l => l.status === filter);
  }, [leads, filter]);

  const columns = useMemo(() => [
    colHelper.display({
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    }),
    colHelper.display({
      id: 'index',
      size: 44,
      header: () => <span style={{ color: '#334155', fontSize: 10 }}>#</span>,
      cell: ({ row }) => (
        <span style={{ color: '#334155', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
          {row.index + 1}
        </span>
      ),
    }),
    colHelper.accessor('name', {
      header: 'Client Name',
      cell: ({ row }) => (
        <span style={{
          fontWeight: row.original.id === activeLeadId ? 700 : 500,
          color: row.original.id === activeLeadId ? '#e94560' : '#e2e8f0',
          fontSize: 13,
        }}>
          {row.original.name}
        </span>
      ),
    }),
    colHelper.accessor('phone', {
      header: 'Phone',
      cell: ({ getValue }) => (
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#64748b', direction: 'ltr', display: 'block' }}>
          {getValue()}
        </span>
      ),
    }),
    colHelper.accessor('status', {
      header: 'Status',
      size: 110,
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    colHelper.display({
      id: 'action',
      size: 140,
      header: () => <span style={{ color: '#334155', fontSize: 10, letterSpacing: '1px' }}>ACTION</span>,
      cell: ({ row }) => {
        const lead = row.original;
        if (lead.status === 'sent') {
          return <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={13} weight="fill" /> تم الإرسال
          </span>;
        }
        return (
          <SendButton
            onClick={() => {
              const msg = buildMessage(template, lead, campaign);
              window.open(buildWaLink(lead.phone, msg), '_blank');
              onSend(lead.id);
            }}
            isActive={lead.id === activeLeadId}
          />
        );
      },
    }),
  ], [activeLeadId, campaign, template, onSend]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { rowSelection, globalFilter: search },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearch,
    globalFilterFn: globalFilter,
    enableRowSelection: (row) => row.original.status === 'pending',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedLeads = table
    .getSelectedRowModel()
    .rows.map(r => r.original)
    .filter(l => l.status === 'pending');

  const counts = { all: leads.length, pending: leads.filter(l => l.status === 'pending').length, sent: leads.filter(l => l.status === 'sent').length };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between flex-wrap gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}
      >
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'sent'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setRowSelection({}); }}
              style={{
                background: filter === f ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === f ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 7,
                padding: '5px 12px',
                fontSize: 12,
                color: filter === f ? '#e94560' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {f === 'all' ? `All (${counts.all})` : f === 'pending' ? `Pending (${counts.pending})` : `Sent (${counts.sent})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px' }}>
            <MagnifyingGlass size={13} style={{ color: '#475569' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: '#e2e8f0', width: 170, fontFamily: '"Outfit", sans-serif' }}
            />
          </div>
          <button
            onClick={onExport}
            disabled={!leads.length}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#f97316',
              cursor: 'pointer', fontFamily: '"Outfit", sans-serif', opacity: leads.length ? 1 : 0.4,
            }}
          >
            <DownloadSimple size={13} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {leads.length === 0 ? (
          <EmptyState />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#100f24', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {table.getFlatHeaders().map(header => (
                  <th
                    key={header.id}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '1px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      position: 'sticky',
                      top: 0,
                      background: '#100f24',
                      zIndex: 1,
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
              <AnimatePresence>
                {table.getRowModel().rows.map(row => {
                  const isActive = row.original.id === activeLeadId;
                  const isSent = row.original.status === 'sent';
                  return (
                    <motion.tr
                      key={row.original.id}
                      layout
                      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: isActive ? '3px solid #e94560' : '3px solid transparent',
                        background: isActive
                          ? 'rgba(233,69,96,0.06)'
                          : isSent ? 'transparent' : 'transparent',
                        opacity: isSent ? 0.45 : 1,
                        transition: 'background 0.2s, border-left-color 0.2s, opacity 0.3s',
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} style={{ padding: '11px 16px' }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </motion.tbody>
          </table>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="flex items-center justify-between"
            style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #1a0a2e, #16213e)',
              border: '1px solid rgba(233,69,96,0.45)',
              borderRadius: 14, padding: '12px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(233,69,96,0.1)',
              gap: 20, whiteSpace: 'nowrap',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              <span style={{ color: '#e94560', fontWeight: 700 }}>{selectedLeads.length}</span> leads selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRowSelection({})}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, fontFamily: '"Outfit", sans-serif', padding: '4px 8px' }}
              >
                Clear
              </button>
              <button
                onClick={() => onBulkSend(selectedLeads)}
                className="flex items-center gap-2"
                style={{
                  background: 'linear-gradient(90deg, #e94560, #f97316)',
                  border: 'none', borderRadius: 9, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
                  fontFamily: '"Outfit", sans-serif',
                  boxShadow: '0 4px 14px rgba(233,69,96,0.35)',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Lightning size={14} weight="fill" />
                Send to {selectedLeads.length} via WhatsApp
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Checkbox({ checked, indeterminate, disabled, onChange }: {
  checked: boolean; indeterminate?: boolean; disabled?: boolean; onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      style={{
        width: 14, height: 14, cursor: disabled ? 'not-allowed' : 'pointer',
        accentColor: '#e94560', opacity: disabled ? 0.3 : 1,
      }}
      ref={el => { if (el) el.indeterminate = indeterminate ?? false; }}
    />
  );
}

function StatusBadge({ status }: { status: 'pending' | 'sent' }) {
  const isSent = status === 'sent';
  return (
    <span
      className="flex items-center gap-1"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
        background: isSent ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.12)',
        color: isSent ? '#10b981' : '#f97316',
        border: `1px solid ${isSent ? 'rgba(16,185,129,0.25)' : 'rgba(249,115,22,0.25)'}`,
      }}
    >
      {isSent ? <CheckCircle size={11} weight="fill" /> : <Clock size={11} />}
      {isSent ? 'Sent' : 'Pending'}
    </span>
  );
}

function SendButton({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1"
      style={{
        background: isActive
          ? 'linear-gradient(90deg, #e94560, #f97316)'
          : 'rgba(249,115,22,0.1)',
        border: isActive ? 'none' : '1px solid rgba(249,115,22,0.3)',
        borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600,
        color: isActive ? '#fff' : '#f97316',
        cursor: 'pointer', fontFamily: '"Outfit", sans-serif',
        boxShadow: isActive ? '0 2px 8px rgba(233,69,96,0.3)' : 'none',
        transition: 'transform 0.1s, box-shadow 0.15s',
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <WhatsappLogo size={13} weight="fill" />
      إرسال ↗
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ minHeight: 320, color: '#334155' }}>
      <Funnel size={36} style={{ opacity: 0.3 }} />
      <div style={{ fontSize: 14, color: '#475569' }}>Upload a CSV file to see your leads</div>
      <div style={{ fontSize: 12, color: '#334155' }}>Drag & drop 3laelshalta.csv into the sidebar</div>
    </div>
  );
}
