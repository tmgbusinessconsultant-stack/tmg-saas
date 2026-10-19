import { IsBoolean } from 'class-validator';

export class AnalyzeFileDto {
  @IsBoolean()
  confirmExternalProcessing: boolean;
}
