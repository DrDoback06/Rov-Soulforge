import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShopService } from './shop.service';

@ApiTags('shop')
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('open-pack')
  @ApiOperation({ summary: 'Open a card pack' })
  async openPack(@Body('uid') uid: string, @Body('packId') packId: string) {
    return this.shopService.openPack(uid, packId);
  }

  @Post('purchase-pack')
  @ApiOperation({ summary: 'Purchase pack with gold' })
  async purchasePack(
    @Body('uid') uid: string,
    @Body('packId') packId: string,
    @Body('quantity') quantity: number
  ) {
    return this.shopService.purchasePack(uid, packId, quantity);
  }

  @Get('inventory/:uid')
  @ApiOperation({ summary: 'Get user inventory' })
  async getInventory(@Param('uid') uid: string) {
    return this.shopService.getInventory(uid);
  }
}