import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CharacterService } from './character.service';

@ApiTags('characters')
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get character by ID' })
  async getCharacter(@Param('id') id: string) {
    return this.characterService.getCharacter(id);
  }

  @Get('user/:uid')
  @ApiOperation({ summary: 'Get character by user ID' })
  async getCharacterByUid(@Param('uid') uid: string) {
    return this.characterService.getCharacterByUid(uid);
  }

  @Post()
  @ApiOperation({ summary: 'Create new character' })
  async createCharacter(@Body() characterData: any) {
    return this.characterService.createCharacter(characterData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update character' })
  async updateCharacter(@Param('id') id: string, @Body() updates: any) {
    return this.characterService.updateCharacter(id, updates);
  }
}