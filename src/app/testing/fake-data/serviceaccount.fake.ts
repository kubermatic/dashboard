import {ServiceAccountEntity, ServiceAccountTokenEntity} from '../../shared/entity/ServiceAccountEntity';

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

export function fakeServiceAccountTokens(): ServiceAccountTokenEntity[] {
  return [
    {
      creationTimestamp: new Date(),
      id: 'sa-token-987zy6xv5u',
      name: 'test-service-account-token',
      token: 'secret-test-token'
    },
    {
      creationTimestamp: new Date(),
      id: '765zy4xv3u',
      name: 'test-service-account-token-2',
      token: 'secret-test-token-2'
    },
  ];
}

export function fakeServiceAccountToken(): ServiceAccountTokenEntity {
  return {
    creationTimestamp: new Date(),
    id: 'sa-token-987zy6xv5u',
    name: 'test-service-account-token',
    token: 'secret-test-token'
  };
}
