import { MemberEntity } from '../../shared/entity/MemberEntity';

export function fakeMembers(): MemberEntity[] {
  return [
    {
      creationTimestamp: new Date(),
      id: '123456',
      name: 'John Doe',
      email: 'john.doe@example.com',
      projects: [
        {
          group: 'owners',
          id: '123ab4cd5e'
        }
      ]
    },
    {
      creationTimestamp: new Date(),
      id: '345678',
      name: 'John Doe Jr',
      email: 'john.doe.jr@example.com',
      projects: [
        {
          group: 'editors',
          id: '123ab4cd5e'
        }
      ]
    },
    {
      creationTimestamp: new Date(),
      id: '567890',
      name: 'John Doe Sr',
      email: 'john.doe.sr@example.com',
      projects: [
        {
          group: 'viewers',
          id: '123ab4cd5e'
        }
      ]
    }
  ];
}

export function fakeMember(): MemberEntity {
  return {
    creationTimestamp: new Date(),
    id: '123456',
    name: 'John Doe',
    email: 'john.doe@example.com',
    projects: [
      {
        group: 'owners',
        id: '123ab4cd5e'
      }
    ]
  };
}
