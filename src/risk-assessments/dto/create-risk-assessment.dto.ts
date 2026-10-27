import { IsString, IsNumber, IsInt, Min } from "class-validator";

export class CreateRiskAssessmentDto {
  @IsString() businessType!: string;
  @IsString() industry!: string;
  @IsString() location!: string;
  @IsNumber() @Min(0) investmentAmount!: number;
  @IsInt() @Min(1) teamSize!: number;
  @IsString() concerns!: string;
}
