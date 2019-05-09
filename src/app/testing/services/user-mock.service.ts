import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {MemberEntity} from '../../shared/entity/MemberEntity';
import {fakeMember} from '../fake-data/member.fake';

@Injectable()
export class UserMockService {
  private user: Observable<MemberEntity>;

  getUser(): Observable<MemberEntity> {
    this.user = of(fakeMember());
    return this.user;
  }

  currentUserGroup(projectID: string): Observable<string> {
    return of(fakeMember().projects[0].group);
  }
}
