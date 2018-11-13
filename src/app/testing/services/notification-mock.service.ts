import {Injectable} from '@angular/core';

@Injectable()
export class NotificationMockService {
  success(...restOfData: string[]): void {}

  error(...restOfData: string[]): void {}
}
