import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { NodeData, NodeProviderData, NodeOperatingSystemData } from '../../../shared/model/NodeSpecChange';

@Injectable()
export class AddNodeService {

  private _nodeProviderData = new Subject<NodeProviderData>();
  nodeProviderDataChanges$ = this._nodeProviderData.asObservable();
  private _nodeData = new Subject<NodeData>();
  nodeDataChanges$ = this._nodeData.asObservable();

  private _nodeOperatingSystemData = new Subject<NodeOperatingSystemData>();
  nodeOperatingSystemDataChanges$ = this._nodeOperatingSystemData.asObservable();

  changeNodeProviderData(data: NodeProviderData) {
    this._nodeProviderData.next(data);
  }

  changeNodeData(data: NodeData) {
    this._nodeData.next(data);
  }

  changeNodeOperatingSystemData(data: NodeOperatingSystemData) {
    this._nodeOperatingSystemData.next(data);
  }
}
