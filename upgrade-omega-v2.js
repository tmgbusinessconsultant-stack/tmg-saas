const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const site = await prisma.site.findFirst({ where: { subdomain: { contains: 'omega' } } });
  console.log('Found', site.id, site.subdomain);
  const fullContent = {
    content: [
      { type: 'Hero', props: { id: 'hero1', title: 'Leading Business Solutions in Qatar', subtitle: 'We help international companies establish and thrive in Qatar. Trusted by 500+ companies.', ctaText: 'Get Free Consultation', ctaLink: '/contact', bg: '#0F172A' } },
      { type: 'DynamicCards', props: { id: 'services', sectionTitle: 'Our Services', cardCount: '3', itemsJson: JSON.stringify([{ title: 'Company Formation', desc: 'Fast-track licensing', icon: '🏢' }, { title: 'PRO Services', desc: 'Visa processing', icon: '📄' }, { title: 'Business Growth', desc: 'Market entry', icon: '🚀' }]) } },
      { type: 'Heading', props: { id: 'about-title', text: 'Why 500+ Companies Trust OMEGA', level: 'h2', color: '#0F172A', align: 'center' } },
      { type: 'Text', props: { id: 'about-text', text: 'Based in Doha, Qatar, we provide end-to-end business setup.', color: '#475569', align: 'center' } },
      { type: 'Embed', props: { id: 'form1', url: 'https://docs.google.com/forms/d/e/1FAIpQLSd_example/viewform?embedded=true', height: '600' } },
    ],
    root: { props: { siteName: 'OMEGA Business Consulting', headerBg: '#ffffff', headerColor: '#0a2540', footerBg: '#0F172A', footerColor: '#ffffff', bg: '#ffffff' } }
  };
  await prisma.site.update({ 
    where: { id: site.id }, 
    data: { 
      status: 'PUBLISHED', 
      publishedAt: new Date(),
      headerData: { companyName: 'OMEGA Business Consulting', menu: [{ label: 'Home', href: '/' }, { label: 'About', href: '#about' }, { label: 'Services', href: '#services' }, { label: 'Contact', href: '#contact' }] }, 
      footerData: { aboutText: 'OMEGA — Based in Doha, Qatar.', phone: '+974 1234 5678', email: 'hello@omega.qa' } 
    } 
  });
  await prisma.sitePage.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'home' } },
    update: { content: fullContent, seoTitle: 'OMEGA | Leading Business in Qatar' },
    create: { siteId: site.id, slug: 'home', title: 'Home', content: fullContent, seoTitle: 'OMEGA', seoDesc: 'Trusted', schemaVersion: 2, isHome: true, order: 0 }
  });
  console.log('✅ OMEGA fixed');
}
run().then(()=>process.exit());
