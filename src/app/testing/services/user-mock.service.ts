import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Member} from '../../shared/entity/Member';
import {GroupConfig} from '../../shared/model/Config';
import {fakeMember} from '../fake-data/member.fake';
import {fakeUserGroupConfig} from '../fake-data/userGroupConfig.fake';

@Injectable()
export class UserMockService {
  private user: Observable<Member>;

  get loggedInUser(): Observable<Member> {
    this.user = of(fakeMember());
    return this.user;
  }

  currentUserGroup(projectID: string): Observable<string> {
    return of(fakeMember().projects[0].group);
  }

  userGroupConfig(userGroup: string): GroupConfig {
    return fakeUserGroupConfig()[userGroup];
  }
}
