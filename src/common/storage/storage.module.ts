import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { MalwareScanService } from './malware-scan.service';

@Module({
  providers: [StorageService, MalwareScanService],
  exports: [StorageService, MalwareScanService],
})
export class StorageModule {}
