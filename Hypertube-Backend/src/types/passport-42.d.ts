declare module 'passport-42' {
  import { Request } from 'express';
  
  export interface Profile {
    id: string;
    login: string;
    email: string;
    first_name: string;
    last_name: string;
    displayName: string;
    image_url: string;
    provider: string;
    _raw: string;
    _json: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void
  ) => void;

  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyFunction
    );

    authenticate(req: Request, options?: any): void;
  }
}