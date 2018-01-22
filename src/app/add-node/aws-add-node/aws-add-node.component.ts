import { InputValidationService } from './../../core/services/input-validation/input-validation.service';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NodeCreateSpec } from './../../shared/entity/NodeEntity';
import { NodeInstanceFlavors } from 'app/shared/model/NodeProviderConstants';
import { AWSNodeSpec } from 'app/shared/entity/node/AWSNodeSpec';

@Component({
  selector: 'kubermatic-aws-add-node',
  templateUrl: './aws-add-node.component.html',
  styleUrls: ['./aws-add-node.component.scss']
})
export class AwsAddNodeComponent implements OnInit {

  @Input() public connect: string[] = [];
  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec, count: number}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();

  public awsNodeForm: FormGroup;
  public nodeSize: any[] = NodeInstanceFlavors.AWS;
  public nodeSpec: NodeCreateSpec;

  constructor(private fb: FormBuilder,
              private ngRedux: NgRedux<any>,
              public inputValidationService: InputValidationService) { }

  ngOnInit() {
    this.awsNodeForm = this.fb.group({
      node_count: [1, [<any>Validators.required, Validators.min(1)]],
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
      } else {
        this.awsNodeForm.patchValue({node_count: 3});
      }
    }

    this.onChange();
  }

  public onChange() {
    const nodeSpec = new NodeCreateSpec(
      null,
      new AWSNodeSpec(
        this.awsNodeForm.controls['node_size'].value,
        this.awsNodeForm.controls['root_size'].value,
        // Can we implement at some point
        // this.awsForm.controls["volume_type"].value,
        'gp2',
        this.awsNodeForm.controls['ami'].value
      ),
      null,
      null
    );

    this.nodeSpecChanges.emit({
      nodeSpec,
      count: this.awsNodeForm.controls['node_count'].value
    });

    this.formChanges.emit(this.awsNodeForm);
  }

}
