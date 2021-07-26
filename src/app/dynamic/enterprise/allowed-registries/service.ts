import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {AllowedRegistry} from './entity';
import {Observable, Subject, timer, merge} from 'rxjs';
import {switchMap, shareReplay} from 'rxjs/operators';

@Injectable()
export class AllowedRegistriesService {
  private _newRestRoot: string = environment.newRestRoot;

  private readonly _refreshTime = 10;
  private _allowedRegistries$: Observable<AllowedRegistry[]>;
  private _allowedRegistriesRefresh$ = new Subject<void>();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(private readonly _http: HttpClient, private readonly _appConfigService: AppConfigService) {}

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
