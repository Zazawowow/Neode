import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core'
import { TuiTitle } from '@taiga-ui/core'
import { TuiSwitch } from '@taiga-ui/kit'
import { FormsModule } from '@angular/forms'
import { i18nPipe } from '@start9labs/shared'
import { TuiCell } from '@taiga-ui/layout'
import { InterfaceGateway } from './interface.utils'

@Component({
  selector: 'section[gateways]',
  template: `
    <header>{{ 'Gateways' | i18n }}</header>
    @for (gateway of gateways(); track $index) {
      <label tuiCell="s">
        <span tuiTitle>{{ gateway.name }}</span>
        <input
          type="checkbox"
          tuiSwitch
          size="s"
          [showIcons]="false"
          [ngModel]="gateway.enabled"
          (ngModelChange)="onToggle(gateway)"
          [disabled]="osUi() && !gateway.public"
        />
      </label>
    }
  `,
  host: { class: 'g-card' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TuiSwitch, i18nPipe, TuiCell, TuiTitle],
})
export class InterfaceGatewaysComponent {
  readonly gateways = input.required<InterfaceGateway[]>()
  readonly osUi = input.required<boolean>()

  async onToggle(gateway: InterfaceGateway) {}
}
