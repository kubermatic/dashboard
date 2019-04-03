import {ServiceAccountEntity} from '../../shared/entity/ServiceAccountEntity';

export function fakeServiceAccounts(): ServiceAccountEntity[] {
  return [
    {creationTimestamp: new Date(), id: '987zy6xv5u', name: 'test-service-account', status: 'Active', group: 'editors'},
    {
      creationTimestamp: new Date(),
      id: '765zy4xv3u',
      name: 'test-service-account-2',
      status: 'Active',
      group: 'viewers'
    },
  ];
}

export function fakeServiceAccount(): ServiceAccountEntity {
  return {
    creationTimestamp: new Date(),
    id: '987zy6xv5u',
    name: 'test-service-account',
    status: 'Active',
    group: 'editors'
  };
}
