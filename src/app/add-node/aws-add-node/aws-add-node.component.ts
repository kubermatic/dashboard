import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { NodeProviderData } from '../../shared/model/NodeSpecChange';
import { CloudSpec } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-aws-add-node',
  templateUrl: './aws-add-node.component.html',
  styleUrls: ['./aws-add-node.component.scss']
})
export class AwsAddNodeComponent implements OnInit, OnDestroy {
  @Input() public cloudSpec: CloudSpec;
  public instanceTypes: string[] = NodeInstanceFlavors.AWS;
  public diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  public awsNodeForm: FormGroup = new FormGroup({
    type: new FormControl('t2.small', Validators.required),
    disk_size: new FormControl(25, Validators.required),
    disk_type: new FormControl('standard', Validators.required),
    ami: new FormControl(''),
  });
  private formOnChangeSub: Subscription;

  constructor(private addNodeService: AddNodeService) {
  }

  ngOnInit(): void {
    this.formOnChangeSub = this.awsNodeForm.valueChanges.subscribe(data => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        aws: {
          instanceType: this.awsNodeForm.controls.type.value,
          diskSize: this.awsNodeForm.controls.disk_size.value,
          ami: this.awsNodeForm.controls.ami.value,
          tags: new Map<string, string>(),
          volumeType: this.awsNodeForm.controls.disk_type.value,
        },
      },
      valid: this.awsNodeForm.valid,
    };
  }

  ngOnDestroy(): void {
    this.formOnChangeSub.unsubscribe();
  }
}
