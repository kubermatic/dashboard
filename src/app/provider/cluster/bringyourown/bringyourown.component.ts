import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {BringYourOwnCloudSpec} from "../../../api/entitiy/cloud/BringYourOwnCloudSpec";



@Component({
  selector: 'kubermatic-cluster-bringyourown',
  templateUrl: './bringyourown.component.html',
  styleUrls: ['./bringyourown.component.scss']
})
export class BringyourownClusterComponent implements OnInit {

  @Input() cloud: BringYourOwnCloudSpec;
  @Output() syncProviderCloudSpec = new EventEmitter();
  @Output() syncProviderCloudSpecValid = new EventEmitter();

  ngOnInit() {
    this.syncProviderCloudSpec.emit(this.cloud);
    this.syncProviderCloudSpecValid.emit(true);
  }


}
