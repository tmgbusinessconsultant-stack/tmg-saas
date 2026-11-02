const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const site = await prisma.site.findFirst({ where: { subdomain: { contains: 'omega' } } });
  if (!site) { console.log('OMEGA not found'); return; }
  console.log('Found OMEGA', site.id, site.subdomain);
  const fullContent = {
    content: [
      { type: 'Hero', props: { id: 'hero1', title: 'Leading Business Solutions in Qatar', subtitle: 'We help international companies establish and thrive in Qatar. Trusted by 500+ companies — Company Formation, PRO Services, Growth Strategy.', ctaText: 'Get Free Consultation', ctaLink: '/contact', bg: '#0F172A' } },
      { type: 'DynamicCards', props: { id: 'services', sectionTitle: 'Our Services', cardCount: '3', itemsJson: JSON.stringify([{ title: 'Company Formation', desc: 'Fast-track licensing & commercial registration in Qatar. 100% foreign ownership support.', icon: '🏢' }, { title: 'PRO Services', desc: 'Visa processing, document attestation, ministry approvals — done for you.', icon: '📄' }, { title: 'Business Growth', desc: 'Market entry strategy, local partner sourcing, and scaling support.', icon: '🚀' }]) } },
      { type: 'Heading', props: { id: 'about-title', text: 'Why 500+ Companies Trust OMEGA', level: 'h2', color: '#0F172A', align: 'center' } },
      { type: 'Text', props: { id: 'about-text', text: 'Based in Doha, Qatar, we provide end-to-end business setup and PRO services. From licensing to visas, we handle ministries so you focus on growth. English, Arabic, Hindi support.', color: '#475569', align: 'center' } },
      { type: 'Embed', props: { id: 'form1', url: 'https://docs.google.com/forms/d/e/1FAIpQLSd_example/viewform?embedded=true', height: '600' } },
    ],
    root: { props: { siteName: 'OMEGA Business Consulting', headerBg: '#ffffff', headerColor: '#0a2540', footerBg: '#0F172A', footerColor: '#ffffff', bg: '#ffffff' } }
  };
  await prisma.sitePage.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'home' } },
    update: { content: fullContent, seoTitle: 'OMEGA | Leading Business in Qatar', seoDesc: 'Trusted by 500+ companies' },
    create: { siteId: site.id, slug: 'home', title: 'Home', content: fullContent, seoTitle: 'OMEGA | Leading Business in Qatar', seoDesc: 'Trusted', schemaVersion: 2, isHome: true, order: 0 }
  });
  await prisma.site.update({ where: { id: site.id }, data: { status: 'PUBLISHED', headerData: { companyName: 'OMEGA Business Consulting', menu: [{ label: 'Home', href: '/' }, { label: 'About', href: '#about' }, { label: 'Services', href: '#services' }, { label: 'Contact', href: '#contact' }] }, footerData: { aboutText: 'OMEGA — Based in Doha, Qatar. PRO & business setup. Trusted by 500+ companies.', phone: '+974 1234 5678', email: 'hello@omega.qa' } } });
  console.log('✅ OMEGA upgraded to FULL demo template');
}
run().then(()=>process.exit()).catch(e=>{ console.error(e); process.exit(1); });
