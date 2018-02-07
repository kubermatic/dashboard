import {Injectable} from '@angular/core';

@Injectable()
export class ClusterNameGeneratorMock {

  public generateName(): string {
      return 'generated-name';
  }

}
