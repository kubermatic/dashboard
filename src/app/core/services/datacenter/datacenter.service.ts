import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {merge, Observable, Subject, timer} from 'rxjs';
import {map, shareReplay, switchMap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {AppConfigService} from '../../../app-config.service';

@Injectable()
export class DatacenterService {
  private restRoot: string = environment.restRoot;
  private _datacenters$: Observable<DataCenterEntity[]>;
  private _datacentersRefresh$ = new Subject();
  private _refreshTimer$ = timer(
    0,
    this._appConfigService.getRefreshTimeBase() * 60
  );

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _appConfigService: AppConfigService
  ) {}

  get datacenters(): Observable<DataCenterEntity[]> {
    if (!this._datacenters$) {
      this._datacenters$ = merge(this._datacentersRefresh$, this._refreshTimer$)
        .pipe(switchMap(() => this._getDatacenters()))
        .pipe(shareReplay(1));
    }
    return this._datacenters$;
  }

  private _getDatacenters(): Observable<DataCenterEntity[]> {
    const url = `${this.restRoot}/dc`;
    return this._httpClient.get<DataCenterEntity[]>(url);
  }

  refreshDatacenters(): void {
    this._datacentersRefresh$.next();
  }

  getDatacenter(name: string): Observable<DataCenterEntity> {
    return this.datacenters.pipe(
      map(datacenters => datacenters.find(dc => dc.metadata.name === name))
    );
  }

  deleteDatacenter(datacenter: DataCenterEntity): Observable<any> {
    const url = `${this.restRoot}/seed/${datacenter.spec.seed}/dc/${datacenter.metadata.name}`;
    return this._httpClient.delete(url);
  }
}
