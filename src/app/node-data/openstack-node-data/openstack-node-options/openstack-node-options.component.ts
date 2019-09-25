import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../../shared/entity/ClusterEntity';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-openstack-node-options',
  templateUrl: './openstack-node-options.component.html',
  styleUrls: ['./openstack-node-options.component.scss'],
})

export class OpenstackNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() cloudSpec: CloudSpec;
  @Input() isInWizard: boolean;

  hideOptional = true;
  form: FormGroup;
  tags: FormArray;
  private _unsubscribe = new Subject<void>();

  constructor(private addNodeService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    const tagList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.openstack.tags) {
      if (this.nodeData.spec.cloud.openstack.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.openstack.tags[i]),
        }));
      }
    }

    if (tagList.length === 0) {
      tagList.push(new FormGroup({
        key: new FormControl(''),
        value: new FormControl(''),
      }));
    }

    this.form = new FormGroup({
      tags: tagList,
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getOsOptionsData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTagForm(form): any {
    return form.get('tags').controls;
  }

  addTag(): void {
    this.tags = this.form.get('tags') as FormArray;
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = this.form.get('tags') as FormArray;
    arrayControl.removeAt(index);
  }

  getOsOptionsData(): NodeProviderData {
    const tagMap = {};
    for (const i in this.form.controls.tags.value) {
      if (this.form.controls.tags.value[i].key !== '' && this.form.controls.tags.value[i].value !== '') {
        tagMap[this.form.controls.tags.value[i].key] = this.form.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        openstack: {
          flavor: this.nodeData.spec.cloud.openstack.flavor,
          image: this.nodeData.spec.cloud.openstack.image,
          useFloatingIP: this.nodeData.spec.cloud.openstack.useFloatingIP,
          diskSize: this.nodeData.spec.cloud.openstack.diskSize,
          tags: tagMap,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
