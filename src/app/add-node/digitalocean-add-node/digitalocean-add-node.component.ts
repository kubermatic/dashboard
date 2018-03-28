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

  @Input() public token = '';
  @Input() public connect: string[] = [];
  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();

  public doNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.VOID;
  private subscriptions: Subscription[] = [];
  public nodeSizeAvailable: boolean;

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  @select(['wizard', 'nodeForm']) nodeForm$: Observable<any>;
  public nodeForm: any;

  constructor(private fb: FormBuilder,
              private api: ApiService,
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    const subIsChecked = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(subIsChecked);

    const subNodeForm = this.nodeForm$.subscribe(nodeForm => {
      nodeForm && (this.nodeForm = nodeForm);
    });
    this.subscriptions.push(subNodeForm);

    this.doNodeForm = this.fb.group({
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ['', [<any>Validators.required]]
    });

    if (this.nodeForm) {
      const formValue = {
        node_count: this.nodeForm.node_count,
        node_size: this.nodeForm.node_size
      };
      this.doNodeForm.setValue(formValue);
    }

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
    this.getNodeSize(this.token);
  }

  public ngOnChanges(): void {
    this.getNodeSize(this.token);
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

    if (this.nodeForm) {
      const nodeSpec = new NodeCreateSpec(
        new NodeCloudSpec(
          new DigitaloceanNodeSpecV2(
            this.nodeForm.node_size,
            false,
            false,
            false,
            null
          ),
          null,
          null,
          null
        ),
        new OperatingSystemSpec(
          new UbuntuSpec(false),
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
    }
    this.formChanges.emit(this.doNodeForm);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
