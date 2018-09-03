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
}

export function fakeMember(): MemberEntity {
  return {
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
}
