import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVisibilityDto {
  @ApiProperty({
    description: 'New visibility state for the chat session',
    enum: ['PRIVATE', 'SHARED'],
    example: 'SHARED',
  })
  @IsEnum(['PRIVATE', 'SHARED'])
  visibility: 'PRIVATE' | 'SHARED';
}
