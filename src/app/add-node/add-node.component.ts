import { FormGroup } from '@angular/forms';
import { NodeCreateSpec } from 'app/shared/entity/NodeEntity';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { Provider } from 'app/shared/interfaces/provider.interface';

@Component({
  selector: 'kubermatic-add-node',
  templateUrl: './add-node.component.html',
  styleUrls: ['./add-node.component.scss']
})
export class AddNodeComponent implements OnInit {
  @Input() provider: Provider;
  @Input() connect: string[] = [];
  @Output() nodeModelChanges: EventEmitter<CreateNodeModel> = new EventEmitter();
  @Output() formChanges: EventEmitter<FormGroup> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

  public changeNodeModel(data: { nodeSpec: NodeCreateSpec }): void {
    const nodeModel = new CreateNodeModel(
      data.nodeSpec
    );

    this.nodeModelChanges.emit(nodeModel);
  }

  public changeForm(form: FormGroup) {
    this.formChanges.emit(form);
  }

}
