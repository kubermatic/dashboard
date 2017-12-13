import { Injectable } from '@angular/core';

@Injectable()
export class CustomEventService {
  private storage: object = {};

  constructor() { }

  publish(name: string, data?: any): void {
    this.storage[name].forEach(func => func(data));
  }

  subscribe(name: string, callback: any): void {
    if (!this.storage[name]) {
      this.storage[name] = [];
    }

    this.storage[name].push(callback);
  }
}
