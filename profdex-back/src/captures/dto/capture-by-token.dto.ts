import { IsNotEmpty, IsString } from 'class-validator';

export class CaptureByTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
