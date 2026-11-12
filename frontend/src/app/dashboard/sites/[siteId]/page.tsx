export const dynamic = 'force-dynamic';

import SiteAnalyticsPageClient from './SiteAnalyticsPageClient';

export default function Page(props: { params: Promise<{ siteId: string }> }) { return <SiteAnalyticsPageClient {...props} />; }



