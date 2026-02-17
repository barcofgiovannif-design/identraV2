import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Linkedin, Twitter, MessageCircle, Download, ExternalLink, Loader2, Instagram, Facebook } from "lucide-react";
import { motion } from "framer-motion";

export default function CardPage() {
  const [card, setCard] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    try {
      const slug = window.location.pathname.split('/Card/')[1] || window.location.pathname.split('/card/')[1];
      if (!slug) {
        setLoading(false);
        return;
      }

      const cards = await base44.entities.DigitalCard.filter({ permanent_slug: slug });
      
      if (cards.length === 0) {
        setLoading(false);
        return;
      }

      const cardData = cards[0];
      setCard(cardData);

      const companies = await base44.entities.Company.filter({ id: cardData.company_id });
      if (companies.length > 0) {
        setCompany(companies[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading card:', error);
      setLoading(false);
    }
  };

  const handleDownloadVCard = async () => {
    setDownloading(true);
    try {
      const response = await base44.functions.invoke('generateVCard', { card_id: card.id });
      const blob = new Blob([response.data], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.full_name.replace(/\s+/g, '-')}.vcf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Error downloading contact');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Card Not Found</h1>
            <p className="text-gray-600">This digital business card does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandColor = company?.brand_color || '#000000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Card className="overflow-hidden shadow-xl">
          {/* Header Section */}
          <motion.div
            className="h-32"
            style={{ backgroundColor: brandColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          <CardContent className="pt-0 px-6 pb-6">
            {/* Profile Section */}
            <div className="relative -mt-16 mb-6">
              <motion.div 
                className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg mx-auto border-4 border-white"
                style={{ color: brandColor }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                {card.full_name.charAt(0)}
              </motion.div>
            </div>

            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{card.full_name}</h1>
              <p className="text-xl text-gray-600 mb-1">{card.title}</p>
              <p className="text-lg text-gray-500">{card.company_name}</p>
              {company?.logo_url && (
                <img src={company.logo_url} alt="Company logo" className="h-12 object-contain mx-auto mt-4" />
              )}
            </motion.div>

            {/* Overview */}
            {card.overview && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 text-center">{card.overview}</p>
              </div>
            )}

            {/* Contact Actions */}
            <motion.div 
              className="space-y-3 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {card.email && (
                <motion.a 
                  href={`mailto:${card.email}`} 
                  className="block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="outline" className="w-full rounded-lg h-12 justify-start">
                    <Mail className="w-5 h-5 mr-3" />
                    {card.email}
                  </Button>
                </motion.a>
              )}

              {card.phone && (
                <motion.a 
                  href={`tel:${card.phone}`} 
                  className="block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="outline" className="w-full rounded-lg h-12 justify-start">
                    <Phone className="w-5 h-5 mr-3" />
                    {card.phone}
                  </Button>
                </motion.a>
              )}

              {card.messaging_links?.whatsapp && (
                <motion.a 
                  href={`https://wa.me/${card.messaging_links.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="outline" className="w-full rounded-lg h-12 justify-start">
                    <MessageCircle className="w-5 h-5 mr-3" />
                    WhatsApp
                  </Button>
                </motion.a>
              )}
            </motion.div>

            {/* Social Links */}
            {(card.social_links?.linkedin || card.social_links?.twitter || card.social_links?.instagram || card.social_links?.facebook || card.social_links?.website) && (
              <div className="flex gap-3 justify-center mb-6 flex-wrap">
                {card.social_links?.linkedin && (
                  <a href={card.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Linkedin className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.twitter && (
                  <a href={card.social_links.twitter} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Twitter className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.instagram && (
                  <a href={card.social_links.instagram} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Instagram className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.facebook && (
                  <a href={card.social_links.facebook} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Facebook className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.website && (
                  <a href={card.social_links.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <ExternalLink className="w-5 h-5" />
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Download vCard */}
            <Button
              onClick={handleDownloadVCard}
              disabled={downloading}
              className="w-full rounded-lg h-12"
              style={{ backgroundColor: brandColor }}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Save to Contacts
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        <motion.p 
          className="text-center text-gray-500 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Powered by Identra
        </motion.p>
      </div>
    </div>
  );
}