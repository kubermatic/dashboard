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

  @Input() public connect: string[] = [];
  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();

  public awsNodeForm: FormGroup;
  public nodeSize: any[] = NodeInstanceFlavors.AWS;
  public nodeSpec: NodeCreateSpec;
  private subscriptions: Subscription[] = [];

  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;


  constructor(private formBuilder: FormBuilder,
              private ngRedux: NgRedux<any>,
              public inputValidationService: InputValidationService) { }

  ngOnInit() {
    const sub = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(sub);

    this.awsNodeForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, Validators.min(1)]],
      node_size: ['t2.medium', [<any>Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [''],
      aws_nas: [false]
    });

    if (Array.isArray(this.connect) && this.connect.length) {
      const reduxStore = this.ngRedux.getState();
      const nodeForm = reduxStore.wizard.nodeForm;

      if (nodeForm) {
        const formValue = {
          node_count: nodeForm.node_count,
          node_size: nodeForm.node_size,
          root_size: nodeForm.root_size,
          ami: nodeForm.ami,
          aws_nas: nodeForm.aws_nas
        };

        this.awsNodeForm.setValue(formValue);
      }
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

    const nodeInfo = this.ngRedux.getState().wizard.nodeForm;

    if (this.awsNodeForm.valid) {
      const nodeSpec = new NodeCreateSpec(
        new NodeCloudSpec(
          null,
          new AWSNodeSpecV2(
            nodeInfo.node_size,
            nodeInfo.root_size,
            'gp2',
            nodeInfo.ami,
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

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
