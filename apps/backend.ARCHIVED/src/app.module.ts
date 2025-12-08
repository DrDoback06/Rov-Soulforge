import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BattleModule } from './battle/battle.module';
import { QuestModule } from './quest/quest.module';
import { ActivityModule } from './activity/activity.module';
import { ShopModule } from './shop/shop.module';
import { CharacterModule } from './character/character.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AiModule } from './ai/ai.module';
import { StravaModule } from './strava/strava.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    FirebaseModule,
    BattleModule,
    QuestModule,
    ActivityModule,
    ShopModule,
    CharacterModule,
    AiModule,
    StravaModule
  ]
})
export class AppModule {}