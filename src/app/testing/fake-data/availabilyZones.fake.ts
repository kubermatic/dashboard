import {AWSAvailabilityZone} from '../../shared/entity/provider/aws/AWS';

export function fakeAwsZones(): AWSAvailabilityZone[] {
  return [{'name': 'eu-central-1a'}, {'name': 'eu-central-1b'}, {'name': 'eu-central-1c'}];
}
