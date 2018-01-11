import { Injectable } from '@angular/core';

@Injectable()
export class NotificationMockService {

    public success(...restOfData: string[]) {}

    public error(...restOfData: string[]) {}
}
