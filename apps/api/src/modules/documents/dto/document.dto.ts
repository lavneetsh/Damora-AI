import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ description: 'The workspace ID to upload the document to' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}

export class DocumentResponseDto {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  pageCount: number | null;
  errorMessage: string | null;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
  signedUrl?: string;
}
