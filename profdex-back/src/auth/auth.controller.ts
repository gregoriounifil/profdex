import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from './auth-session';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private rateLimit: AuthRateLimitService,
  ) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authenticate(request, response, dto.matricula, () =>
      this.auth.register(dto),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authenticate(request, response, dto.matricula, () =>
      this.auth.login(dto),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: Request & { user: unknown }) {
    return { user: request.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(
      SESSION_COOKIE_NAME,
      getSessionCookieOptions(process.env.NODE_ENV === 'production'),
    );
  }

  private async authenticate(
    request: Request,
    response: Response,
    matricula: string,
    action: () => Promise<{
      accessToken: string;
      user: { id: string; matricula: string; name: string };
    }>,
  ) {
    const key = `${request.ip}:${matricula.trim().toLowerCase()}`;
    this.rateLimit.assertAllowed(key);

    try {
      const session = await action();
      this.rateLimit.reset(key);
      response.cookie(
        SESSION_COOKIE_NAME,
        session.accessToken,
        getSessionCookieOptions(process.env.NODE_ENV === 'production'),
      );
      return { user: session.user };
    } catch (error) {
      this.rateLimit.recordFailure(key);
      throw error;
    }
  }
}
