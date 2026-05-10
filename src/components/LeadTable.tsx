import { useEffect, useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
  type FilterFn,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass, DownloadSimple,
  WhatsappLogo, CheckCircle, Clock, Lightning,
  CaretLeft, CaretRight,
} from '@phosphor-icons/react';
import type { Lead, Campaign } from '../types';
import { buildMessage, buildWaLink } from '../lib/buildMessage';
import { SkeletonTable } from './SkeletonTable';

interface Props {
  leads: Lead[];
  activeLeadId: string | null;
  campaign: Campaign;
  template: string;
  loading?: boolean;
  onSend: (id: string) => void;
  onBulkSend: (leads: Lead[]) => void;
  onExport: () => void;
}

type Filter = 'all' | 'pending' | 'sent';

const PAGE_SIZE = 20;

const colHelper = createColumnHelper<Lead>();

const globalFilter: FilterFn<Lead> = (row, _, value) => {
  const q = String(value).toLowerCase();
  return row.original.name.toLowerCase().includes(q) || row.original.phone.includes(q);
};

export function LeadTable({ leads, activeLeadId, campaign, template, loading, onSend, onBulkSend, onExport }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageIndex, setPageIndex] = useState(0);

  const filtered = useMemo(() => {
    if (filter === 'all') return leads;
    return leads.filter(l => l.status === filter);
  }, [leads, filter]);

  useEffect(() => { setPageIndex(0); }, [search]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
    if (pageIndex > maxPage) setPageIndex(maxPage);
  }, [filtered.length]);

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
      header: () => <span className="label">#</span>,
      cell: ({ row, table }) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} className="tabular-nums">
          {table.getState().pagination.pageIndex * PAGE_SIZE + row.index + 1}
        </span>
      ),
    }),
    colHelper.accessor('name', {
      header: 'Client',
      cell: ({ row }) => (
        <span style={{
          fontWeight: row.original.id === activeLeadId ? 600 : row.original.status === 'sent' ? 400 : 500,
          color: row.original.id === activeLeadId ? 'var(--accent)' : row.original.status === 'sent' ? 'var(--text-muted)' : 'var(--text-primary)',
          fontSize: 13,
          textDecoration: row.original.status === 'sent' ? 'line-through' : 'none',
          opacity: row.original.status === 'sent' ? 0.6 : 1,
          transition: 'color var(--transition-fast)',
        }}>
          {row.original.name}
        </span>
      ),
    }),
    colHelper.accessor('phone', {
      header: 'Phone',
      cell: ({ getValue }) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', direction: 'ltr', display: 'block' }} className="tabular-nums">
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
      header: () => null,
      cell: ({ row }) => {
        const lead = row.original;
        if (lead.status === 'sent') {
          return <span style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={13} weight="fill" /> تم الإرسال
          </span>;
        }
        return (
          <SendButton
            onClick={() => {
              const msg = buildMessage(template, lead, campaign);
              window.open(buildWaLink(lead.phone, msg), 'whatsapp_window');
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
    state: { rowSelection, globalFilter: search, pagination: { pageIndex, pageSize: PAGE_SIZE } },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: updater => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize: PAGE_SIZE }) : updater;
      setPageIndex(next.pageIndex);
    },
    onGlobalFilterChange: setSearch,
    globalFilterFn: globalFilter,
    enableRowSelection: (row) => row.original.status === 'pending',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedLeads = table
    .getSelectedRowModel()
    .rows.map(r => r.original)
    .filter(l => l.status === 'pending');

  const counts = useMemo(() => ({
    all: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    sent: leads.filter(l => l.status === 'sent').length,
  }), [leads]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ position: 'relative' }}>
      <div
        className="flex items-center justify-between flex-wrap gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}
      >
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'sent'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setRowSelection({}); setPageIndex(0); }}
              style={{
                background: filter === f ? 'var(--accent-muted)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === f ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: filter === f ? 600 : 400,
                color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {f === 'all' ? `All (${counts.all})` : f === 'pending' ? `Pending (${counts.pending})` : `Sent (${counts.sent})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', transition: 'border-color var(--transition-fast)' }}>
            <MagnifyingGlass size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-primary)', width: 170, fontFamily: 'var(--font-sans)' }}
            />
          </div>
          <button
            onClick={onExport}
            disabled={!leads.length}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--pending-muted)', border: `1px solid var(--pending-border)`,
              borderRadius: 'var(--radius-sm)', padding: '5px 12px', fontSize: 12, color: 'var(--pending)',
              cursor: leads.length ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)', opacity: leads.length ? 1 : 0.4,
              transition: 'all var(--transition-fast)',
            }}
          >
            <DownloadSimple size={13} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonTable />
        ) : leads.length === 0 ? (
          <EmptyState />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                {table.getFlatHeaders().map(header => (
                  <th
                    key={header.id}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.8px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      position: 'sticky',
                      top: 0,
                      background: 'var(--bg-surface)',
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
                        borderBottom: '1px solid var(--border-subtle)',
                        borderLeft: isActive ? '3px solid var(--accent)' : isSent ? '3px solid var(--success)' : '3px solid transparent',
                        background: isActive ? 'var(--accent-muted)' : isSent ? 'var(--success-muted)' : 'transparent',
                        opacity: 1,
                        transition: 'background var(--transition-fast), border-left-color var(--transition-fast), opacity 0.3s',
                      }}
                      onMouseEnter={e => { if (!isActive && !isSent) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={e => { if (!isActive && !isSent) e.currentTarget.style.background = 'transparent'; }}
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

      {filtered.length > PAGE_SIZE && (
        <PaginationControls
          pageIndex={pageIndex}
          pageCount={table.getPageCount()}
          totalRows={filtered.length}
          setPageIndex={setPageIndex}
        />
      )}

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
              background: 'var(--bg-raised)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-xl)', padding: '12px 20px',
              boxShadow: 'var(--shadow-md)',
              gap: 20, whiteSpace: 'nowrap',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }} className="tabular-nums">{selectedLeads.length}</span> leads selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRowSelection({})}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)', padding: '4px 8px', transition: 'color var(--transition-fast)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Clear
              </button>
              <button
                onClick={() => onBulkSend(selectedLeads)}
                className="flex items-center gap-2"
                style={{
                  background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: '0 4px 14px rgba(233,69,96,0.35)',
                  transition: 'transform 0.1s, box-shadow var(--transition-base)',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(233,69,96,0.45)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(233,69,96,0.35)')}
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

function PaginationControls({ pageIndex, pageCount, totalRows, setPageIndex }: {
  pageIndex: number; pageCount: number; totalRows: number; setPageIndex: (i: number) => void;
}) {
  const pages = useMemo(() => {
    const items: (number | '...')[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) items.push(i);
    } else {
      items.push(0);
      if (pageIndex > 2) items.push('...');
      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(pageCount - 2, pageIndex + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (pageIndex < pageCount - 3) items.push('...');
      items.push(pageCount - 1);
    }
    return items;
  }, [pageIndex, pageCount]);

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', background: 'transparent',
    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
    transition: 'all var(--transition-fast)', fontFamily: 'var(--font-sans)',
  };

  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '10px 20px',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
        background: 'var(--bg-surface)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }} className="tabular-nums">
        {totalRows} result{totalRows !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPageIndex(0)}
          disabled={pageIndex === 0}
          aria-label="First page"
          style={{ ...btnBase, opacity: pageIndex === 0 ? 0.3 : 1, cursor: pageIndex === 0 ? 'not-allowed' : 'pointer' }}
        >
          <CaretLeft size={12} /><CaretLeft size={12} style={{ marginLeft: -6 }} />
        </button>
        <button
          onClick={() => setPageIndex(pageIndex - 1)}
          disabled={pageIndex === 0}
          aria-label="Previous page"
          style={{ ...btnBase, opacity: pageIndex === 0 ? 0.3 : 1, cursor: pageIndex === 0 ? 'not-allowed' : 'pointer' }}
        >
          <CaretLeft size={13} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPageIndex(p)}
              aria-label={`Page ${p + 1}`}
              aria-current={p === pageIndex ? 'page' : undefined}
              style={{
                ...btnBase,
                background: p === pageIndex ? 'var(--accent)' : 'transparent',
                border: p === pageIndex ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                color: p === pageIndex ? '#fff' : 'var(--text-secondary)',
                fontWeight: p === pageIndex ? 700 : 400,
              }}
            >
              {p + 1}
            </button>
          )
        )}
        <button
          onClick={() => setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
          aria-label="Next page"
          style={{ ...btnBase, opacity: pageIndex >= pageCount - 1 ? 0.3 : 1, cursor: pageIndex >= pageCount - 1 ? 'not-allowed' : 'pointer' }}
        >
          <CaretRight size={13} />
        </button>
        <button
          onClick={() => setPageIndex(pageCount - 1)}
          disabled={pageIndex >= pageCount - 1}
          aria-label="Last page"
          style={{ ...btnBase, opacity: pageIndex >= pageCount - 1 ? 0.3 : 1, cursor: pageIndex >= pageCount - 1 ? 'not-allowed' : 'pointer' }}
        >
          <CaretRight size={12} /><CaretRight size={12} style={{ marginLeft: -6 }} />
        </button>
      </div>
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
        accentColor: 'var(--accent)', opacity: disabled ? 0.3 : 1,
      }}
      ref={el => { if (el) el.indeterminate = indeterminate ?? false; }}
    />
  );
}

function StatusBadge({ status }: { status: 'pending' | 'sent' }) {
  const isSent = status === 'sent';
  return (
    <span
      className="flex items-center gap-1 tabular-nums"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 9px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600,
        background: isSent ? 'var(--success-muted)' : 'var(--pending-muted)',
        color: isSent ? 'var(--success)' : 'var(--pending)',
        border: `1px solid ${isSent ? 'var(--success-border)' : 'var(--pending-border)'}`,
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
        background: isActive ? 'var(--accent)' : 'var(--pending-muted)',
        border: isActive ? 'none' : `1px solid var(--pending-border)`,
        borderRadius: 'var(--radius-sm)', padding: '5px 12px', fontSize: 12, fontWeight: 600,
        color: isActive ? '#fff' : 'var(--pending)',
        cursor: 'pointer', fontFamily: 'var(--font-sans)',
        boxShadow: isActive ? '0 2px 8px rgba(233,69,96,0.3)' : 'none',
        transition: 'transform 0.1s, box-shadow var(--transition-fast), background var(--transition-fast)',
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(230,149,46,0.2)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--pending-muted)'; }}
    >
      <WhatsappLogo size={13} weight="fill" />
      إرسال ↗
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ minHeight: 320, color: 'var(--text-muted)' }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.2 }}>
        <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="32" x2="22" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Upload a CSV file to see your leads</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Drag and drop your contact file into the sidebar</div>
    </div>
  );
}