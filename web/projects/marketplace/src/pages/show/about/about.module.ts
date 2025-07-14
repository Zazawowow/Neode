import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { MarkdownPipe, SafeLinksDirective } from '@start9labs/shared'
import { TuiButton } from '@taiga-ui/core'
import { NgDompurifyPipe } from '@taiga-ui/dompurify'
import { TuiTagModule } from '@taiga-ui/legacy'
import { AboutComponent } from './about.component'
import { MarketplaceAdditionalItemComponent } from '../additional/additional-item.component'

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    TuiTagModule,
    NgDompurifyPipe,
    SafeLinksDirective,
    MarkdownPipe,
    TuiButton,
    MarketplaceAdditionalItemComponent,
  ],
  declarations: [AboutComponent],
  exports: [AboutComponent],
})
export class AboutModule {}
