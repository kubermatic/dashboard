import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { ApiService, WizardService } from '../../core/services';
import { Subscription } from 'rxjs/Subscription';
import { ClusterEntity, MasterVersion } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-set-cluster-name',
  templateUrl: 'set-cluster-name.component.html',
  styleUrls: ['set-cluster-name.component.scss']
})
export class SetClusterNameComponent implements OnInit, OnDestroy {
  @Input() public cluster: ClusterEntity;
  public clusterNameForm: FormGroup;
  public clusterSpecForm: FormGroup;
  public masterVersions: MasterVersion[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private nameGenerator: ClusterNameGenerator, private api: ApiService, private wizardService: WizardService) { }

  ngOnInit() {
    this.clusterNameForm = new FormGroup({
      name: new FormControl(this.cluster.spec.humanReadableName, [Validators.required, Validators.minLength(5)]),
    });

    this.clusterSpecForm = new FormGroup({
      version: new FormControl(this.cluster.spec.version),
    });

    this.subscriptions.push(this.clusterNameForm.valueChanges.subscribe(data => {
      this.wizardService.changeClusterName({
        name: this.clusterNameForm.controls.name.value,
        valid: this.clusterNameForm.valid,
      });
    }));

    this.subscriptions.push(this.clusterSpecForm.valueChanges.subscribe(data => {
      this.wizardService.changeClusterSpec({
        version: this.clusterSpecForm.controls.version.value,
      });
    }));

    this.loadMasterVersions();
  }

  public ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  public generateName() {
    this.clusterNameForm.patchValue({ name: this.nameGenerator.generateName() });
  }

  loadMasterVersions() {
    this.subscriptions.push(this.api.getMasterVersions().subscribe(versions => {
      this.masterVersions = versions;
    }));
  }

}
