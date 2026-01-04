import { ApiProperty } from '@nestjs/swagger';

export class LikePostResponseDto {
  @ApiProperty({
    example: 42,
    description: 'The updated total number of likes',
  })
  likesCount: number;
}
