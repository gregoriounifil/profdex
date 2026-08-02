import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDiscoveryDto {
  @IsString()
  @IsNotEmpty()
  professorId: string;
}
