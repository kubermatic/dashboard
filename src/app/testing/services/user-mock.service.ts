import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ProjectEntity } from './../../shared/entity/ProjectEntity';
import { MemberEntity } from '../../shared/entity/MemberEntity';
import { fakeProject, fakeProjects } from './../fake-data/project.fake';
import { fakeMember } from './../fake-data/member.fake';

@Injectable()
export class UserMockService {
  public member = fakeMember();

  private user: Observable<MemberEntity>;

   // User group
  private _currentUserGroup = new Subject<string>();
  userGroupChanges$ = this._currentUserGroup.asObservable();
  private userGroup: string;

  constructor() {
  }

  public getUser(): Observable<MemberEntity> {
    this.user = Observable.of(fakeMember());
    return this.user;
  }

  changeCurrentUserGroup(projectID: string) {
    return this.userGroup = 'owner';
  }
}
