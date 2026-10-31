'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [aiCompanyName, setAiCompanyName] = useState("");
  const [aiIndustry, setAiIndustry] = useState("Corporate Consulting");
  const [aiTone, setAiTone] = useState("Professional");
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [settingsSite, setSettingsSite] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'domain'|'header'|'footer'>('domain');
  const [domainInput, setDomainInput] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [menuJson, setMenuJson] = useState('[{"label":"Home","href":"/"},{"label":"About","href":"/about"}]');
  const [footerAbout, setFooterAbout] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const load = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:4000/api/sites', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    setSites(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const openSettings = (site: any) => {
    setSettingsSite(site);
    setActiveTab('domain');
    setDomainInput(site.domain || '');
    setLogoUrl(site.logoUrl || site.headerData?.logoUrl || '');
    setCompanyName(site.headerData?.companyName || site.name || '');
    setMenuJson(JSON.stringify(site.headerData?.menu || [{"label":"Home","href":"/"},{"label":"About","href":"/about"}], null, 2));
    setFooterAbout(site.footerData?.aboutText || '');
    setFooterPhone(site.footerData?.phone || '');
    setFooterEmail(site.footerData?.email || '');
    setFooterCopyright(site.footerData?.copyright || `© ${new Date().getFullYear()} ${site.name}`);
  };

  const handleLogoFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Max 5MB');
    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`http://localhost:4000/api/sites/${settingsSite.id}/logo-upload`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: form,
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.message || 'Upload failed');
      setLogoUrl(out.url);
      alert('✅ Logo uploaded: ' + out.url);
      load();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const deleteSite = async (id: string) => {
    if (!confirm('Delete this website permanently?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/sites/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) { const err = await res.json(); return alert(err.message || 'Delete failed'); }
    alert('🗑️ Deleted'); load();
  };

  const getLogoSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('/uploads')) return `http://localhost:4000${url}`;
    return url;
  };

  const saveDomain = async () => {
    if (!domainInput) return alert('Enter domain');
    setSaving(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/sites/${settingsSite.id}/domain`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ domain: domainInput })
    });
    const out = await res.json();
    setSaving(false);
    if (!res.ok) return alert(out.message || 'Domain failed');
    alert('✅ Domain saved! Add CNAME: ' + domainInput + ' -> cname.tmgbusinessconsulting.com');
    load(); setSettingsSite({ ...settingsSite, domain: domainInput });
  };

  const saveHeader = async () => {
    setSaving(true);
    try {
      const menu = JSON.parse(menuJson);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/sites/${settingsSite.id}/header`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ headerData: { logoUrl, companyName, menu }, logoUrl })
      });
      if (!res.ok) throw new Error('Header save failed');
      alert('✅ Header saved'); load();
    } catch (e:any) { alert(e.message); } finally { setSaving(false); }
  };

  const saveFooter = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/sites/${settingsSite.id}/footer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ footerData: { aboutText: footerAbout, phone: footerPhone, email: footerEmail, copyright:footerCopyright } })
    });
    const out = await res.json();
    setSaving(false);
    if (!res.ok) return alert(out.message || 'Footer failed');
    alert('✅ Footer saved'); load();
  };

  const create = async (withAi = false) => {
    const finalName = withAi ? aiCompanyName : name;
    if (!finalName) return alert('Enter business name');
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      let settings: any = {};
      if (withAi) {
        setAiGenerating(true);
        try {
          const aiRes = await fetch('http://localhost:4000/api/ai/generate-layout', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ companyName: aiCompanyName, industry: aiIndustry, tone: aiTone, targetAudience: 'General Public & Business Owners in Qatar', componentType: 'hero' })
          });
          if (aiRes.ok) { const aiOutput = await aiRes.json(); settings = { aiGenerated: true, companyName: aiCompanyName, industry: aiIndustry, tone: aiTone, initialHero: aiOutput }; }
        } catch {} finally { setAiGenerating(false); }
      }
      const res = await fetch('http://localhost:4000/api/sites', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ name: finalName, settings })
      });
      const site = await res.json();
      if (!res.ok) throw new Error(site.message || 'Create failed');
      setName(''); setAiCompanyName(''); setShowAiDrawer(false); load();
      window.location.href = '/builder/' + site.id;
    } catch (err: any) { alert(err.message); } finally { setCreating(false); setAiGenerating(false); }
  };

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>TMG Builder — My Sites</h1>
      <div className='flex gap-2 mb-8 flex-wrap'>
        <input value={name} onChange={e => setName(e.target.value)} placeholder='Al Mansour Consulting' className='border p-3 rounded w-80' />
        <button onClick={() => create(false)} disabled={creating} className='bg-black text-white px-6 py-3 rounded'>{creating ? 'Creating...' : '+ Create Website'}</button>
        <button onClick={() => setShowAiDrawer(!showAiDrawer)} className='border border-black px-6 py-3 rounded'>✨ AI Create</button>
      </div>
      {showAiDrawer && (
        <div className='border rounded-xl p-6 mb-8 bg-gray-50'>
          <h3 className='font-bold text-lg mb-4'>AI Website Generator</h3>
          <div className='grid grid-cols-3 gap-4'>
            <input value={aiCompanyName} onChange={e => setAiCompanyName(e.target.value)} placeholder='Company Name' className='border p-3 rounded' />
            <select value={aiIndustry} onChange={e => setAiIndustry(e.target.value)} className='border p-3 rounded'>
              <option>Corporate Consulting</option><option>Construction</option><option>Trading</option><option>Technology</option><option>Real Estate</option><option>Logistics</option><option>Healthcare</option>
            </select>
            <select value={aiTone} onChange={e => setAiTone(e.target.value)} className='border p-3 rounded'>
              <option>Professional</option><option>Friendly</option><option>Bold</option><option>Luxury</option>
            </select>
          </div>
          <div className='flex gap-2 mt-4'>
            <button onClick={() => create(true)} disabled={aiGenerating || creating} className='bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50'>{aiGenerating ? 'AI Generating...' : '✨ Create with AI'}</button>
            <button onClick={() => setShowAiDrawer(false)} className='text-gray-500 px-4'>Cancel</button>
          </div>
        </div>
      )}
      <div className='grid grid-cols-3 gap-4'>
        {sites.map((s: any) => (
          <div key={s.id} className='border rounded-lg p-4 bg-white'>
            <h3 className='font-bold'>{s.name}</h3>
            <p className='text-sm text-gray-500'>{s.subdomain}</p>
            <p className='text-xs mt-1 truncate'>{s.domain}</p>
            <p className='text-xs mt-2'>Status: <span className={s.status === 'PUBLISHED' ? 'text-green-600' : ''}>{s.status}</span></p>
            {s.settings?.aiGenerated && <p className='text-xs mt-1 text-blue-600'>✨ AI Generated</p>}
            <div className='flex gap-2 mt-4 flex-wrap'>
              <Link href={'/builder/' + s.id} className='bg-blue-600 text-white px-3 py-1 rounded text-sm'>Edit</Link>
              <Link href={'/s/' + s.subdomain} className='border px-3 py-1 rounded text-sm' target='_blank'>View</Link>
              <button onClick={() => openSettings(s)} className='border border-black px-3 py-1 rounded text-sm'>⚙️ Settings</button>
              <button onClick={() => deleteSite(s.id)} className='bg-red-600 text-white px-3 py-1 rounded text-sm'>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {settingsSite && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto'>
            <div className='p-6 border-b flex justify-between items-center'>
              <h2 className='font-bold text-xl'>Website Settings — {settingsSite.name}</h2>
              <button onClick={() => setSettingsSite(null)} className='text-2xl'>×</button>
            </div>
            <div className='flex border-b'>
              <button onClick={() => setActiveTab('domain')} className={`px-4 py-3 text-sm font-semibold ${activeTab==='domain'?'border-b-2 border-black':''}`}>🌐 Custom Domain</button>
              <button onClick={() => setActiveTab('header')} className={`px-4 py-3 text-sm font-semibold ${activeTab==='header'?'border-b-2 border-black':''}`}>🔝 Header</button>
              <button onClick={() => setActiveTab('footer')} className={`px-4 py-3 text-sm font-semibold ${activeTab==='footer'?'border-b-2 border-black':''}`}>🔻 Footer</button>
            </div>
            <div className='p-6'>
              {activeTab==='domain' && (
                <div>
                  <label className='text-sm font-medium'>Custom Domain (e.g. almuhairi.com)</label>
                  <input value={domainInput} onChange={e=>setDomainInput(e.target.value)} placeholder='yourdomain.com' className='border p-3 rounded w-full mt-2' />
                  <div className='bg-yellow-50 border border-yellow-200 rounded p-3 mt-3 text-xs'>
                    <p className='font-bold'>After saving, add this DNS record:</p>
                    <p className='mt-1'>Type: CNAME | Name: @ | Target: cname.tmgbusinessconsulting.com</p>
                  </div>
                  <button onClick={saveDomain} disabled={saving} className='mt-4 bg-black text-white px-6 py-2 rounded'>{saving?'Saving...':'Save Domain'}</button>
                </div>
              )}
              {activeTab==='header' && (
                <div className='space-y-4'>
                  <div className='border-2 border-dashed rounded-lg p-4 bg-gray-50'>
                    <label className='text-sm font-bold'>📁 Upload Logo File (JPG, PNG, WEBP, SVG — Max 5MB)</label>
                    <input type='file' accept='image/*' onChange={handleLogoFileUpload} className='border p-2 rounded w-full mt-2 bg-white' />
                    {uploadingLogo && <p className='text-sm text-blue-600 mt-2'>Uploading...</p>}
                  </div>
                  <label className='text-sm font-medium'>Or Logo URL
                    <input value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder='/uploads/logos/xxx.png or https://.../logo.png' className='border p-3 rounded w-full mt-1' />
                    {logoUrl && <img src={getLogoSrc(logoUrl)} alt='logo' className='h-16 mt-2 object-contain border rounded bg-white p-1' />}
                  </label>
                  <label className='text-sm font-medium'>Company Name<input value={companyName} onChange={e=>setCompanyName(e.target.value)} className='border p-3 rounded w-full mt-1' /></label>
                  <label className='text-sm font-medium'>Menu JSON<textarea value={menuJson} onChange={e=>setMenuJson(e.target.value)} rows={4} className='border p-3 rounded w-full mt-1 font-mono text-xs' /></label>
                  <button onClick={saveHeader} disabled={saving} className='bg-black text-white px-6 py-2 rounded'>{saving?'Saving...':'Save Header'}</button>
                </div>
              )}
              {activeTab==='footer' && (
                <div className='space-y-4'>
                  <label className='text-sm font-medium'>About Text<textarea value={footerAbout} onChange={e=>setFooterAbout(e.target.value)} rows={3} className='border p-3 rounded w-full mt-1' /></label>
                  <div className='grid grid-cols-2 gap-3'>
                    <input value={footerPhone} onChange={e=>setFooterPhone(e.target.value)} placeholder='Phone' className='border p-3 rounded' />
                    <input value={footerEmail} onChange={e=>setFooterEmail(e.target.value)} placeholder='Email' className='border p-3 rounded' />
                  </div>
                  <input value={footerCopyright} onChange={e=>setFooterCopyright(e.target.value)} placeholder='Copyright' className='border p-3 rounded w-full' />
                  <button onClick={saveFooter} disabled={saving} className='bg-black text-white px-6 py-2 rounded'>{saving?'Saving...':'Save Footer'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

