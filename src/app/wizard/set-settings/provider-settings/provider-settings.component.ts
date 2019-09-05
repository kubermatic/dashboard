import {Component, Input, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-cluster-provider-settings',
  templateUrl: './provider-settings.component.html',
})
export class ClusterProviderSettingsComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];
  hideOptional = true;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });
  }

  isInWizard(): boolean {
    return !this.cluster.id || this.cluster.id === '';
  }
}
