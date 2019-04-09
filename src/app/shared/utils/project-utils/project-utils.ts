import {ProjectEntity} from '../../entity/ProjectEntity';

export class ProjectUtils {
  static getIconClass(project: ProjectEntity): string {
    if (project) {
      switch (project.status) {
        case 'Active':
          return 'fa fa-circle green';
        case 'Inactive':
          return 'fa fa-spin fa-circle-o-notch orange';
        case 'Terminating':
          return 'fa fa-circle-o red';
      }
    } else {
      return '';
    }
  }
}
