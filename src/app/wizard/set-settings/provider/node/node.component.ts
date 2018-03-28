import { FormGroup } from '@angular/forms';
import { WizardActions } from './../../../../redux/actions/wizard.actions';
import { Observable } from 'rxjs/Observable';
import { select } from '@angular-redux/store';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { Provider } from 'app/shared/interfaces/provider.interface';

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class ProviderNodeComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  @select(['wizard', 'setProviderForm', 'provider']) providerName$: Observable<string>;
  public provider: Provider = { name: '', payload: {} };

  @select(['wizard', 'digitalOceanClusterForm', 'access_token']) token$: Observable<string>;

  constructor() { }

  public ngOnInit(): void {
    this.subscription = this.providerName$.combineLatest(this.token$)
      .subscribe((data: [string, string]) => {
        const providerName = data[0];
        const token = data[1];

        providerName && (this.provider.name = providerName);
        token && (this.provider.payload.token = token);
      });
  }

  public ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }

  public changeNodeModel(nodeModel: CreateNodeModel): void {
    WizardActions.setNodeModel(nodeModel);
  }

  public changeForm(form: FormGroup): void {
    WizardActions.setValidation('nodeForm', form.valid);
  }
}
