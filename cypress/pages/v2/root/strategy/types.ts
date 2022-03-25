export interface LoginStrategy {
  login(email: string, password: string, isAdmin: boolean): void;
  logout(): void;
}
