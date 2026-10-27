import { IsArray, IsIn, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AiMessageDto {
  @IsIn(['user', 'assistant'], { message: 'Message payload signature role must be either user or assistant.' })
  role!: 'user' | 'assistant';

  @IsString({ message: 'Content parameter characters must be structured as valid text.' })
  @MinLength(1, { message: 'Message text context body cannot be empty.' })
  @MaxLength(4000, { message: 'Individual prompt text context block exceeds the 4,000 character limit.' })
  content!: string;
}

export class AskAiDto {
  @IsArray({ message: 'Conversational message data must be structured inside an indexed array collection.' })
  @ValidateNested({ each: true })
  @Type(() => AiMessageDto)
  messages!: AiMessageDto[];

  @IsString({ message: 'Anti-bot challenge validation token must be structured as valid text.' })
  @MinLength(1, { message: 'Turnstile verification token parameter cannot be empty.' })
  @MaxLength(4096, { message: 'Turnstile security parameter exceeds max buffer length limits.' })
  turnstileToken!: string;
}
