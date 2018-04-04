import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { Subscription } from 'rxjs/Subscription';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-set-cluster-name',
  templateUrl: 'set-cluster-name.component.html',
  styleUrls: ['set-cluster-name.component.scss']
})
export class SetClusterNameComponent implements OnInit, OnDestroy {
  @Input() public cluster: ClusterEntity;
  public clusterNameForm: FormGroup;
  private clusterNameFormChangeSub: Subscription;

  constructor(private nameGenerator: ClusterNameGenerator, private wizardService: WizardService) { }

  ngOnInit() {
    this.clusterNameForm = new FormGroup({
      name: new FormControl(this.cluster.spec.humanReadableName, [Validators.required, Validators.minLength(5)]),
    });

    this.clusterNameFormChangeSub = this.clusterNameForm.valueChanges.subscribe(data => {
      this.wizardService.changeClusterName({
        name: this.clusterNameForm.controls.name.value,
        valid: this.clusterNameForm.valid,
      });
    });
  }

  public ngOnDestroy(): void {
    this.clusterNameFormChangeSub.unsubscribe();
  }

  public generateName() {
    this.clusterNameForm.patchValue({ name: this.nameGenerator.generateName() });
  }

}
