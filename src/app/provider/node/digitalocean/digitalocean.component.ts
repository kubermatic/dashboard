import {Component, OnInit, EventEmitter, Output, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {ApiService} from "../../../api/api.service";
import {NodeInstanceFlavors} from "../../../api/model/NodeProviderConstants";

@Component({
  selector: 'kubermatic-node-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanNodeComponent implements OnInit {

  constructor(private formBuilder: FormBuilder,private api: ApiService) { }

  @Input() doToken: string;

  @Output() syncNodeSpec = new EventEmitter();

  //public nodeSize: any[] =  NodeInstanceFlavors.VOID;
  public doNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.VOID;

  ngOnInit() {
    this.api.getDigitaloceanSizes(this.doToken).subscribe(result => {
        this.nodeSize = result.sizes;
      }
    );

    this.doNodeForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ["", [<any>Validators.required]]

    });
  }

}
