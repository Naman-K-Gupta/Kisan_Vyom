import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { AuditLogDTO } from '@smart-farmer/shared';
import { EmptyState } from '../../components/common/EmptyState';
import { History, Search, Shield, Filter, Clock } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const res = await api.admin.getAuditLogs({
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        take: 100,
      });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter, actionFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Audit Compliance & Administrative Logs <Shield className="w-5 h-5 text-purple-600" />
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable forensic log of all administrative actions, price adjustments, queue movements, and capacity modifications
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col sm:flex-row items-center gap-3">
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="w-full sm:w-48 px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="">All Entities</option>
          <option value="ProcurementCentre">Procurement Centre</option>
          <option value="GovernmentCropPrice">MSP Price</option>
          <option value="QueueToken">Queue Token</option>
          <option value="User">User Account</option>
          <option value="Alert">Alert Broadcast</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-56 px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="">All Actions</option>
          <option value="MSP_PRICE_CREATED">MSP Price Created</option>
          <option value="CENTRE_CAPACITY_UPDATED">Capacity Updated</option>
          <option value="QUEUE_CALLED">Queue Called</option>
          <option value="PROCUREMENT_COMPLETED">Procurement Completed</option>
          <option value="USER_STATUS_TOGGLED">Account Status Toggled</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState
            title="No Audit Logs Found"
            description="No compliance records found for the selected filter criteria."
            icon={History}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor / User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Action Executed</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">Audit Payload Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900 font-sans">
                      {log.user?.fullName || log.userId}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        {log.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-800 font-sans">{log.action}</td>

                    <td className="px-6 py-4 text-slate-600 font-sans">
                      {log.entity} <span className="text-[10px] text-slate-400">({log.entityId.slice(0, 8)}...)</span>
                    </td>

                    <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={log.newValue || ''}>
                      {log.newValue ? log.newValue : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
