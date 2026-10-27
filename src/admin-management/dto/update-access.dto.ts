import { IsEnum, IsArray, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';
export class UpdateAccessDto {
  @IsEnum(UserRole) role!: UserRole;
  @IsArray() @IsOptional() permissions?: string[];
}
