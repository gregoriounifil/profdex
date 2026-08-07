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
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from './auth-session';
import { AuthService } from './auth.service';
import {
  CompleteGoogleSignupDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/google.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthService } from './google-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordResetService } from './password-reset.service';
import { GoogleIdentity } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  private readonly appUrl: string;

  constructor(
    private auth: AuthService,
    private rateLimit: AuthRateLimitService,
    private google: GoogleAuthService,
    private passwordReset: PasswordResetService,
    config: ConfigService,
  ) {
    this.appUrl = (
      config.get<string>('APP_URL') ?? 'http://localhost:5173'
    ).replace(/\/$/, '');
  }

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

  // ── Login com Google ──────────────────────────────────────────────────────

  /** Início do fluxo: o passport redireciona para a tela de contas do Google. */
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleStart(): void {
    // O guard cuida do redirect; nada a fazer aqui.
  }

  /**
   * Retorno do Google. Responde com REDIRECT, não JSON: quem chega aqui é o
   * navegador saindo do domínio do Google, não uma chamada da aplicação.
   */
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(
    @Req() request: Request & { user: GoogleIdentity },
    @Res() response: Response,
  ): Promise<void> {
    const outcome = await this.google.resolve(request.user);

    if (outcome.kind === 'session') {
      const token = this.auth.signSession(
        outcome.userId,
        outcome.matricula,
        outcome.name,
        outcome.role,
      );
      response.cookie(
        SESSION_COOKIE_NAME,
        token,
        getSessionCookieOptions(process.env.NODE_ENV === 'production'),
      );
      response.redirect(`${this.appUrl}/profdex`);
      return;
    }

    // Conta nova: o ticket vai na URL porque o destino é uma tela do app, não
    // um endpoint. Ele vale 15min, serve só para completar o cadastro e é
    // assinado com uma chave distinta da de sessão.
    const params = new URLSearchParams({
      ticket: outcome.ticket,
      email: outcome.email,
      nome: outcome.suggestedName,
    });
    response.redirect(`${this.appUrl}/completar-cadastro?${params.toString()}`);
  }

  /** Conclui o cadastro iniciado pelo Google e já abre a sessão. */
  @Post('google/complete')
  @HttpCode(HttpStatus.CREATED)
  async googleComplete(
    @Body() dto: CompleteGoogleSignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.google.completeSignup(dto);
    const token = this.auth.signSession(
      user.id,
      user.matricula,
      user.name,
      user.role,
    );
    response.cookie(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(process.env.NODE_ENV === 'production'),
    );
    return { user };
  }

  // ── Redefinição de senha ──────────────────────────────────────────────────

  /**
   * Sempre 204, exista a conta ou não. Responder diferente transformaria o
   * endpoint num verificador de matrículas cadastradas.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.passwordReset.request(dto.identifier);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.passwordReset.reset(dto.token, dto.password);
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
