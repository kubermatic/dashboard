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

import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {AllowedRegistry} from './entity';
import {merge, Observable, Subject, timer} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';

@Injectable()
export class AllowedRegistriesService {
  private _newRestRoot: string = environment.newRestRoot;

  private readonly _refreshTime = 10;
  private _allowedRegistries$: Observable<AllowedRegistry[]>;
  private _allowedRegistriesRefresh$ = new Subject<void>();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfigService: AppConfigService
  ) {}

  get allowedRegistries(): Observable<AllowedRegistry[]> {
    if (!this._allowedRegistries$) {
      this._allowedRegistries$ = merge(this._allowedRegistriesRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getAllowedRegistries()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._allowedRegistries$;
  }

  private _getAllowedRegistries(): Observable<AllowedRegistry[]> {
    const url = `${this._newRestRoot}/allowedregistries`;
    return this._http.get<AllowedRegistry[]>(url);
  }

  refreshAllowedRegistries(): void {
    this._allowedRegistriesRefresh$.next();
  }

  createAllowedRegistry(template: AllowedRegistry): Observable<AllowedRegistry> {
    const url = `${this._newRestRoot}/allowedregistries`;
    return this._http.post<AllowedRegistry>(url, template);
  }

  patchAllowedRegistry(name: string, patch: AllowedRegistry): Observable<AllowedRegistry> {
    const url = `${this._newRestRoot}/allowedregistries/${name}`;
    return this._http.patch<AllowedRegistry>(url, patch);
  }

  deleteAllowedRegistry(name: string): Observable<any> {
    const url = `${this._newRestRoot}/allowedregistries/${name}`;
    return this._http.delete(url);
  }
}
