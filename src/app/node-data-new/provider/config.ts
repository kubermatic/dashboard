import {Type} from '@angular/core';

import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {MockStepComponent} from '../../wizard-new/step/mock/component';
import {AWSNodeDataComponent} from './aws/component';

export class NodeDataProviderConfig {
  private static readonly _providerConfig = {
    [NodeProvider.AWS]: AWSNodeDataComponent,
  };

  static GetComponent(provider: NodeProvider): Type<any> {
    const component = this._providerConfig[provider];
    return component ? component : MockStepComponent;
  }
}
