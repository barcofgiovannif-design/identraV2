import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";

export default function UsersTable({ users, purchases, onRefresh }) {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q)
    );
  });

  const getUserPurchases = (u) =>
    purchases.filter(p => p.customer_email === u.email || p.created_by === u.email);

  const getUserTotal = (u) =>
    getUserPurchases(u).reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleDelete = async (userId) => {
    setDeletingId(userId);
    await base44.entities.User.delete(userId);
    setConfirmDelete(null);
    setDeletingId(null);
    onRefresh?.();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Users ({users.length})</CardTitle>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-center py-10 text-gray-400">No users found</p>
          )}
          {filtered.map(u => {
            const userPurchases = getUserPurchases(u);
            const total = getUserTotal(u);
            const isExpanded = expandedUser === u.id;

            return (
              <div key={u.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {(u.full_name || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.full_name || '—'}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-semibold text-gray-900">${total.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{userPurchases.length} order{userPurchases.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Badge variant="outline" className={u.role === 'admin' ? 'border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600'}>
                      {u.role || 'user'}
                    </Badge>
                    <p className="text-xs text-gray-400 hidden lg:block">{formatDate(u.created_date)}</p>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedUser(isExpanded ? null : u.id)}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    {confirmDelete === u.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={deletingId === u.id} onClick={() => handleDelete(u.id)}>
                          {deletingId === u.id ? '...' : 'Delete'}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmDelete(u.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Purchase History</p>
                    {userPurchases.length === 0 ? (
                      <p className="text-sm text-gray-400">No purchases found</p>
                    ) : (
                      <div className="space-y-2">
                        {userPurchases.map(p => (
                          <div key={p.id} className="flex justify-between items-center text-sm bg-white rounded-lg p-3 border border-gray-100">
                            <div>
                              <span className="font-medium">{p.plan_name || 'Package'}</span>
                              <span className="text-gray-400 ml-2">· {p.url_count} cards · {formatDate(p.created_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">${Number(p.amount || 0).toFixed(2)}</span>
                              <Badge variant="outline" className={p.status === 'completed' ? 'text-green-600 border-green-200' : 'text-yellow-600 border-yellow-200'}>
                                {p.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}