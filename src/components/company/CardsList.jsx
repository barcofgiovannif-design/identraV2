import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, ExternalLink, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EditCardModal from "./EditCardModal";

export default function CardsList({ cards, company, isLoading }) {
  const [editing, setEditing] = useState(null);

  const handleDownloadQR = async (card) => {
    if (!card.qr_code_url) return;
    try {
      const res = await fetch(card.qr_code_url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(card.full_name || card.permanent_slug).replace(/\s+/g, '-')}-qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      window.open(card.qr_code_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Cargando tarjetas...</p>
        </CardContent>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 mb-2">Aún no hay tarjetas creadas</p>
          <p className="text-sm text-gray-500">Crea tu primera tarjeta digital para empezar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Team Members</h2>
        <div className="space-y-4">
          {cards.map((card) => {
            const displayName = card.full_name || 'Sin asignar';
            const initial = (displayName[0] || '?').toUpperCase();
            return (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                    {initial}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
                    <p className="text-sm text-gray-600">{card.title || '—'}</p>
                    <div className="flex gap-2 mt-1 items-center">
                      <Badge variant={card.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {card.status}
                      </Badge>
                      <span className="text-xs font-mono text-gray-400">/{card.permanent_slug}</span>
                      {typeof card.tap_count === 'number' && (
                        <span className="text-xs text-gray-500">· {card.tap_count} taps</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(card)}
                    className="rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/Card/${card.permanent_slug}`, '_blank')}
                    className="rounded-lg"
                    title="Ver tarjeta pública"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadQR(card)}
                    className="rounded-lg"
                    title="Descargar QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {editing && <EditCardModal card={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}
