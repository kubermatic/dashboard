import {AWSSubnet} from '../../shared/entity/provider/aws/AWS';

export function fakeAwsSubnets(): AWSSubnet[] {
  return [
    {
      'name': '',
      'id': 'subnet-2bff4f43',
      'availability_zone': 'eu-central-1a',
      'availability_zone_id': 'euc1-az2',
      'ipv4cidr': '172.31.0.0/20',
      'ipv6cidr': '',
      'tags': [
        {'key': 'kubernetes.io/cluster/m4q97kxmsw', 'value': ''},
        {'key': 'kubernetes.io/cluster/wpkzz5l8zx', 'value': ''},
        {'key': 'kubernetes.io/cluster/6cjxnw7k8v', 'value': ''},
      ],
      'state': 'available',
      'available_ip_address_count': 4084,
      'default': true
    },
    {
      'name': '',
      'id': 'subnet-3cee5e54',
      'availability_zone': 'eu-central-1a',
      'availability_zone_id': 'euc1-az2',
      'ipv4cidr': '172.31.0.0/20',
      'ipv6cidr': '',
      'tags': [
        {'key': 'kubernetes.io/cluster/m4q97kxmsw', 'value': ''},
      ],
      'state': 'available',
      'available_ip_address_count': 4084,
      'default': true
    },
    {
      'name': '',
      'id': 'subnet-f3427db9',
      'availability_zone': 'eu-central-1c',
      'availability_zone_id': 'euc1-az1',
      'ipv4cidr': '172.31.32.0/20',
      'ipv6cidr': '',
      'tags': [
        {'key': 'kubernetes.io/cluster/9gx49bqcg5', 'value': ''},
      ],
      'state': 'available',
      'available_ip_address_count': 4090,
      'default': true
    },
    {
      'name': '',
      'id': 'subnet-06d1167c',
      'availability_zone': 'eu-central-1b',
      'availability_zone_id': 'euc1-az3',
      'ipv4cidr': '172.31.16.0/20',
      'ipv6cidr': '',
      'tags': [
        {'key': 'kubernetes.io/cluster/6tq9t4f2rs', 'value': ''},
        {'key': 'kubernetes.io/cluster/rtx6mhq77x', 'value': ''},
      ],
      'state': 'available',
      'available_ip_address_count': 4090,
      'default': true
    }
  ];
}
