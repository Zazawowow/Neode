import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core'
import { MarketplacePkgBase } from '../../../types'
import { CopyService } from '@start9labs/shared'

@Component({
  selector: 'marketplace-about',
  templateUrl: 'about.component.html',
  styleUrls: ['about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AboutComponent {
  readonly copyService = inject(CopyService)

  @Input({ required: true })
  pkg!: MarketplacePkgBase

  @Output()
  readonly static = new EventEmitter<'license'>()
}
