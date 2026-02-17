import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, ExternalLink, QrCode, Search } from "lucide-react";
import EditCardModal from "./EditCardModal";

export default function AllCardsTable({ cards, companies }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCard, setEditingCard] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (cardId) => {
      const card = cards.find(c => c.id === cardId);
      await base44.entities.DigitalCard.delete(cardId);
      
      // Update company used_urls
      const company = companies.find(c => c.id === card.company_id);
      if (company) {
        await base44.entities.Company.update(card.company_id, {
          used_urls: Math.max(0, company.used_urls - 1)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allCards']);
      queryClient.invalidateQueries(['companies']);
    }
  });

  const handleDownloadQR = async (card) => {
    if (!card.qr_code_url) return;
    const response = await fetch(card.qr_code_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${card.permanent_slug}.png`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const filteredCards = cards.filter(card => 
    card.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.permanent_slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.company_name || 'Unknown';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Digital Cards ({cards.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'No cards found matching your search' : 'No cards available'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.full_name}</TableCell>
                      <TableCell>{card.title || '-'}</TableCell>
                      <TableCell>{getCompanyName(card.company_id)}</TableCell>
                      <TableCell>{card.email || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{card.permanent_slug}</TableCell>
                      <TableCell>
                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/card/${card.permanent_slug}`, '_blank')}
                            title="View Card"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          {card.qr_code_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadQR(card)}
                              title="Download QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCard(card)}
                            title="Edit Card"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete card for ${card.full_name}?`)) {
                                deleteMutation.mutate(card.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            title="Delete Card"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingCard && (
        <EditCardModal
          card={editingCard}
          companies={companies}
          onClose={() => setEditingCard(null)}
        />
      )}
    </>
  );
}