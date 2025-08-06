import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { TuiSwitch } from '@taiga-ui/kit'
import { FormsModule } from '@angular/forms'
import { i18nPipe } from '@start9labs/shared'

@Component({
  selector: 'section[gateways]',
  template: `
    <header>{{ 'Gateways' | i18n }}</header>
    <ul>
      @for (gateway of gateways(); track $index) {
        <li>
          {{ gateway.name }}
          <input
            type="checkbox"
            tuiSwitch
            [style.margin-inline-start]="'auto'"
            [showIcons]="false"
            [ngModel]="gateway.enabled"
            (ngModelChange)="onToggle(gateway)"
          />
        </li>
      }
      <ul></ul>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TuiSwitch, i18nPipe],
})
export class InterfaceGatewaysComponent {
  readonly gateways = input.required<any>()

  async onToggle(event: any) {}
}
