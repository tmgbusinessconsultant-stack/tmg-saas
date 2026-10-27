import { IsBoolean } from 'class-validator';

export class AnalyzeFileDto {
  @IsBoolean({ message: 'Authorization confirmation flag must be an explicit boolean primitive.' })
  confirmExternalProcessing!: boolean;
}
