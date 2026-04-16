import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, QrCode, ExternalLink } from "lucide-react";
import { api } from "@/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function GenerateCardsModal({ isOpen, onClose, companies }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [generatedCards, setGeneratedCards] = useState(null);
  const queryClient = useQueryClient();

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const availableSlots = selectedCompany 
    ? selectedCompany.purchased_urls - selectedCompany.used_urls 
    : 0;

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.functions.invoke('generateEmptyCards', {
        company_id: selectedCompanyId,
        quantity: parseInt(quantity)
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedCards(data.cards);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['allCards'] });
    }
  });

  const handleGenerate = () => {
    if (!selectedCompanyId || quantity <= 0) return;
    generateMutation.mutate();
  };

  const handleClose = () => {
    setSelectedCompanyId("");
    setQuantity(1);
    setGeneratedCards(null);
    generateMutation.reset();
    onClose();
  };

  const handleDownloadQR = async (card) => {
    const response = await fetch(card.qr_code_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${card.slug}.png`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Empty Cards with QR Codes</DialogTitle>
        </DialogHeader>

        {!generatedCards ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Select Company</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.company_name} ({company.purchased_urls - company.used_urls} slots available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompany && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Purchased URLs:</span>
                  <span className="font-semibold">{selectedCompany.purchased_urls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used URLs:</span>
                  <span className="font-semibold">{selectedCompany.used_urls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available Slots:</span>
                  <span className="font-semibold text-green-600">{availableSlots}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Quantity to Generate</Label>
              <Input
                type="number"
                min="1"
                max={availableSlots}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, availableSlots))}
                disabled={!selectedCompanyId}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will generate {quantity} empty card(s) with permanent URLs and QR codes. 
                The company will be able to assign these cards to team members later.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={!selectedCompanyId || quantity <= 0 || generateMutation.isPending}
                className="bg-gray-900 hover:bg-gray-800"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate {quantity} Card{quantity > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>

            {generateMutation.isError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                Error: {generateMutation.error?.message || 'Failed to generate cards'}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-semibold">
                ✓ Successfully generated {generatedCards.length} card(s)
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedCards.map((card, index) => (
                <div key={card.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Card {index + 1}</p>
                      <p className="text-xs text-gray-500 mb-2">Slug: {card.slug}</p>
                      <p className="text-xs text-gray-600 break-all">{card.url}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(card.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadQR(card)}
                        className="bg-gray-900 hover:bg-gray-800"
                      >
                        <QrCode className="w-3 h-3 mr-1" />
                        QR
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}