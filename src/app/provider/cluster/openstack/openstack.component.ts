import {Component, OnInit, EventEmitter, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {OpenstackCloudSpec} from "../../../api/entitiy/cloud/OpenstackCloudSpec";

@Component({
  selector: 'kubermatic-cluster-openstack',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackClusterComponent implements OnInit {
  public osClusterForm: FormGroup;
  public cloudSpec: OpenstackCloudSpec;

  constructor(private formBuilder: FormBuilder) { }

  @Output() syncCloudSpec = new EventEmitter();

  ngOnInit() {
    this.osClusterForm = this.formBuilder.group({
      os_tenant: ["", [<any>Validators.required]],
      os_domain: ["", [<any>Validators.required]],
      os_username: ["", [<any>Validators.required]],
      os_password: ["", [<any>Validators.required]],
      os_network: ["", [<any>Validators.required]],
      os_security_groups: ["", [<any>Validators.required]],
      os_floating_ip_pool: ["", [<any>Validators.required]],
    });
  }

  public onChange (){
    this.cloudSpec = new OpenstackCloudSpec(
      this.osClusterForm.controls["os_username"].value,
      this.osClusterForm.controls["os_password"].value,
      this.osClusterForm.controls["os_tenant"].value,
      this.osClusterForm.controls["os_domain"].value,
      this.osClusterForm.controls["os_network"].value,
      this.osClusterForm.controls["os_security_groups"].value,
      this.osClusterForm.controls["os_floating_ip_pool"].value,
    )

    if (this.osClusterForm.valid){
      this.syncCloudSpec.emit(this.cloudSpec);
    }
  }
}
