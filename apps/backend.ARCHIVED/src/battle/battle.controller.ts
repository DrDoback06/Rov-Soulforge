import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { CreateBattleDto, ExecuteActionDto } from './dto';

@ApiTags('battles')
@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new battle' })
  async createBattle(@Body() dto: CreateBattleDto) {
    return this.battleService.createBattle(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get battle by ID' })
  async getBattle(@Param('id') id: string) {
    return this.battleService.getBattle(id);
  }

  @Post(':id/actions')
  @ApiOperation({ summary: 'Execute battle action' })
  async executeAction(
    @Param('id') id: string,
    @Body() dto: ExecuteActionDto
  ) {
    return this.battleService.executeAction(id, dto);
  }

  @Post(':id/pass-turn')
  @ApiOperation({ summary: 'Pass turn' })
  async passTurn(@Param('id') id: string, @Body('charId') charId: string) {
    return this.battleService.passTurn(id, charId);
  }

  @Post(':id/surrender')
  @ApiOperation({ summary: 'Surrender battle' })
  async surrender(@Param('id') id: string, @Body('charId') charId: string) {
    return this.battleService.surrender(id, charId);
  }

  @Get(':id/log')
  @ApiOperation({ summary: 'Get battle log' })
  async getBattleLog(@Param('id') id: string) {
    return this.battleService.getBattleLog(id);
  }
}