import {Component, OnInit} from '@angular/core';
import {EMPTY, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../core/services';
import {CredentialListEntity} from '../../../shared/entity/provider/credentials/CredentialListEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';

enum CredentialsState {
  Ready = 'Custom Preset',
  Loading = 'Loading...',
  Empty = 'No Presets available'
}

@Component({
  selector: 'kubermatic-custom-credentials-settings',
  templateUrl: './custom-credentials.component.html',
  styleUrls: ['./custom-credentials.component.scss'],
})
export class CustomCredentialsSettingsComponent implements OnInit {
  credentialList = new CredentialListEntity();
  credentialsLoaded = false;

  private _disabled = false;
  private _selectedCredentials: string;
  private _unsubscribe = new Subject<void>();
  private _state = CredentialsState.Loading;

  get selectedCredentials() {
    return this._selectedCredentials;
  }

  set selectedCredentials(newVal: string) {
    this._wizard.selectCustomCredentials(newVal);
    this._selectedCredentials = newVal;
  }

  get label() {
    return this._state;
  }

  get disabled() {
    return !this.credentialsLoaded || this._disabled;
  }

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit() {
    this._wizard.clusterProviderFormChanges$
        .pipe(switchMap(
            providerForm => providerForm.provider === NodeProvider.BRINGYOUROWN || !providerForm.provider ?
                EMPTY :
                this._wizard.credentials(providerForm.provider)))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(credentialList => {
          this.credentialsLoaded = credentialList.names ? credentialList.names.length > 0 : false;
          this._state = this.credentialsLoaded ? CredentialsState.Ready : CredentialsState.Empty;
          this.credentialList = credentialList;
        });

    this._wizard.onCustomCredentialsDisable.pipe(takeUntil(this._unsubscribe))
        .subscribe(disable => this._disabled = disable);
  }
}
