import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import type { SendEmailDto } from './dto/send-email.dto';

type ProviderResponse = Record<string, unknown>;

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  status() {
    const microsoftConfigured = this.hasMicrosoftCredentials();
    const driveConfigured = microsoftConfigured && Boolean(process.env.M365_DRIVE_ID?.trim());
    const powerBiConfigured = microsoftConfigured && Boolean(process.env.POWERBI_WORKSPACE_ID?.trim());
    const emailConfigured = microsoftConfigured && Boolean(process.env.M365_SENDER_EMAIL?.trim());

    return {
      microsoft365: {
        state: microsoftConfigured ? 'credentials-configured' : 'not-configured',
        drive: driveConfigured ? 'configured' : 'not-configured',
        outlook: emailConfigured ? 'configured' : 'not-configured',
      },
      powerBi: {
        state: powerBiConfigured ? 'credentials-configured' : 'not-configured',
      },
      adobe: {
        state: 'not-integrated',
        message: 'Adobe PDF Services operations are not implemented yet.',
      },
    };
  }

  async listDriveItems() {
    const driveId = this.requiredSetting('M365_DRIVE_ID');
    const accessToken = await this.accessToken('https://graph.microsoft.com/.default');
    const path = `/v1.0/drives/${encodeURIComponent(driveId)}/root/children?$select=id,name,webUrl,size,lastModifiedDateTime,file,folder&$top=100`;
    const result = await this.providerJson(
      `https://graph.microsoft.com${path}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      'Microsoft Graph',
    );
    const items = Array.isArray(result.value) ? result.value : [];
    return items.map((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as ProviderResponse;
      return {
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        webUrl: typeof item.webUrl === 'string' ? item.webUrl : null,
        size: typeof item.size === 'number' ? item.size : null,
        lastModifiedDateTime: typeof item.lastModifiedDateTime === 'string'
          ? item.lastModifiedDateTime
          : null,
        type: item.folder ? 'folder' : 'file',
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }

  async sendEmail(user: AuthenticatedUser, input: SendEmailDto) {
    const sender = this.requiredSetting('M365_SENDER_EMAIL');
    const recipient = input.to.trim().toLowerCase();
    const subject = input.subject.trim();
    const body = input.body.trim();
    const audit = await this.prisma.contentAuditLog.create({
      data: {
        actorId: user.id,
        action: 'MICROSOFT365_EMAIL_SEND_REQUESTED',
        entityType: 'INTEGRATION',
        entityId: 'MICROSOFT365_OUTLOOK',
        detail: {
          recipient,
          subject,
        } satisfies Prisma.InputJsonObject,
      },
      select: { id: true },
    });

    const accessToken = await this.accessToken('https://graph.microsoft.com/.default');
    await this.providerJson(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'Text', content: body },
            toRecipients: [{ emailAddress: { address: recipient } }],
          },
          saveToSentItems: true,
        }),
      },
      'Microsoft Graph',
      true,
    );
    this.logger.log(`Microsoft 365 email send request ${audit.id} accepted.`);
    return { success: true, message: 'Email accepted by Microsoft 365.' };
  }

  async listPowerBiReports() {
    const workspaceId = this.requiredSetting('POWERBI_WORKSPACE_ID');
    const accessToken = await this.accessToken('https://analysis.windows.net/powerbi/api/.default');
    const result = await this.providerJson(
      `https://api.powerbi.com/v1.0/myorg/groups/${encodeURIComponent(workspaceId)}/reports`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      'Power BI',
    );
    const reports = Array.isArray(result.value) ? result.value : [];
    return reports.map((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const report = entry as ProviderResponse;
      return {
        id: typeof report.id === 'string' ? report.id : '',
        name: typeof report.name === 'string' ? report.name : '',
        webUrl: typeof report.webUrl === 'string' ? report.webUrl : null,
        embedUrl: typeof report.embedUrl === 'string' ? report.embedUrl : null,
        datasetId: typeof report.datasetId === 'string' ? report.datasetId : null,
      };
    }).filter((report): report is NonNullable<typeof report> => report !== null);
  }

  async createPowerBiEmbedToken(reportId: string) {
    if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(reportId)) {
      throw new ServiceUnavailableException('The Power BI report identifier is invalid.');
    }
    const workspaceId = this.requiredSetting('POWERBI_WORKSPACE_ID');
    const accessToken = await this.accessToken('https://analysis.windows.net/powerbi/api/.default');
    const result = await this.providerJson(
      `https://api.powerbi.com/v1.0/myorg/groups/${encodeURIComponent(workspaceId)}/reports/${encodeURIComponent(reportId)}/GenerateToken`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessLevel: 'View' }),
      },
      'Power BI',
    );
    if (typeof result.token !== 'string' || typeof result.expiration !== 'string') {
      throw new ServiceUnavailableException('Power BI did not return a valid embed token.');
    }
    return { token: result.token, expiration: result.expiration };
  }

  private async accessToken(scope: string): Promise<string> {
    const tenantId = this.requiredSetting('M365_TENANT_ID');
    const clientId = this.requiredSetting('M365_CLIENT_ID');
    const clientSecret = this.requiredSetting('M365_CLIENT_SECRET');
    const response = await this.providerJson(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope,
          grant_type: 'client_credentials',
        }),
      },
      'Microsoft identity platform',
    );
    if (typeof response.access_token !== 'string') {
      throw new ServiceUnavailableException('The identity provider did not return an access token.');
    }
    return response.access_token;
  }

  private async providerJson(
    url: string,
    init: RequestInit,
    provider: string,
    allowEmptyResponse = false,
  ): Promise<ProviderResponse> {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      this.logger.warn(`${provider} returned HTTP ${response.status}.`);
      throw new ServiceUnavailableException(`${provider} request failed (${response.status}).`);
    }
    if (allowEmptyResponse && response.status === 202) return {};
    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new ServiceUnavailableException(`${provider} returned an invalid response.`);
    }
    return payload as ProviderResponse;
  }

  private hasMicrosoftCredentials(): boolean {
    return [
      'M365_TENANT_ID',
      'M365_CLIENT_ID',
      'M365_CLIENT_SECRET',
    ].every((key) => Boolean(process.env[key]?.trim()));
  }

  private requiredSetting(key: string): string {
    const value = process.env[key]?.trim();
    if (!value) throw new ServiceUnavailableException(`${key} is not configured.`);
    return value;
  }
}
