import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Check } from "lucide-react";
import toast from "react-hot-toast";

const TARGET_FIELDS = [
  { key: 'full_name', label: 'Full name *', required: true },
  { key: 'title', label: 'Title' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'bio', label: 'Bio / Description' },
  { key: 'linkedin', label: 'LinkedIn URL (→ social_links.linkedin)' },
];

export default function CsvImportModal({ company, onClose }) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [templateId, setTemplateId] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.entities.Template.filter({ company_id: company.id }),
  });

  const preview = useMemo(() => rows.slice(0, 5), [rows]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCsv(ev.target.result);
    reader.readAsText(file);
  };

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return;
    const parseLine = (line) => {
      const out = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
        if (c === '"') { inQ = !inQ; continue; }
        if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
        cur += c;
      }
      out.push(cur);
      return out;
    };
    const hdr = parseLine(lines[0]).map((h) => h.trim());
    const body = lines.slice(1).map(parseLine);
    setHeaders(hdr);
    setRows(body);

    // Heuristic auto-mapping
    const auto = {};
    for (const t of TARGET_FIELDS) {
      const match = hdr.find((h) => h.toLowerCase().replace(/\s+/g, '_').includes(t.key)
        || (t.key === 'full_name' && /nombre/i.test(h))
        || (t.key === 'title' && /cargo|puesto|title/i.test(h)));
      if (match) auto[t.key] = match;
    }
    setMapping(auto);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const payload = rows
        .map((row) => {
          const obj = {};
          for (const [key, colName] of Object.entries(mapping)) {
            if (!colName) continue;
            const idx = headers.indexOf(colName);
            if (idx === -1) continue;
            const v = (row[idx] || '').trim();
            if (!v) continue;
            if (key === 'linkedin') {
              obj.social_links = { ...(obj.social_links || {}), linkedin: v };
            } else {
              obj[key] = v;
            }
          }
          return obj;
        })
        .filter((r) => r.full_name);

      if (payload.length === 0) throw new Error('No valid rows with full_name.');

      return api.urls.import({
        company_id: company.id,
        template_id: templateId || null,
        rows: payload,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['digitalCards'] });
      if (res.errors?.length) {
        toast(`${res.created} created, ${res.errors.length} failed.`, { icon: '⚠️' });
      } else {
        toast.success(`${res.created} cards created.`);
      }
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const canSubmit = rows.length > 0 && mapping.full_name;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import members from CSV</DialogTitle></DialogHeader>

        {rows.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="font-semibold mb-1">Upload a CSV file</p>
            <p className="text-sm text-gray-500 mb-4">First row = headers (name, title, email, phone…)</p>
            <label className="inline-block">
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
              <span className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg cursor-pointer text-sm">Choose file</span>
            </label>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check className="w-4 h-4" /> {rows.length} rows detected · {headers.length} columns
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Map columns</Label>
              <div className="grid grid-cols-2 gap-3">
                {TARGET_FIELDS.map((t) => (
                  <div key={t.key} className="space-y-1">
                    <Label className="text-sm text-gray-600">{t.label}</Label>
                    <Select value={mapping[t.key] || 'none'} onValueChange={(v) => setMapping({ ...mapping, [t.key]: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="— ignore —" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— ignore —</SelectItem>
                        {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Assign template (optional)</Label>
                <Select value={templateId || 'none'} onValueChange={(v) => setTemplateId(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="— no template —" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— no template —</SelectItem>
                    {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="font-semibold mb-2 block">Preview (first 5 rows)</Label>
              <div className="overflow-x-auto border rounded-lg text-xs">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>{headers.map((h) => <th key={h} className="px-2 py-1 text-left font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="border-t">{r.map((v, j) => <td key={j} className="px-2 py-1">{v}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                className="bg-gray-900 hover:bg-gray-800"
                disabled={!canSubmit || importMutation.isPending}
                onClick={() => importMutation.mutate()}
              >
                {importMutation.isPending ? 'Importing…' : <><FileText className="w-4 h-4 mr-2" />Import {rows.length} members</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
