import { Pipe, PipeTransform } from '@angular/core'
import { toAuthorityName } from 'src/app/utils/acme'

@Pipe({
  name: 'authorityName',
})
export class AuthorityNamePipe implements PipeTransform {
  transform(value: string | null = null): string {
    return toAuthorityName(value)
  }
}
