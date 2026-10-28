import { IsString, IsOptional, IsArray, ValidateNested, IsIn, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Validates the exact structural schema of an individual chat history message object
 */
export class ChatHistoryMessageDto {
  @IsOptional()
  @IsString()
  @IsIn(['user', 'assistant', 'system'])
  role?: 'user' | 'assistant' | 'system';

  @IsOptional()
  @IsString()
  content?: string;
}

export class SuperAppChatDto {
  // Original field
  @IsOptional()
  @IsString()
  message?: string;

  // NEW - Accept frontend V7 fields (this fixes your 400 error)
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  engine?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  history?: ChatHistoryMessageDto[];
}