import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { PatchDB } from 'src/app/services/patch-db/patch-db.service'
import { map } from 'rxjs'
import { DataModel } from 'src/app/services/patch-db/data-model'

@Component({
  selector: 'lan',
  templateUrl: './lan.page.html',
  styleUrls: ['./lan.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LANPage {
  constructor(private readonly patch: PatchDB<DataModel>) {}

  installCert(): void {
    document.getElementById('install-cert')?.click()
  }
}
