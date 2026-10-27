import { IsString, IsOptional } from 'class-validator';
export class SetPublicConfigDto {
  @IsString() key!: string;
  @IsString() value!: string;
  @IsOptional() isPublic?: boolean;
}
