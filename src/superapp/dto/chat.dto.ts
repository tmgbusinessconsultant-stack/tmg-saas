import { IsString, IsOptional, IsArray } from 'class-validator';

export class SuperAppChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant', content: string }[];
}
