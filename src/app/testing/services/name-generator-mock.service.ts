import {Injectable} from '@angular/core';

@Injectable()
export class ClusterNameGeneratorMock {
  generateName(): string {
    return 'generated-name';
  }
}
