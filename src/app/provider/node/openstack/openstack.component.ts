import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NodeInstanceFlavors} from "../../../api/model/NodeProviderConstants";
import {CustomValidators} from "ng2-validation";

@Component({
  selector: 'kubermatic-node-openstack',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackNodeComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncNodeSpec = new EventEmitter();

  public nodeSize: any[] =  NodeInstanceFlavors.Openstack;
  public osNodeForm: FormGroup;

  ngOnInit() {
    this.osNodeForm = this.formBuilder.group({
      os_node_image: ["", [<any>Validators.required]],
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]],
    });
  }
}
