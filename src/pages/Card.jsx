import React, { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Linkedin, Twitter, MessageCircle, Download, ExternalLink, Loader2, Instagram, Facebook } from "lucide-react";
import { motion } from "framer-motion";

export default function CardPage() {
  const [card, setCard] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

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

      // Use public endpoint to fetch card data without authentication
      const response = await api.functions.invoke('getPublicCard', { slug });
      
      if (!response.data || !response.data.card) {
        setLoading(false);
        return;
      }

      setCard(response.data.card);
      setCompany(response.data.company);
      setLoading(false);
    } catch (error) {
      console.error('Error loading card:', error);
      setLoading(false);
    }
  };

  const trackClick = (target, url) => {
    if (!card?.permanent_slug) return;
    api.events.log(card.permanent_slug, 'link_click', { target, url });
  };

  const doDownloadVCard = async () => {
    setDownloading(true);
    try {
      const response = await api.functions.invoke('generateVCard', { card_id: card.id });
      const blob = new Blob([response.data], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.full_name.replace(/\s+/g, '-')}.vcf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      api.events.log(card.permanent_slug, 'vcard_download');
    } catch (error) {
      alert('Error downloading contact');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVCard = () => {
    // Lead Capture Mode: ask for the visitor's data before releasing the vCard.
    const alreadyCaptured = sessionStorage.getItem(`lead:${card.permanent_slug}`);
    if (card.lead_capture_enabled && !alreadyCaptured) {
      setShowLeadForm(true);
    } else {
      doDownloadVCard();
    }
  };

  const handleLeadSubmit = async (leadData) => {
    setLeadSubmitting(true);
    try {
      await fetch(`/api/leads/capture/${encodeURIComponent(card.permanent_slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      sessionStorage.setItem(`lead:${card.permanent_slug}`, '1');
      setShowLeadForm(false);
      doDownloadVCard();
    } catch {
      setShowLeadForm(false);
      doDownloadVCard();
    } finally {
      setLeadSubmitting(false);
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

  const brandColor = card.custom_color || company?.brand_color || '#000000';
  const fontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  }[card.font_style || 'sans'];

  const templateStyles = {
    modern: {
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      headerBg: brandColor,
      cardBg: 'bg-white'
    },
    classic: {
      bg: 'bg-gray-50',
      headerBg: '#1e293b',
      cardBg: 'bg-white'
    },
    minimal: {
      bg: 'bg-white',
      headerBg: '#f8f9fa',
      cardBg: 'bg-white border-2 border-gray-200'
    },
    gradient: {
      bg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50',
      headerBg: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}CC 100%)`,
      cardBg: 'bg-white/80 backdrop-blur-sm'
    }
  };

  const template = templateStyles[card.template || 'modern'];

  return (
    <div className={`min-h-screen ${template.bg} py-12 px-6 ${fontClass}`}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Card className={`overflow-hidden shadow-xl ${template.cardBg}`}>
          {/* Header Section */}
          <motion.div
            className="h-32"
            style={{ 
              background: typeof template.headerBg === 'string' && template.headerBg.startsWith('linear-gradient') 
                ? template.headerBg 
                : undefined,
              backgroundColor: typeof template.headerBg === 'string' && !template.headerBg.startsWith('linear-gradient')
                ? template.headerBg
                : undefined
            }}
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
                  onClick={() => trackClick('email', card.email)}
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
                  onClick={() => trackClick('phone', card.phone)}
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
                  onClick={() => trackClick('whatsapp', card.messaging_links.whatsapp)}
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
                  <a href={card.social_links.linkedin} onClick={() => trackClick('linkedin', card.social_links.linkedin)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Linkedin className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.twitter && (
                  <a href={card.social_links.twitter} onClick={() => trackClick('twitter', card.social_links.twitter)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Twitter className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.instagram && (
                  <a href={card.social_links.instagram} onClick={() => trackClick('instagram', card.social_links.instagram)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Instagram className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.facebook && (
                  <a href={card.social_links.facebook} onClick={() => trackClick('facebook', card.social_links.facebook)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                      <Facebook className="w-5 h-5" />
                    </Button>
                  </a>
                )}
                {card.social_links?.website && (
                  <a href={card.social_links.website} onClick={() => trackClick('website', card.social_links.website)} target="_blank" rel="noopener noreferrer">
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

      {showLeadForm && (
        <LeadCaptureModal
          brandColor={brandColor}
          submitting={leadSubmitting}
          onClose={() => setShowLeadForm(false)}
          onSubmit={handleLeadSubmit}
          onSkip={() => { setShowLeadForm(false); doDownloadVCard(); }}
        />
      )}
    </div>
  );
}

function LeadCaptureModal({ brandColor, submitting, onClose, onSubmit, onSkip }) {
  const [lead, setLead] = useState({ name: '', email: '', phone: '', company: '' });
  const submit = (e) => { e.preventDefault(); onSubmit(lead); };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1">Before saving the contact</h2>
        <p className="text-sm text-gray-600 mb-4">Share your info for a reciprocal exchange.</p>
        <form onSubmit={submit} className="space-y-3">
          <input required placeholder="Your name *" className="w-full border rounded-lg px-3 py-2" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
          <input required type="email" placeholder="Email *" className="w-full border rounded-lg px-3 py-2" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
          <input placeholder="Phone" className="w-full border rounded-lg px-3 py-2" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
          <input placeholder="Company" className="w-full border rounded-lg px-3 py-2" value={lead.company} onChange={(e) => setLead({ ...lead, company: e.target.value })} />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onSkip} className="flex-1 border rounded-lg px-4 py-3 text-sm text-gray-600">Skip</button>
            <button type="submit" disabled={submitting} className="flex-[2] text-white rounded-lg px-4 py-3 text-sm font-semibold" style={{ backgroundColor: brandColor }}>
              {submitting ? 'Sending…' : 'Save contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}