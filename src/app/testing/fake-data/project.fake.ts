import { ProjectEntity } from '../../shared/entity/ProjectEntity';

export function fakeProjects(): ProjectEntity[] {
  return [
    {
      creationTimestamp: new Date(),
      id: '123ab4cd5e',
      name: 'new-project-1',
      status: 'Active',
    },
    {
      creationTimestamp: new Date(),
      id: '234ab5cd6e',
      name: 'new-project-2',
      status: 'Active',
    },
  ];
}

export function fakeProject(): ProjectEntity {
  return {
    creationTimestamp: new Date(),
    id: '123ab4cd5e',
    name: 'new-project-1',
    status: 'Active',
  };
}
