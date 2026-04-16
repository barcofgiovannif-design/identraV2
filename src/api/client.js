// Local API client: auth / entities / functions / integrations over /api.

const API = '/api';

async function http(method, url, { json, query, raw } = {}) {
  const qs = query
    ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null))
      ).toString()
    : '';
  const opts = { method, credentials: 'include', headers: {} };
  if (json !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(json);
  }
  const res = await fetch(API + url + qs, opts);
  if (!res.ok) {
    let data = {};
    try { data = await res.json(); } catch {}
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (raw) return res;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : res.text();
}

function entity(resource) {
  return {
    list: (order) => http('GET', `/${resource}`, { query: order ? { order: String(order).startsWith('-') ? 'desc' : 'asc' } : {} }),
    get: (id) => http('GET', `/${resource}/${id}`),
    filter: (where) => http('GET', `/${resource}`, { query: where }),
    create: (data) => http('POST', `/${resource}`, { json: data }),
    update: (id, data) => http('PATCH', `/${resource}/${id}`, { json: data }),
    delete: (id) => http('DELETE', `/${resource}/${id}`),
  };
}

const urlsEntity = entity('urls');

export const api = {
  auth: {
    me: () => http('GET', '/auth/me'),
    updateMe: (data) => http('PATCH', '/auth/me', { json: data }),
    logout: async (redirect) => {
      try { await http('POST', '/auth/logout'); } catch {}
      if (redirect) window.location.href = redirect;
    },
    redirectToLogin: (returnUrl) => {
      const u = `/Login${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ''}`;
      window.location.href = u;
    },
  },

  entities: {
    User: entity('users'),
    Company: entity('companies'),
    Url: urlsEntity,
    // DigitalCard kept as an alias for legacy pages — same shape, backed by /api/urls.
    DigitalCard: urlsEntity,
    Purchase: entity('purchases'),
    PricingPlan: entity('plans'),
    Lead: entity('leads'),
    Interaction: entity('interactions'),
    HardwareCard: entity('hardware'),
    Template: entity('templates'),
    Team: entity('teams'),
    Webhook: entity('webhooks'),
    AuditLog: entity('audit'),
  },

  urls: {
    reassign: (id, profileData) => http('POST', `/urls/${id}/reassign`, { json: profileData }),
    unassign: (id) => http('POST', `/urls/${id}/unassign`),
    stats: (params) => http('GET', '/interactions/stats', { query: params }),
    import: (payload) => http('POST', '/urls/import', { json: payload }),
  },

  templates: {
    apply: (id, profile_ids) => http('POST', `/templates/${id}/apply`, { json: { profile_ids } }),
  },

  teams: {
    assign: (id, profile_ids) => http('POST', `/teams/${id}/assign`, { json: { profile_ids } }),
  },

  webhooks: {
    test: (id) => http('POST', `/webhooks/${id}/test`),
    deliveries: (id) => http('GET', `/webhooks/${id}/deliveries`),
  },

  leads: {
    capture: (short_code, data) => http('POST', `/leads/capture/${encodeURIComponent(short_code)}`, { json: data }),
  },

  functions: {
    invoke: async (name, payload = {}) => {
      switch (name) {
        case 'createDigitalCard':
          return { data: await http('POST', '/urls', { json: payload }) };
        case 'generateEmptyCards':
          return { data: await http('POST', '/urls/bulk', { json: payload }) };
        case 'getPublicCard':
          return { data: await http('GET', `/public/cards/${encodeURIComponent(payload.slug)}`) };
        case 'generateVCard': {
          const res = await http('GET', `/public/cards/${encodeURIComponent(payload.card_id)}/vcard`, { raw: true });
          return { data: await res.text() };
        }
        case 'stripeCheckout':
          return { data: await http('POST', '/stripe/checkout', { json: payload }) };
        case 'sendMagicLink':
          return { data: await http('POST', '/auth/send-magic-link', { json: payload }) };
        case 'sendInvoiceEmail':
          return { data: { success: true } };
        default:
          throw new Error(`Unknown function: ${name}`);
      }
    },
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API}/uploads`, { method: 'POST', credentials: 'include', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      },
      SendEmail: async () => ({ success: true }),
    },
  },
};
