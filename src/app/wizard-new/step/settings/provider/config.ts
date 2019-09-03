import {Type} from '@angular/core';

import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {MockStepComponent} from '../../mock/component';

import {AWSProviderComponent} from './aws/component';

export class ProviderConfig {
  private static readonly _providerConfig = {
    [NodeProvider.AWS]: AWSProviderComponent,
  };

  static GetComponent(provider: NodeProvider): Type<any> {
    const component = this._providerConfig[provider];
    return component ? component : MockStepComponent;
  }
}
