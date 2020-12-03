import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AADAuthService } from '../services/aad-auth.service';
import { GrowlerService, GrowlerMessageType } from '../growler/growler.service';
import { LoggerService } from '../services/logger.service';
import { TeamsAuthService } from '../services/teams-auth.service';

@Component({
    selector: 'cm-navbar',
    templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
    teamsInitialized = false;
    isCollapsed: boolean;
    loggedIn: boolean;
    aadAuthServiceSub: Subscription;
    teamsInitializedSub: Subscription;

    constructor(private router: Router,
        public aadAuthService: AADAuthService,
        private growler: GrowlerService,
        private teamsAuthService: TeamsAuthService,
        private logger: LoggerService) { }

    ngOnInit() {
        this.loggedIn = this.aadAuthService.loggedIn;
        this.aadAuthServiceSub = this.aadAuthService.authChanged
            .subscribe((loggedIn: boolean) => {
                this.loggedIn = loggedIn;
                this.growler.growl('Logged In', GrowlerMessageType.Info);
            },
            (err: any) => this.logger.log(err));
        this.teamsInitializedSub = this.teamsAuthService.teamsInitialized
            .subscribe((initialized: boolean) => {
                this.teamsInitialized = initialized;
            });
    }

    ngOnDestroy() {
        this.aadAuthServiceSub.unsubscribe();
        this.teamsInitializedSub.unsubscribe();
    }

    logout() {
        if (this.aadAuthService.loggedIn) {
            this.aadAuthService.logout();
        }
        this.redirectToLogin();
    }

    redirectToLogin() {
        this.router.navigate(['/login']);
    }

}
