import {Component, OnInit} from '@angular/core';
import {
  TokenRequest,
  BaseTokenRequestHandler,
  GRANT_TYPE_AUTHORIZATION_CODE,
  AuthorizationServiceConfiguration,
  AuthorizationServiceConfigurationJson,
  RedirectRequestHandler,
  AuthorizationNotifier,
  FetchRequestor, LocalStorageBackend, DefaultCrypto
} from '@openid/appauth';
import {environment} from '../../environments/environment';
import {NoHashQueryStringUtils} from '../noHashQueryStringUtils';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {
  code: string;
  tokenHandler: any = null;
  configuration: AuthorizationServiceConfigurationJson;
  error: any = null;
  notifier: any = null;
  request: any = null;
  response: any = null;
  authorizationHandler: any = null;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.tokenHandler = new BaseTokenRequestHandler(new FetchRequestor());
    this.authorizationHandler = new RedirectRequestHandler(
      new LocalStorageBackend(),
      new NoHashQueryStringUtils(),
      window.location,
      new DefaultCrypto()
    );
    this.notifier = new AuthorizationNotifier();
    this.authorizationHandler.setAuthorizationNotifier(this.notifier);
    this.notifier.setAuthorizationListener((request, response, error) => {
      console.log('Authorization request complete ', request, response, error);
      if (response) {
        this.request = request;
        this.response = response;
        this.code = response.code;
        console.log(`Authorization Code  ${response.code}`);

        let extras = null;
        if (this.request && this.request.internal) {
          extras = {};
          extras.code_verifier = this.request.internal.code_verifier;
        }

        const tokenRequest = new TokenRequest({
          client_id: environment.clientId,
          redirect_uri: environment.redirectURL,
          grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
          code: this.code,
          refresh_token: undefined,
          extras
        });

        AuthorizationServiceConfiguration.fetchFromIssuer(environment.OPServer, new FetchRequestor())
          .then((oResponse: any) => {
            this.configuration = oResponse;
            return this.tokenHandler.performTokenRequest(this.configuration, tokenRequest);
          })
          .then((oResponse) => {
            localStorage.setItem('access_token', oResponse.accessToken);
            this.router.navigate(['/profile']);
          })
          .catch(oError => {
            this.error = oError;
          });
      }
    });
  }

  ngOnInit() {
    this.code = this.route.snapshot.queryParams.code;

    if (!this.code) {
      this.error = 'Unable to get authorization code';
      return;
    }
    this.authorizationHandler.completeAuthorizationRequestIfPossible();
  }
}
