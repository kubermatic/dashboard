import { Observable } from 'rxjs/Rx';
import { select } from '@angular-redux/store';
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {CreateNodeModel} from "../../../shared/model/CreateNodeModel";

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class ProviderNodeComponent implements OnInit {

  @Input() token: string;

  @Output() syncNodeModel = new EventEmitter();

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  constructor() { }

  ngOnInit() { 
    this.provider$.subscribe(provider => {
      provider && (this.provider = provider);
    });
  }
}
