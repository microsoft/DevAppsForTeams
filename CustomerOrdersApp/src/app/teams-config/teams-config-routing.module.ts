import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TeamsConfigComponent } from './teams-config.component';

const routes: Routes = [
  { path: '', component: TeamsConfigComponent }
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ]
})
export class TeamsConfigRoutingModule {
  static components = [ TeamsConfigComponent ];
}