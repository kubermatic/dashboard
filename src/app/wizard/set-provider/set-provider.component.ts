import { WizardActions } from 'app/redux/actions/wizard.actions';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { Observable } from 'rxjs/Observable';
import { select } from '@angular-redux/store';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NodeProvider } from '../../shared/model/NodeProviderConstants';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-set-provider',
  templateUrl: 'set-provider.component.html',
  styleUrls: ['set-provider.component.scss']
})
export class SetProviderComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];

  public setProviderForm: FormGroup;
  public supportedNodeProviders: string[] = NodeProvider.Supported;
  public datacenters: { [key: string]: DataCenterEntity[] } = {};
  public providerRequired: boolean = false;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public selectedProvider: string = '';

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;
  public isChecked: boolean;

  constructor(private fb: FormBuilder,
              private dcService: DatacenterService) { }

  public ngOnInit(): void {
    if (this.supportedNodeProviders.length === 1) {
      WizardActions.formChanged(
        ['wizard', 'setProviderForm'],
        { provider: this.supportedNodeProviders[0] },
        true
      );

      setTimeout(() => {
        WizardActions.nextStep();
      }, 0);
    }

    const sub = this.provider$.combineLatest(this.isChecked$)
      .subscribe((data: [string, boolean]) => {
        const provider = data[0];
        const isChecked = data[1];

        provider && (this.selectedProvider = provider);
        this.isChecked = isChecked;

        if (this.isChecked) {
          this.showRequiredFields();
        }
      });
    this.subscriptions.push(sub);

    this.setProviderForm = this.fb.group({
      provider: [this.selectedProvider]
    });

    const sub2 = this.setProviderForm.valueChanges.subscribe(data => {
      WizardActions.resetForms();
      WizardActions.formChanged(
        ['wizard', 'setProviderForm'],
        { provider: data.provider },
        this.setProviderForm.valid
      );

      WizardActions.checkValidation();

      !this.isChecked && WizardActions.nextStep();
    });
    this.subscriptions.push(sub2);

    const sub3 = this.getDatacenters();
    this.subscriptions.push(sub3);
  }

  public showRequiredFields() {
    if (!this.selectedProvider) {
      this.providerRequired = true;
    } else {
      this.providerRequired = false;
    }
  }

  public getDatacenters(): Subscription {
    return this.dcService.getDataCenters().subscribe(result => {
      result.forEach(elem => {
        if (!elem.seed) {
          if (!this.datacenters.hasOwnProperty(elem.spec.provider)) {
            this.datacenters[elem.spec.provider] = [];
          }

          this.datacenters[elem.spec.provider].push(elem);
        }
      });
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
