import { IsString, IsInt, IsNumber, Min, IsOptional, IsIn } from "class-validator";
export class CreateRiskAssessmentDto {
  @IsString() businessType: string;
  @IsString() industry: string;
  @IsString() location: string;
  @IsString() @IsOptional() @IsIn(["Qatar","UAE","Saudi Arabia","UK","USA","Australia","EU","India","Singapore"]) country?: string;
  @IsNumber() @Min(0) investmentAmount: number;
  @IsInt() @Min(1) teamSize: number;
  @IsString() concerns: string;
  @IsString() @IsOptional() currency?: string;
}
