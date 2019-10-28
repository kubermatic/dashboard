import {AWSSize} from '../../shared/entity/provider/aws/AWS';

export function fakeAwsSize(): AWSSize[] {
  return [
    {'name': 'c5d.xlarge', 'pretty_name': 'C5 High-CPU Extra Large', 'memory': 8, 'vcpus': 4, 'price': 0.222},
    {'name': 'm5a.2xlarge', 'pretty_name': 'M5A Double Extra Large', 'memory': 32, 'vcpus': 8, 'price': 0.416},
    {'name': 'c5.large', 'pretty_name': 'C5 High-CPU Large', 'memory': 4, 'vcpus': 2, 'price': 0.097},
    {'name': 'c5n.large', 'pretty_name': 'C5N Large', 'memory': 5.25, 'vcpus': 2, 'price': 0.123}
  ];
}
