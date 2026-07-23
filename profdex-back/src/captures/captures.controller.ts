import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CapturesService } from './captures.service';
import { CaptureByTokenDto } from './dto/capture-by-token.dto';

@UseGuards(JwtAuthGuard)
@Controller('captures')
export class CapturesController {
  constructor(private captures: CapturesService) {}

  @Post('by-token')
  captureByToken(
    @Body() dto: CaptureByTokenDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.captures.captureByToken(req.user.id, dto.token);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.captures.findAll(req.user.id);
  }
}
