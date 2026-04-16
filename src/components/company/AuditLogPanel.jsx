import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { History, Search } from "lucide-react";

const ACTION_COLORS = {
  'url.created':    'bg-blue-100 text-blue-700',
  'url.updated':    'bg-gray-100 text-gray-700',
  'url.reassigned': 'bg-amber-100 text-amber-700',
  'csv.imported':   'bg-indigo-100 text-indigo-700',
  'lead.captured':  'bg-green-100 text-green-700',
  'team.created':   'bg-purple-100 text-purple-700',
  'team.members_assigned': 'bg-purple-100 text-purple-700',
  'webhook.created': 'bg-teal-100 text-teal-700',
};

export default function AuditLogPanel({ company }) {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.entities.AuditLog.filter({ company_id: company.id, limit: 500 }),
    refetchInterval: 15_000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.action, l.actor_email, l.entity_type, l.entity_id, JSON.stringify(l.metadata)]
        .some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [logs, search]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5" /> Audit log ({logs.length})
            </h2>
            <p className="text-sm text-gray-500">Registro inmutable de acciones críticas (creación, reasignación, leads, webhooks…).</p>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-gray-500">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>Sin registros todavía.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.map((l) => (
              <div key={l.id} className="flex items-start gap-3 py-2 px-3 rounded hover:bg-gray-50 border-b last:border-0 text-sm">
                <div className="whitespace-nowrap text-xs text-gray-500 pt-1 w-36">
                  {new Date(l.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <Badge className={`${ACTION_COLORS[l.action] || 'bg-gray-100 text-gray-700'} border-0`}>
                  {l.action}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700">
                    <span className="font-medium">{l.actor_email || 'system'}</span>
                    {l.entity_type && <span className="text-gray-500"> · {l.entity_type}</span>}
                    {l.entity_id && <span className="font-mono text-xs text-gray-400"> · {l.entity_id.slice(0, 8)}</span>}
                  </div>
                  {l.metadata && (
                    <pre className="text-xs text-gray-500 font-mono truncate">{JSON.stringify(l.metadata)}</pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
