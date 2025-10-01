import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StravaService } from './strava.service';
import { ConfigService } from '@nestjs/config';

@Controller('strava')
export class StravaController {
  constructor(
    private readonly stravaService: StravaService,
    private readonly configService: ConfigService,
  ) {}

  @Get('authorize')
  getAuthorizationUrl() {
    const clientId = this.configService.get('STRAVA_CLIENT_ID');
    const redirectUri = 'realmofvalor://strava-callback';
    const scope = 'read,activity:read_all';

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

    return { authUrl };
  }

  @Post('callback')
  async handleCallback(@Body() body: { code: string; userId: string }) {
    const tokens = await this.stravaService.exchangeCodeForTokens(body.code, body.userId);
    return { success: true, tokens };
  }

  @Get('activities')
  async getActivities(@Query('userId') userId: string, @Query('page') page = 1) {
    const activities = await this.stravaService.getRecentActivities(userId, page, 30);
    return { activities };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Query('hub.challenge') challenge?: string) {
    // Webhook verification
    if (challenge) {
      return { 'hub.challenge': challenge };
    }

    // Process webhook event
    await this.stravaService.handleWebhookEvent(body);
    return { success: true };
  }

  @Get('webhook')
  handleWebhookVerification(@Query() query: any) {
    const verifyToken = this.configService.get('STRAVA_WEBHOOK_VERIFY_TOKEN');

    if (query['hub.verify_token'] === verifyToken) {
      return { 'hub.challenge': query['hub.challenge'] };
    }

    return { error: 'Invalid verify token' };
  }
}
