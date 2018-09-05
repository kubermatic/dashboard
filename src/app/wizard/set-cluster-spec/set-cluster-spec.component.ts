import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClusterNameGenerator } from '../../core/util/name-generator.service';
import { ApiService, WizardService } from '../../core/services';
import { Subscription } from 'rxjs/Subscription';
import { ClusterEntity, MasterVersion } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-set-cluster-spec',
  templateUrl: 'set-cluster-spec.component.html',
  styleUrls: ['set-cluster-spec.component.scss']
})
export class SetClusterSpecComponent implements OnInit, OnDestroy {
  @Input() public cluster: ClusterEntity;
  public clusterSpecForm: FormGroup;
  public masterVersions: MasterVersion[] = [];
  public defaultVersion: string;
  private subscriptions: Subscription[] = [];

  constructor(private nameGenerator: ClusterNameGenerator, private api: ApiService, private wizardService: WizardService) { }

  ngOnInit() {
    this.clusterSpecForm = new FormGroup({
      name: new FormControl(this.cluster.name, [Validators.required, Validators.minLength(5)]),
      version: new FormControl(this.cluster.spec.version),
    });

    this.subscriptions.push(this.clusterSpecForm.valueChanges.subscribe(data => {
      this.wizardService.changeClusterSpec({
        name: this.clusterSpecForm.controls.name.value,
        version: this.clusterSpecForm.controls.version.value,
        valid: this.clusterSpecForm.valid,
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
    this.clusterSpecForm.patchValue({ name: this.nameGenerator.generateName() });
  }

  loadMasterVersions() {
    this.subscriptions.push(this.api.getMasterVersions().subscribe(versions => {
      this.masterVersions = versions;
      for (const i in versions) {
        if (versions[i].default) {
          this.defaultVersion = versions[i].version;
          this.clusterSpecForm.controls.version.setValue(versions[i].version);
        }
      }
    }));
  }

}
