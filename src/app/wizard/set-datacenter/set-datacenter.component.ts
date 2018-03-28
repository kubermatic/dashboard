import { WizardActions } from 'app/redux/actions/wizard.actions';
import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { select } from '@angular-redux/store/lib/src/decorators/select';
import { Observable } from 'rxjs/Observable';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { ApiService } from 'app/core/services/api/api.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss']
})
export class SetDatacenterComponent implements OnInit, OnDestroy, AfterContentInit {
  public setDatacenterForm: FormGroup;
  public datacenters: { [key: string]: DataCenterEntity[] } = {};
  private subscriptions: Subscription[] = [];
  public datacenterRequired = false;

  @select(['wizard', 'setDatacenterForm', 'datacenter']) datacenter$: Observable<DataCenterEntity>;
  public selectedDatacenter: DataCenterEntity;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public selectedProvider: string;

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;
  public isChecked: boolean;

  constructor(private fb: FormBuilder,
              private dcService: DatacenterService) { }

  ngOnInit() {
    const sub = this.datacenter$.combineLatest(this.provider$, this.isChecked$)
      .subscribe((data: [DataCenterEntity, string, boolean]) => {
        const datacenter = data[0];
        const provider = data[1];
        const isChecked = data[2];

        datacenter && (this.selectedDatacenter = datacenter);
        provider && (this.selectedProvider = provider);
        this.isChecked = isChecked;

        if (isChecked) {
          this.showRequiredFields();
        }
      });
    this.subscriptions.push(sub);

    this.setDatacenterForm = this.fb.group({
      datacenter: [null, [Validators.required]]
    });

    this.setDatacenterForm.valueChanges.subscribe(data => {
      WizardActions.formChanged(
        ['wizard', 'setDatacenterForm'],
        { datacenter: data.datacenter },
        this.setDatacenterForm.valid
      );
      WizardActions.checkValidation();

      !this.isChecked && WizardActions.nextStep();
    });
  }

  public ngAfterContentInit(): void {
    const sub2 = this.getDatacenters();
    this.subscriptions.push(sub2);
  }

  public showRequiredFields() {
    if (!this.selectedDatacenter) {
      this.datacenterRequired = true;
    } else {
      this.datacenterRequired = false;
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

      if (!!this.selectedProvider) {
        if (this.datacenters[this.selectedProvider].length === 1) {
          WizardActions.formChanged(
            ['wizard', 'setDatacenterForm'],
            { datacenter: this.datacenters[this.selectedProvider][0] },
            this.setDatacenterForm.valid
          );

          setTimeout(() => {
            WizardActions.nextStep();
          }, 0);
        }
      }
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
