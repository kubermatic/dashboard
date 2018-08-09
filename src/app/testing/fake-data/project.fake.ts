import { ProjectEntity } from '../../shared/entity/ProjectEntity';

export const fakeProjects: ProjectEntity[] = [
  {
    creationTimestamp: '2018-07-19T08:46:54Z',
    id: '123ab4cd5e',
    name: 'new-project-1',
    status: 'Active',
  },
  {
    creationTimestamp: '2018-07-19T09:46:54Z',
    id: '234ab5cd6e',
    name: 'new-project-2',
    status: 'Active',
  }
];

export const fakeProject: ProjectEntity = {
  creationTimestamp: '2018-07-19T08:46:54Z',
  id: '123ab4cd5e',
  name: 'new-project-1',
  status: 'Active',
};
