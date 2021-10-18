//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2020 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

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
