import { IsString, IsInt, Min, IsIn, IsOptional } from "class-validator";
export class CreateProductivityPlanDto {
  @IsString() role: string;
  @IsInt() @Min(1) teamSize: number;
  @IsString() @IsIn(["Qatar-Sun-Thu","Qatar-6-day","Intl-Mon-Fri","Intl-6-day"]) workSchedule: string;
  @IsString() country: string;
  @IsString() goals: string;
  @IsString() challenges: string;
}
