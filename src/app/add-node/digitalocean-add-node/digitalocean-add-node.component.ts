import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { NodeInstanceFlavors } from 'app/shared/model/NodeProviderConstants';
import { ApiService } from 'app/core/services/api/api.service';

import { Input, EventEmitter, Output, AfterContentInit, OnChanges, OnDestroy, OnInit, Component } from '@angular/core';
import { CustomValidators } from 'ng2-validation';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NodeCreateSpec, NodeCloudSpec, OperatingSystemSpec, NodeVersionInfo, UbuntuSpec, ContainerLinuxSpec, NodeContainerRuntimeInfo } from 'app/shared/entity/NodeEntity';
import { DigitaloceanNodeSpecV2 } from 'app/shared/entity/node/DigitialoceanNodeSpec';
import { InputValidationService } from 'app/core/services/input-validation/input-validation.service';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';


@Component({
  selector: 'kubermatic-digitalocean-add-node',
  templateUrl: './digitalocean-add-node.component.html',
  styleUrls: ['./digitalocean-add-node.component.scss']
})

export class DigitaloceanAddNodeComponent implements OnInit, AfterContentInit, OnChanges, OnDestroy {

  @Input() public token: string = '';
  @Input() public connect: string[] = [];
  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();

  public doNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.VOID;
  private subscriptions: Subscription[] = [];
  public nodeSizeAvailable: boolean;

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  constructor(private fb: FormBuilder,
              private api: ApiService,
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    const sub = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(sub);

    this.doNodeForm = this.fb.group({
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ['', [<any>Validators.required]]
    });

    if (Array.isArray(this.connect) && this.connect.length) {
      const reduxStore = this.ngRedux.getState();
      const nodeForm = reduxStore.wizard.nodeForm;

      if (nodeForm) {
        const formValue = {
          node_count: nodeForm.node_count,
          node_size: nodeForm.node_size
        };

        this.doNodeForm.setValue(formValue);
      }
    }

    this.getNodeSize(this.token);
    this.onChange();
  }

  public getNodeSize(token: string): void {
    const selectedNodeSize = null;

    if (token) {
      this.api.getDigitaloceanSizes(token).subscribe(result => {
        this.nodeSize = result;
        if (result.standard.length > 0 && result.optimized.length > 0 && this.doNodeForm.controls['node_size'].value === '') {
          const nodeSize = selectedNodeSize ? selectedNodeSize : 's-2vcpu-4gb';
          this.doNodeForm.patchValue({node_size: nodeSize});
          this.onChange();
        }

        if (result.standard.length > 0 && result.optimized.length > 0) {
          this.nodeSizeAvailable = true;
        } else if (result.standard.length === 0 && result.optimized.length === 0) {
          this.nodeSizeAvailable = false;
        }
      });
    }
  }

  public showRequiredFields() {
    if (this.doNodeForm.invalid) {
      for (const i in this.doNodeForm.controls) {
        if (this.doNodeForm.controls.hasOwnProperty(i)) {
          this.doNodeForm.get(i).markAsTouched();
        }
      }
    }
  }

  public ngAfterContentInit(): void {
    if (Array.isArray(this.connect) && this.connect.length) {
      this.getNodeSize(this.token);
    }
  }

  public ngOnChanges(): void {
    if (Array.isArray(this.connect) && this.connect.length) {
      this.getNodeSize(this.token);
    }
  }

  public onChange() {
    WizardActions.formChanged(
      ['wizard', 'nodeForm'],
      {
        node_size: this.doNodeForm.controls['node_size'].value,
        node_count: this.doNodeForm.controls['node_count'].value,
      },
      this.doNodeForm.valid
    );

    if (Array.isArray(this.connect) && this.connect.length) {
      const reduxStore = this.ngRedux.getState();
      const nodeInfo = reduxStore.wizard.nodeForm;

      if (nodeInfo) {
        const nodeSpec = new NodeCreateSpec(
          new NodeCloudSpec(
            new DigitaloceanNodeSpecV2(
              nodeInfo.node_size,
              false,
              false,
              false,
              null
            ),
            null,
            null
          ),
          new OperatingSystemSpec(
            new UbuntuSpec(true),
            null
          ),
          new NodeVersionInfo(
            '',
            new NodeContainerRuntimeInfo('', '')
          )
        );

        this.nodeSpecChanges.emit({
          nodeSpec
        });

        this.formChanges.emit(this.doNodeForm);

      }
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
