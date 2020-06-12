import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {iif, merge, Observable, of, Subject, timer} from 'rxjs';
import {first, map, shareReplay, switchMap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {CreateDatacenterModel, Datacenter} from '../../../shared/entity/datacenter';
import {AppConfigService} from '../../../app-config.service';
import {Auth} from '..';

@Injectable()
export class DatacenterService {
  private _restRoot: string = environment.restRoot;
  private _datacenters$: Observable<Datacenter[]>;
  private _datacentersRefresh$ = new Subject();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * 60);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _auth: Auth,
    private readonly _appConfigService: AppConfigService
  ) {}

  init(): void {
    this._datacenters$ = merge(this._datacentersRefresh$, this._refreshTimer$)
      .pipe(switchMap(() => iif(() => this._auth.authenticated(), this._getDatacenters(), of([]))))
      .pipe(shareReplay(1));

    this._datacenters$.pipe(first()).subscribe(_ => {});
  }

  get datacenters(): Observable<Datacenter[]> {
    return this._datacenters$;
  }

  private _getDatacenters(): Observable<Datacenter[]> {
    const url = `${this._restRoot}/dc`;
    return this._httpClient.get<Datacenter[]>(url);
  }

  refreshDatacenters(): void {
    this._datacentersRefresh$.next();
  }

  getDatacenter(name: string): Observable<Datacenter> {
    return this.datacenters.pipe(map(datacenters => datacenters.find(dc => dc.metadata.name === name)));
  }

  createDatacenter(model: CreateDatacenterModel): Observable<Datacenter> {
    const url = `${this._restRoot}/seed/${model.spec.seed}/dc`;
    return this._httpClient.post<Datacenter>(url, model);
  }

  patchDatacenter(seed: string, dc: string, patch: Datacenter): Observable<Datacenter> {
    const url = `${this._restRoot}/seed/${seed}/dc/${dc}`;
    return this._httpClient.patch<Datacenter>(url, patch);
  }

  deleteDatacenter(datacenter: Datacenter): Observable<any> {
    const url = `${this._restRoot}/seed/${datacenter.spec.seed}/dc/${datacenter.metadata.name}`;
    return this._httpClient.delete(url);
  }
}
