import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The user message content to send',
    example: 'What is our policy on remote work?',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 10000)
  content: string;
}
