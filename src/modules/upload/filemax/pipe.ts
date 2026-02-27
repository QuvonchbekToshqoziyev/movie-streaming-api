import { FileTypeValidator, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';

export const posterFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
  ],
});

export const videoFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 4 * 1024 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /^video\/(mp4|x-matroska|webm|quicktime)$/ }),
  ],
});
