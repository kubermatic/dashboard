import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { NodeCreateSpec } from 'app/shared/entity/NodeEntity';
import { Validators, FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { InputValidationService } from 'app/core/services';
import { CustomValidators } from 'ng2-validation';
import { NodeInstanceFlavors } from 'app/shared/model/NodeProviderConstants';
import { OpenstackNodeSpec } from 'app/shared/entity/node/OpenstackNodeSpec';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';

@Component({
  selector: 'kubermatic-openstack-add-node',
  templateUrl: './openstack-add-node.component.html',
  styleUrls: ['./openstack-add-node.component.scss']
})
export class OpenstackAddNodeComponent implements OnInit {
  @Output() public nodeSpecChanges: EventEmitter<{nodeSpec: NodeCreateSpec, count: number}> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();
  @Input() public connect: string[];

  public osNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.Openstack;

  constructor(private fb: FormBuilder, 
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    this.osNodeForm = this.fb.group({
      os_node_image: ['', [<any>Validators.required]],
      node_count: [1, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ['m1.medium', [<any>Validators.required]],
    });

    if (Array.isArray(this.connect) && this.connect.length) {
      const reduxStore = this.ngRedux.getState();
      const nodeForm = reduxStore.wizard.nodeForm;

      if (nodeForm) {
        const formValue = {
          os_node_image: nodeForm.os_node_image,
          node_count: nodeForm.node_count,
          node_size: nodeForm.node_size
        };
  
        this.osNodeForm.setValue(formValue);
      }
    }
  }

  public onChange() {
    const nodeSpec = new NodeCreateSpec(
      null,
      null,
      new OpenstackNodeSpec(
        this.osNodeForm.controls["node_size"].value,
        this.osNodeForm.controls["os_node_image"].value
      ),
      null
    );

    this.nodeSpecChanges.emit({
      nodeSpec,
      count: this.osNodeForm.controls["node_count"].value
    });

    this.formChanges.emit(this.osNodeForm);

    const createNodeModel = new CreateNodeModel(
      this.osNodeForm.controls["node_count"].value, 
      nodeSpec
    );
  }

}
