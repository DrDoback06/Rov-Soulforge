import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';

interface CompanionRequestDto {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: {
    characterClass?: string;
    level?: number;
    alignment?: string;
    location?: { latitude: number; longitude: number };
    activeQuests?: number;
    deckSize?: number;
  };
  userId: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('companion')
  async getCompanionResponse(@Body() dto: CompanionRequestDto) {
    const response = await this.aiService.getCompanionResponse(
      dto.userId,
      dto.message,
      dto.history || [],
      dto.context || {},
    );

    return {
      response,
      timestamp: new Date().toISOString(),
    };
  }
}
