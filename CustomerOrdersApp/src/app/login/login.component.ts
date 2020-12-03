import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AADAuthService } from '../core/services/aad-auth.service';
import { TeamsAuthService } from '../core/services/teams-auth.service';


@Component({
    selector: 'cm-login',
    templateUrl: './login.component.html',
    styleUrls: [ './login.component.css' ]
})
export class LoginComponent implements OnInit {
    loginVisible = false;
    grantConsentVisible = false;

    constructor(private router: Router, 
                private aadAuthService: AADAuthService, 
                private teamsAuthService: TeamsAuthService) { }
  
    async ngOnInit() { 
      // See if we're in Teams
      const graphProfile = await this.getGraphProfile();
      if (graphProfile === 'invalid_grant') {
        this.grantConsentVisible = true;
        return;
      } 

      // See if we're logged in (set by MSAL as well as Teams for this app)
      if (this.aadAuthService.loggedIn) {
        return this.navigate();
      }    
      else {
        this.loginVisible = true;
        return;
      }
    }

    async getGraphProfile() {
      // See if app is running in Teams
      let graphProfile;
      try {
        graphProfile = await this.teamsAuthService.login();
      }
      catch (error) {
        if (error === "invalid_grant") {
          console.log(error);
          return error;
        }
      }
      return graphProfile;
    }

    async grantConsent() {
      let token = await this.teamsAuthService.grantConsent();
      console.log('Grant token received', token);
      window.location.reload();
    }

    login() {
      this.aadAuthService.login();
    }

    navigate() {
      // See if deep linking in Teams sent a subEntityId for the customer to show
      if (this.teamsAuthService.subEntityId) {
        this.router.navigate(['/customers', this.teamsAuthService.subEntityId, 'details']);
      }
      else {
        this.router.navigate(['/']);
      }
    }
  
}
