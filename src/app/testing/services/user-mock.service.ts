import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {MemberEntity} from '../../shared/entity/MemberEntity';
import {GroupConfig} from '../../shared/model/Config';
import {fakeMember} from '../fake-data/member.fake';
import {fakeUserGroupConfig} from '../fake-data/userGroupConfig.fake';

@Injectable()
export class UserMockService {
  private user: Observable<MemberEntity>;

  get loggedInUser(): Observable<MemberEntity> {
    this.user = of(fakeMember());
    return this.user;
  }

  getCurrentUserGroup(projectID: string): Observable<string> {
    return of(fakeMember().projects[0].group);
  }

  getUserGroupConfig(userGroup: string): GroupConfig {
    return fakeUserGroupConfig()[userGroup];
  }
}
