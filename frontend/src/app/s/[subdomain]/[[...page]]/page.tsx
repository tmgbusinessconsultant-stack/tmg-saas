export const dynamic = 'force-dynamic';

import PublicSiteClient from './PublicSiteClient';

export default function Page(props: { params: Promise<{ subdomain: string; page?: string[] }> }) { return <PublicSiteClient {...props} />; }



