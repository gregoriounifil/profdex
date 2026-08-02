import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCaptureDto {
  @IsString()
  @IsNotEmpty()
  professorId: string;
}
