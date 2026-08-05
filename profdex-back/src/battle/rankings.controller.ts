import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingsService } from './rankings.service';

@UseGuards(JwtAuthGuard)
@Controller('rankings')
export class RankingsController {
  constructor(private rankings: RankingsService) {}

  @Get('battle')
  battle(
    @Request() req: { user: { id: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.rankings.battleLeaderboard(req.user.id, Math.max(1, page));
  }
}
