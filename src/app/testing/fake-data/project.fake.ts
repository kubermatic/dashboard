import {ProjectEntity} from '../../shared/entity/ProjectEntity';

export function fakeProjects(): ProjectEntity[] {
  return [
    {
      creationTimestamp: new Date(),
      id: '123ab4cd5e',
      name: 'new-project-1',
      status: 'Active',
      owners: [
        {
          creationTimestamp: new Date(),
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      ],
    },
    {
      creationTimestamp: new Date(),
      id: '234ab5cd6e',
      name: 'new-project-2',
      status: 'Active',
      owners: [
        {
          creationTimestamp: new Date(),
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        {
          creationTimestamp: new Date(),
          name: 'John Doe Junior',
          email: 'johndoejunior@example.com',
        },
      ],
    },
  ];
}

export function fakeProject(): ProjectEntity {
  return {
    creationTimestamp: new Date(),
    id: '123ab4cd5e',
    name: 'new-project-1',
    status: 'Active',
    owners: [
      {
        creationTimestamp: new Date(),
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    ],
  };
}

export function fakeInactiveProject(): ProjectEntity {
  return {
    creationTimestamp: new Date(),
    id: '345ab6cd7e',
    name: 'new-project-3',
    status: 'Inactive',
    owners: [
      {
        creationTimestamp: new Date(),
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    ],
  };
}
