import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ActivityService } from './activity.service';

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit fitness activity' })
  async submitActivity(@Body() activityData: any) {
    return this.activityService.submitActivity(activityData);
  }

  @Get(':uid')
  @ApiOperation({ summary: 'Get user activities' })
  async getActivities(@Param('uid') uid: string) {
    return this.activityService.getActivities(uid);
  }
}