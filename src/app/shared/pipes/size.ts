// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
