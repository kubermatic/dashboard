import { Injectable } from '@angular/core';

@Injectable()
export class CustomEventServiceMock {

  constructor() { }

  publish(name: string, data?: any): void {
  }

  subscribe(name: string, callback: any): void {
  }
}
