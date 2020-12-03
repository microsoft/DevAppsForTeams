import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { CustomersRoutingModule } from './customers-routing.module';
import { SalesPersonFinderPipe } from './customers-card/sales-person-finder.pipe';

@NgModule({
  imports: [CustomersRoutingModule, SharedModule],
  declarations: [CustomersRoutingModule.components, SalesPersonFinderPipe ]
})
export class CustomersModule { }
