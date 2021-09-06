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

import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DatacenterService} from '@core/services/datacenter';
import {MeteringConfiguration} from '@shared/entity/datacenter';
import {Subject} from 'rxjs';
import {filter, map, switchMap, takeUntil} from 'rxjs/operators';
import {MeteringService} from './service/metering';

@Component({
  selector: 'km-metering',
  templateUrl: './template.html',
})
export class MeteringComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();
  config: MeteringConfiguration;
  isLoading = true;

  constructor(
    private readonly _dcService: DatacenterService,
    private readonly _meteringService: MeteringService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._meteringService.onConfigurationChange$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._dcService.refreshSeedSettings());

    this._dcService.seeds
      .pipe(map(seeds => (seeds.length > 0 ? seeds[0] : null)))
      .pipe(filter(seed => seed !== null))
      .pipe(switchMap(seed => this._dcService.seedSettings(seed)))
      .pipe(map(settings => settings.metering))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: config => {
          this.isLoading = false;
          this.config = config;
          this._cdr.detectChanges();
        },
        error: _ => {
          this.isLoading = false;
          this._cdr.detectChanges();
        },
      });
  }
}
