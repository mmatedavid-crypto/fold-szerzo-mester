import { render } from '@react-email/components';
import React from 'react';
import { template } from './src/lib/email-templates/weekly-digest.tsx';

const data = {
  settlement: 'Kerekegyháza',
  expiresAt: '2027.01.01.',
  notices: [
    { parcels: '0123/4, 0123/5', type: 'Haszonbérleti hirdetmény', pubDate: '2026.06.10.', deadline: '2026.06.24.', url: 'https://example.com/h1' },
    { parcels: '0456/2', type: 'Adásvételi hirdetmény', pubDate: '2026.06.11.', deadline: '2026.06.25.', url: 'https://example.com/h2' },
    { parcels: '0789/1', type: 'Haszonbérleti hirdetmény', pubDate: '2026.06.12.', deadline: '2026.06.26.', url: 'https://example.com/h3' },
  ],
};
const html = await render(React.createElement(template.component, data));
const subject = typeof template.subject === 'function' ? template.subject(data) : template.subject;
const wrap = `<!doctype html><html><head><meta charset="utf-8"><title>${subject}</title></head><body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial"><div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#0f3d2e;color:#fff;padding:12px 16px;font:600 13px Arial">Tárgy: ${subject}<br><span style="font-weight:400;opacity:.8">Feladó: Dr Föld értesítő &lt;noreply@drfold.hu&gt;</span></div>${html}</div></body></html>`;
import('fs').then(fs=>fs.writeFileSync('/mnt/documents/heti-hirdetmenyek-elonezet.html', wrap));
console.log('OK', wrap.length);
