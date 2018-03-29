import { FormGroup } from '@angular/forms';
import { WizardActions } from './../../../../redux/actions/wizard.actions';
import { Observable } from 'rxjs/Observable';
import { select } from '@angular-redux/store';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Provider } from '../../../../shared/interfaces/provider.interface';
import { NodeEntity } from '../../../../shared/entity/NodeEntity';
import { CloudSpec } from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})

export class ProviderNodeComponent implements OnInit, OnDestroy {

  @select(['wizard', 'setProviderForm', 'provider']) providerName$: Observable<string>;
  public provider: Provider = { name: '', payload: {} };
  @select(['wizard', 'digitalOceanClusterForm', 'access_token']) token$: Observable<string>;
  private subscription: Subscription;

  @select(['wizard', 'cloudSpec']) cloudSpec$: Observable<any>;
  public cloudSpec: CloudSpec;

  constructor() {}

  public ngOnInit(): void {

    this.subscription = this.providerName$.combineLatest(this.token$, this.cloudSpec$)
      .subscribe((data: [string, string, CloudSpec]) => {
        const providerName = data[0];
        const token = data[1];
        const cloudSpec = data[2];

        providerName && (this.provider.name = providerName);
        token && (this.provider.payload.token = token);
        cloudSpec && (this.provider.payload.cloudSpec = cloudSpec);
      });
  }

  public ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }

  public changeNodeModel(nodeModel: NodeEntity): void {
    WizardActions.setNodeModel(nodeModel);
  }

  public changeForm(form: FormGroup): void {
    WizardActions.setValidation('nodeForm', form.valid);
  }
}
