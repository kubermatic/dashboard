import { Observable } from 'rxjs/Observable';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { select } from '@angular-redux/store/lib/src/decorators/select';
import { Subscription } from 'rxjs/Subscription';
import { InputValidationService } from 'app/core/services';

@Component({
  selector: 'kubermatic-set-cluster-name',
  templateUrl: 'set-cluster-name.component.html',
  styleUrls: ['set-cluster-name.component.scss']
})
export class SetClusterNameComponent implements OnInit, OnDestroy {
  public clusterNameForm: FormGroup;
  private subscription: Subscription;

  @select(['wizard', 'clusterNameForm', 'name']) clusterName$: Observable<string>;
  public clusterName = '';

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  constructor(private nameGenerator: ClusterNameGenerator,
              private formBuilder: FormBuilder,
              public inputValidationService: InputValidationService) {
  }

  ngOnInit() {
    this.subscription = this.clusterName$.combineLatest(this.isChecked$)
      .subscribe((data: [string, boolean]) => {
        const clusterName = data[0];
        const isChecked = data[1];

        this.clusterName = clusterName;

        if (isChecked) {
          this.showRequiredFields();
        }
      });

    this.clusterNameForm = this.formBuilder.group({
      name: [this.clusterName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    });
  }

  public showRequiredFields() {
    if (this.clusterNameForm.invalid) {
      for (const i in this.clusterNameForm.controls) {
        if (this.clusterNameForm.controls.hasOwnProperty(i)) {
          this.clusterNameForm.get(i).markAsTouched();
        }
      }
    }
  }

  public generateName() {
    this.clusterNameForm.patchValue({ name: this.nameGenerator.generateName() });
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
