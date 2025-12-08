import { IsString, IsArray, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBattleDto {
  @ApiProperty({ description: 'Array of participant UIDs' })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @ApiProperty({ description: 'Battle mode', enum: ['pvp', 'ranked', 'coop'] })
  @IsString()
  mode: string;

  @ApiProperty({ description: 'Is ranked battle', required: false })
  @IsOptional()
  @IsBoolean()
  ranked?: boolean;

  @ApiProperty({ description: 'Boss ID for co-op', required: false })
  @IsOptional()
  @IsString()
  bossId?: string;
}

export class ExecuteActionDto {
  @ApiProperty({ description: 'Battle action object' })
  @IsObject()
  action: any;
}