import { Injectable } from '@angular/core';

@Injectable()
export class NotificationMockService {

  public success(...restOfData: string[]): void {}

  public error(...restOfData: string[]): void {}
}
