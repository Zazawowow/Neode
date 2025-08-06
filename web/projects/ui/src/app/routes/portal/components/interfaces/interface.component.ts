import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { tuiButtonOptionsProvider } from '@taiga-ui/core'
import { MappedServiceInterface } from './interface.utils'
import { InterfaceGatewaysComponent } from './gateways.component'
import { InterfaceTorDomainsComponent } from './tor-domains.component'
import { InterfaceClearnetDomainsComponent } from './clearnet-domains.component'
import { InterfaceAddressesComponent } from './addresses/addresses.component'

@Component({
  selector: 'service-interface',
  template: `
    <section class="g-card" [gateways]="value().gateways"></section>
    <section class="g-card" [torDomains]="value().torDomains"></section>
    <section
      class="g-card"
      [clearnetDomains]="value().clearnetDomains"
    ></section>
    <section
      class="g-card"
      [addresses]="value().addresses"
      [isRunning]="true"
    ></section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: var(--tui-text-secondary);
      font: var(--tui-font-text-l);

      ::ng-deep td {
        overflow-wrap: anywhere;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [tuiButtonOptionsProvider({ size: 'xs' })],
  imports: [
    InterfaceGatewaysComponent,
    InterfaceTorDomainsComponent,
    InterfaceClearnetDomainsComponent,
    InterfaceAddressesComponent,
  ],
})
export class InterfaceComponent {
  readonly packageId = input('')
  readonly value = input.required<MappedServiceInterface>()
  readonly isRunning = input.required<boolean>()
}
