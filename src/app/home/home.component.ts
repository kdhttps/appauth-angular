import { Component, OnInit } from '@angular/core';
import {environment} from '../../environments/environment';
import {
  AuthorizationServiceConfigurationJson,
  AuthorizationServiceConfiguration,
  AuthorizationRequest, RedirectRequestHandler,
  FetchRequestor, LocalStorageBackend, DefaultCrypto
} from '@openid/appauth';
import {NoHashQueryStringUtils} from '../noHashQueryStringUtils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  configuration: AuthorizationServiceConfigurationJson = null;
  error: any = null;
  authorizationHandler: any = null;

  constructor() {
    this.authorizationHandler = new RedirectRequestHandler(
      new LocalStorageBackend(),
      new NoHashQueryStringUtils(),
      window.location,
      new DefaultCrypto()
    );
  }

  ngOnInit() {}

  redirect() {
    AuthorizationServiceConfiguration.fetchFromIssuer(environment.OPServer, new FetchRequestor())
      .then((response: any) => {
        this.configuration = response;
        const authRequest = new AuthorizationRequest({
          client_id: environment.clientId,
          redirect_uri: environment.redirectURL,
          scope: environment.scope,
          response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
          state: undefined,
          // extras: environment.extra
        });
        this.authorizationHandler.performAuthorizationRequest(this.configuration, authRequest);
      })
      .catch(error => {
        this.error = error;
      });
  }
}
