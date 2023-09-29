import { Injectable, Logger } from '@nestjs/common';
import { unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private uploadDir = join(__dirname, '..', '..', 'uploads');
  delete(file: string) {
    try {
      unlinkSync(join(this.uploadDir, file));
    } catch (error) {
      this.logger.error((error as Error).message);
    }
  }
}
