import { IsInt, Max, Min } from 'class-validator';

export class UpdateUploadLimitDto {
  @IsInt()
  @Min(1)
  @Max(2048)
  maximumMegabytes!: number;
}
