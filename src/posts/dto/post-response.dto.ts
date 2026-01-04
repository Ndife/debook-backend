import { ApiProperty } from '@nestjs/swagger';

export class PostResponseDto {
  @ApiProperty({ example: 'uuid-1234', description: 'Unique identifier' })
  id: string;

  @ApiProperty({ example: 'Hello World' })
  content: string;

  @ApiProperty({ example: 42 })
  likesCount: number;

  @ApiProperty({ example: 120 })
  viewsCount: number;

  @ApiProperty()
  createdAt: Date;
}
