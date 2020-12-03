import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamsConfigRoutingModule } from './teams-config-routing.module';

@NgModule({
  declarations: [TeamsConfigRoutingModule.components],
  imports: [
    CommonModule, 
    TeamsConfigRoutingModule
  ]
})
export class TeamsConfigModule { }
