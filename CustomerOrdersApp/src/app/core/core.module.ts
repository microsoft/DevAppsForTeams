import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { GrowlerModule } from './growler/growler.module';
import { ModalModule } from './modal/modal.module';
import { OverlayModule } from './overlay/overlay.module';

import { NavbarComponent } from './navbar/navbar.component';
import { EnsureModuleLoadedOnceGuard } from './ensure-module-loaded-once.guard';
import { MsalModule, MsalInterceptor } from '@azure/msal-angular';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;
// Note that this won't work on mobile (iOS anyway) when in Teams
const isIFrame = window.self !== window.top;
// Check if we're running in Teams on mobile
const teamsMobile = navigator.userAgent.toLowerCase().includes('teamsmobile');

// If running in Teams don't include the MSAL interceptor
const msalProviders = (!isIFrame && !teamsMobile) ? {
  provide: HTTP_INTERCEPTORS,
  useClass: MsalInterceptor,
  multi: true
} : [];

const port = (window.location.port) ? ':' + window.location.port : '';
const url = `${window.location.protocol}//${window.location.hostname}${port}`;

@NgModule({
  imports: [
    CommonModule, RouterModule, HttpClientModule, GrowlerModule, ModalModule, OverlayModule,
    MsalModule.forRoot({
      auth: {
        clientId: 'a1695d4d-84c0-4750-be9b-e049c9c68f19',
        authority: 'https://login.microsoftonline.com/organizations',
        redirectUri: url
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: isIE, // set to true for IE 11
      },
    },
    {
      popUp: !isIE,
      consentScopes: [
        'user.read',
        'openid',
        'profile',
      ],
      protectedResourceMap: [
        ['https://graph.microsoft.com/v1.0/me', ['user.read']]
      ],
      extraQueryParameters: {}
    })
  ],
  exports: [GrowlerModule, RouterModule, HttpClientModule, ModalModule, OverlayModule, NavbarComponent],
  declarations: [NavbarComponent],
  providers: [
    msalProviders,
    { provide: 'Window', useFactory: () => window }
  ] // these should be singleton
})
export class CoreModule extends EnsureModuleLoadedOnceGuard {    // Ensure that CoreModule is only loaded into AppModule

  // Looks for the module in the parent injector to see if it's already been loaded (only want it loaded once)
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    super(parentModule);
  }

}



