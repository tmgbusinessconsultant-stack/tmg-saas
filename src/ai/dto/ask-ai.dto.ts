import { IsArray, IsIn, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AiMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}

export class AskAiDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiMessageDto)
  messages: AiMessageDto[];

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  turnstileToken: string;
}
