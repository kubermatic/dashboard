import {DecimalPipe} from '@angular/common';
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'kmSize'})
export class SizeFormatterPipe implements PipeTransform {
  readonly base = 1024;
  readonly powerSuffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  constructor(private readonly decimalPipe_: DecimalPipe) {}

  transform(value: number): string {
    let divider = 1;
    let power = 0;

    while (value / divider > this.base && power < this.powerSuffixes.length - 1) {
      divider *= this.base;
      power += 1;
    }

    const formatted = this.decimalPipe_.transform(value / divider, '1.0');
    const suffix = this.powerSuffixes[power];
    return suffix ? `${formatted} ${suffix}` : formatted;
  }
}
