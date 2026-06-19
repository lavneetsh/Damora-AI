import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({
    description: 'Initial title for the chat session',
    example: 'Engineering onboarding discussion',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  title?: string;
}
