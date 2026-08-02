import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDiscoveryDto } from './dto/create-discovery.dto';
import { DiscoveriesService } from './discoveries.service';

@UseGuards(JwtAuthGuard)
@Controller('discoveries')
export class DiscoveriesController {
  constructor(private discoveries: DiscoveriesService) {}

  @Post()
  create(@Body() dto: CreateDiscoveryDto, @Request() req: { user: { id: string } }) {
    return this.discoveries.create(req.user.id, dto.professorId);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.discoveries.findAll(req.user.id);
  }
}
