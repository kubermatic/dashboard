import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';

export abstract class Provider {
  private _requiredHeaders = [];

  protected _headers = new HttpHeaders();
  protected _restRoot = environment.restRoot;
  protected readonly _url = `${this._restRoot}/providers/${this._provider}/sizes`;

  protected constructor(protected _http: HttpClient, protected readonly _provider: NodeProvider) {}

  protected _setRequiredHeaders(...headers: any): void {
    this._requiredHeaders = headers;
  }

  protected _hasRequiredHeaders(): boolean {
    return this._headers.get(Provider.SharedHeader.Credential) !== null ||
        this._requiredHeaders.filter(header => this._headers.keys().includes(header)).length ===
        this._requiredHeaders.length;
  }

  protected _credential(credential: string): void {
    if (credential) this._headers = this._headers.set(Provider.SharedHeader.Credential, credential);
  }
}

export namespace Provider {
  export enum SharedHeader {Credential = 'Credential'}
}
