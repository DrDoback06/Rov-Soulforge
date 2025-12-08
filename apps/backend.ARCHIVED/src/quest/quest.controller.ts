import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuestService } from './quest.service';

@ApiTags('quests')
@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby quests' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  @ApiQuery({ name: 'radiusKm', required: true })
  async getNearbyQuests(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm: number
  ) {
    return this.questService.getNearbyQuests(lat, lng, radiusKm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quest by ID' })
  async getQuest(@Param('id') id: string) {
    return this.questService.getQuest(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a quest' })
  async startQuest(
    @Param('id') id: string,
    @Body('uid') uid: string,
    @Body('location') location: { lat: number; lng: number }
  ) {
    return this.questService.startQuest(id, uid, location);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a quest' })
  async completeQuest(
    @Param('id') id: string,
    @Body('progressId') progressId: string
  ) {
    return this.questService.completeQuest(progressId);
  }

  @Get('progress/:uid')
  @ApiOperation({ summary: 'Get user quest progress' })
  async getQuestProgress(@Param('uid') uid: string) {
    return this.questService.getQuestProgress(uid);
  }
}