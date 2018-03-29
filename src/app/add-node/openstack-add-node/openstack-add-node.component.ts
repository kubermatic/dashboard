import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { CustomValidators } from 'ng2-validation';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { WizardActions } from '../../redux/actions/wizard.actions';

import {
  NodeCloudSpec,
  NodeContainerRuntimeInfo,
  NodeSpec,
  NodeVersionInfo,
  OperatingSystemSpec,
  UbuntuSpec
} from '../../shared/entity/NodeEntity';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';
import { InputValidationService } from '../../core/services';
import { OpenstackNodeSpec } from '../../shared/entity/node/OpenstackNodeSpec';
import { ApiService } from '../../core/services/api/api.service';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { OpenstackSize } from '../../shared/entity/provider/OpenstackSizeEntity';

@Component({
  selector: 'kubermatic-openstack-add-node',
  templateUrl: './openstack-add-node.component.html',
  styleUrls: ['./openstack-add-node.component.scss']
})

export class OpenstackAddNodeComponent implements OnInit, OnChanges, OnDestroy {

  @Output() public nodeSpecChanges: EventEmitter<NodeSpec> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();
  @Input() cloudSpec: CloudSpec;

  public osNodeForm: FormGroup;

  public nodeSize: OpenstackSize[] = [];
  public nodeSizeSorted: OpenstackSize[] = [];  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;
  @select(['wizard', 'nodeForm']) nodeForm$: Observable<any>;
  public nodeForm: any;
  private subscriptions: Subscription[] = [];

  constructor(private fb: FormBuilder,
              public inputValidationService: InputValidationService,

              private ngRedux: NgRedux<any>,
              private api: ApiService) { }

  ngOnInit() {
    const subIsChecked = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(subIsChecked);

    const subNodeForm = this.nodeForm$.subscribe(nodeForm => {
      nodeForm && (this.nodeForm = nodeForm);
    });
    this.subscriptions.push(subNodeForm);

    this.osNodeForm = this.fb.group({
      os_node_image: ['', [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ['m1.medium', [<any>Validators.required]],
    });

    if (this.nodeForm) {
      const formValue = {
        os_node_image: this.nodeForm.os_node_image,
        node_count: this.nodeForm.node_count,
        node_size: this.nodeForm.node_size
      };

      this.osNodeForm.setValue(formValue);
    }

    this.onChange();
  }

  public showRequiredFields() {
    if (this.osNodeForm.invalid) {
      for (const i in this.osNodeForm.controls) {
        if (this.osNodeForm.controls.hasOwnProperty(i)) {
          this.osNodeForm.get(i).markAsTouched();
        }
      }
    }
  }

  public getNodeSizes() {
    const selectedNodeSize = null;
    return this.api.getOpenStackSizes(this.cloudSpec.openstack.username, this.cloudSpec.openstack.password, this.cloudSpec.openstack.tenant, this.cloudSpec.openstack.domain, this.cloudSpec.dc).subscribe(res => {
      this.nodeSize = res;

      const data = this.nodeSize ? this.nodeSize.slice() : [];
      this.nodeSizeSorted = data.sort((a, b) => {
        return (a.memory < b.memory ? -1 : 1) * ('asc' ? 1 : -1);
      });

      if (res.length > 0 && this.osNodeForm.controls['node_size'].value === '') {
        const nodeSizeSorted = selectedNodeSize ? selectedNodeSize : 'm1.medium';
        this.osNodeForm.patchValue({node_size: nodeSizeSorted});
        this.onChange();
      }
    });
  }

  public ngOnChanges(): void {
    if (!!this.cloudSpec.openstack.username && !!this.cloudSpec.openstack.password && !!this.cloudSpec.openstack.tenant && !!this.cloudSpec.openstack.domain && !!this.cloudSpec.dc) {
      this.getNodeSizes();
    }
  }

  public onChange() {
    WizardActions.formChanged(
      ['wizard', 'nodeForm'],
      {
        os_node_image: this.osNodeForm.controls['os_node_image'].value,
        node_count: this.osNodeForm.controls['node_count'].value,
        node_size: this.osNodeForm.controls['node_size'].value,
      },
      this.osNodeForm.valid
    );

    if (this.nodeForm) {

      const nodeSpec = new NodeSpec(
        new NodeCloudSpec(
          null,
          null,
          new OpenstackNodeSpec(
            this.nodeForm.node_size,
            this.nodeForm.os_node_image
          ),
          null
        ),
        new OperatingSystemSpec(
          new UbuntuSpec(false),
          null
        ),
        new NodeVersionInfo(
          null,
          new NodeContainerRuntimeInfo(null, null)
        )
      );


      this.nodeSpecChanges.emit(nodeSpec);
      this.formChanges.emit(this.osNodeForm);
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
