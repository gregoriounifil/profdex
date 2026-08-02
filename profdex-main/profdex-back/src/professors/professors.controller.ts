import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfessorsService } from './professors.service';

@UseGuards(JwtAuthGuard)
@Controller('professors')
export class ProfessorsController {
  constructor(private professors: ProfessorsService) {}

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.professors.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professors.findOne(id);
  }
}
