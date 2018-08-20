import { MemberEntity } from '../../shared/entity/MemberEntity';

export const fakeMembers: MemberEntity[] = [
  {
    creationTimestamp: new Date(),
    id: '123456',
    name: 'John Doe',
    email: 'john.doe@example.com',
    projects: [
      {
        group: 'admin',
        id: '123ab4cd5e'
      }
    ]
  },
  {
    creationTimestamp: new Date(),
    id: '123456',
    name: 'John Doe Jr',
    email: 'john.doe.jr@example.com',
    projects: [
      {
        group: 'admin',
        id: '123ab4cd5e'
      }
    ]
  }
];

export const fakeMember: MemberEntity = {
  creationTimestamp: new Date(),
    id: '123456',
    name: 'John Doe',
    email: 'john.doe@example.com',
    projects: [
      {
        group: 'admin',
        id: '123ab4cd5e'
      }
    ]
};
