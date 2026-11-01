import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateFormDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  fields?: any[];

  @IsOptional()
  settings?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFormDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsArray() fields?: any[];
  @IsOptional() settings?: any;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class SubmitFormDto {
  data: any;
}
