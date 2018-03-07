import { InputValidationService } from './../../core/services/input-validation/input-validation.service';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NodeCreateSpec, NodeCloudSpec, OperatingSystemSpec, UbuntuSpec, ContainerLinuxSpec, NodeVersionInfo, NodeContainerRuntimeInfo } from './../../shared/entity/NodeEntity';
import { NodeInstanceFlavors } from 'app/shared/model/NodeProviderConstants';
import { AWSNodeSpecV2 } from 'app/shared/entity/node/AWSNodeSpec';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { WizardActions } from '../../redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-aws-add-node',
  templateUrl: './aws-add-node.component.html',
  styleUrls: ['./aws-add-node.component.scss']
})
export class AwsAddNodeComponent implements OnInit, OnDestroy {

  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();

  public awsNodeForm: FormGroup;
  public nodeSize: any[] = NodeInstanceFlavors.AWS;
  public nodeSpec: NodeCreateSpec;
  private subscriptions: Subscription[] = [];

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;

  @select(['wizard', 'nodeForm']) nodeForm$: Observable<any>;
  public nodeForm: any;

  constructor(private formBuilder: FormBuilder,
              private ngRedux: NgRedux<any>,
              public inputValidationService: InputValidationService) { }

  ngOnInit() {
    const subIsChecked = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(subIsChecked);

    const subNodeForm = this.nodeForm$.subscribe(nodeForm => {
      nodeForm && (this.nodeForm = nodeForm);
    });
    this.subscriptions.push(subNodeForm);

    this.awsNodeForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, Validators.min(1)]],
      node_size: ['t2.medium', [<any>Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [''],
      aws_nas: [false]
    });

    if (this.nodeForm) {
      const formValue = {
        node_count: this.nodeForm.node_count,
        node_size: this.nodeForm.node_size,
        root_size: this.nodeForm.root_size,
        ami: this.nodeForm.ami,
        aws_nas: this.nodeForm.aws_nas
      };

      this.awsNodeForm.setValue(formValue);
    }

    this.onChange();
  }

  public showRequiredFields() {
    if (this.awsNodeForm.invalid) {
      for (const i in this.awsNodeForm.controls) {
        if (this.awsNodeForm.controls.hasOwnProperty(i)) {
          this.awsNodeForm.get(i).markAsTouched();
        }
      }
    }
  }

  public onChange() {

    WizardActions.formChanged(
      ['wizard', 'nodeForm'],
      {
        node_size: this.awsNodeForm.controls['node_size'].value,
        root_size: this.awsNodeForm.controls['root_size'].value,
        node_count: this.awsNodeForm.controls['node_count'].value,
        ami: this.awsNodeForm.controls['ami'].value,
        aws_nas: this.awsNodeForm.controls['aws_nas'].value
       },
      this.awsNodeForm.valid
    );

    if (this.nodeForm) {
      if (this.awsNodeForm.valid) {
        const nodeSpec = new NodeCreateSpec(
          new NodeCloudSpec(
            null,
            new AWSNodeSpecV2(
              this.nodeForm.node_size,
              this.nodeForm.root_size,
              'gp2',
              this.nodeForm.ami,
              null
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

        this.nodeSpecChanges.emit({
          nodeSpec
        });
      }
      this.formChanges.emit(this.awsNodeForm);
    }
  }


  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
