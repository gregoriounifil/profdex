import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CaptureByTokenDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  @Matches(/^[A-Za-z0-9_-]+$/)
  token: string;
}
