import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscoveriesService } from './discoveries.service';

@UseGuards(JwtAuthGuard)
@Controller('discoveries')
export class DiscoveriesController {
  constructor(private discoveries: DiscoveriesService) {}

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.discoveries.findAll(req.user.id);
  }
}
