import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MemberEntity } from '../../../shared/entity/MemberEntity';
import { Auth } from '../auth/auth.service';
import { environment } from './../../../../environments/environment';

@Injectable()
export class UserService {
  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  public user: Observable<MemberEntity>;
  public userGroup: string;

  constructor(private http: HttpClient,
              private auth: Auth) {
    const token = this.auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + token);
  }

  getUser(): Observable<MemberEntity> {
    const url = `${this.restRoot}/me`;
    if (!this.user) {
      this.user = this.http.get<MemberEntity>(url, { headers: this.headers }).pipe(catchError((error) => {
        return of<MemberEntity>();
      }));
    }
    return this.user;
  }

  currentUserGroup(projectID: string): Observable<string> {
    return this.getUser().pipe(map((res) => {
      for (const project of res.projects) {
        if (project.id === projectID) {
          const group = project.group.split('-')[0];
          return this.userGroup = group;
        }
      }
      return this.userGroup = '';
    }));
  }

}
