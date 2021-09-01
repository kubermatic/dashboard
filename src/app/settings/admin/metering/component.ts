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

import {Component, OnInit} from '@angular/core';
import {DatacenterService} from '@core/services/datacenter';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-metering',
  templateUrl: './template.html',
})
export class MeteringComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _dcService: DatacenterService) {}

  ngOnInit(): void {
    this._dcService.seeds
      .pipe(map(seeds => (seeds.length > 0 ? seeds[0] : null)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(seeds => console.log(seeds));
  }
}
