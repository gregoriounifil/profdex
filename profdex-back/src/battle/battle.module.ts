import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BattleGateway } from './battle.gateway';
import { BattleRoomService } from './battle-room.service';
import { CooldownService } from './cooldown.service';
import { InviteService } from './invite.service';
import { PresenceService } from './presence.service';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { RatingService } from './rating.service';

@Module({
  imports: [AuthModule], // JwtModule (verificação de sessão no handshake)
  controllers: [RankingsController],
  providers: [
    BattleGateway,
    PresenceService,
    InviteService,
    CooldownService,
    BattleRoomService,
    RatingService,
    RankingsService,
  ],
})
export class BattleModule {}
