import { FormGroup } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NodeEntity, NodeSpec } from '../shared/entity/NodeEntity';
import { Provider } from '../shared/interfaces/provider.interface';

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})

export class AddNodeComponent implements OnInit {
  @Input() provider: Provider;
  @Input() connect: string[] = [];
  @Output() nodeChanges: EventEmitter<NodeEntity> = new EventEmitter();
  @Output() formChanges: EventEmitter<FormGroup> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

  public changeNodeModel(nodeSpec: NodeSpec): void {
    this.nodeChanges.emit({
      metadata: {},
      spec: nodeSpec
    });
  }

  public changeForm(form: FormGroup) {
    this.formChanges.emit(form);
  }

}
