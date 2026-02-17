import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, ExternalLink, Edit, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CardsList({ cards, company, isLoading }) {
  const handleDownloadQR = async (cardId, memberName) => {
    const response = await fetch(`/api/qr/${cardId}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${memberName.replace(/\s+/g, '-')}-qr.png`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Loading cards...</p>
        </CardContent>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 mb-2">No cards created yet</p>
          <p className="text-sm text-gray-500">Create your first digital business card to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Team Members</h2>
        <div className="space-y-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                  {card.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{card.full_name}</h3>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {card.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/Card/${card.permanent_slug}`, '_blank')}
                  className="rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadQR(card.id, card.full_name)}
                  className="rounded-lg"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}