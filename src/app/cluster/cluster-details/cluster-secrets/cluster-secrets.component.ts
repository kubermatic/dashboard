import { Component,  OnInit, Input, Inject} from '@angular/core';
import {Health, Status} from '../../../shared/entity/ClusterEntity';


@Component({
  selector: 'kubermatic-cluster-secrets',
  templateUrl: './cluster-secrets.component.html',
  styleUrls: ['./cluster-secrets.component.scss']
})
export class ClusterSecretsComponent implements OnInit {
  @Input() health: Health;
  @Input() status: Status;
  expand = false;

  constructor() { }

  ngOnInit() {  }

  public expandPanel(): void {
    if (this.expand === false) {
      this.expand = true;
    } else {
      this.expand = false;
    }
  }
}
