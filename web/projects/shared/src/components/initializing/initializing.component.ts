import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Input,
} from '@angular/core'
import { TuiProgress } from '@taiga-ui/kit'
import { LogsWindowComponent } from './logs-window.component'
import { i18nPipe } from '../../i18n/i18n.pipe'

@Component({
  selector: 'app-initializing',
  template: `
    @if (error(); as err) {
      <section>
        <h1>{{ 'Error initializing server' | i18n }}</h1>
        <p>{{ err }}</p>
      </section>
    } @else {
      <section>
        <h1 [style.font-size.rem]="2" [style.margin-bottom.rem]="2">
          {{
            setupType()
              ? ('Setting up your server' | i18n)
              : ('Booting StartOS' | i18n)
          }}
        </h1>
        <div>
          {{ 'Progress' | i18n }}: {{ (progress().total * 100).toFixed(0) }}%
        </div>
        <progress
          tuiProgressBar
          [style.max-width.rem]="40"
          [style.margin]="'1rem auto'"
          [attr.value]="progress().total"
        ></progress>
        <p [innerHTML]="message()"></p>
      </section>
    }
    <logs-window />
  `,
  styles: `
    section {
      border-radius: 0.25rem;
      padding: 1rem;
      margin: 1.5rem;
      text-align: center;
      // @TODO Theme
      background: #e0e0e0;
      color: #333;
      --tui-background-neutral-1: rgba(0, 0, 0, 0.1);
    }

    logs-window {
      display: flex;
      flex-direction: column;
      height: 18rem;
      padding: 1rem;
      margin: 0 1.5rem auto;
      text-align: left;
      overflow: hidden;
      border-radius: 2rem;
      // @TODO Theme
      background: #181818;
    }
  `,
  imports: [LogsWindowComponent, TuiProgress, i18nPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitializingComponent {
  private readonly i18nPipe = inject(i18nPipe)

  readonly progress = input<{ total: number; message: string }>({
    total: 0,
    message: '',
  })
  readonly setupType = input<
    'fresh' | 'restore' | 'attach' | 'transfer' | undefined
  >()
  readonly error = input<string>()

  readonly message = computed(() => {
    return (
      this.progress().message ||
      (this.progress().total === 1
        ? this.i18nPipe.transform('Finished')
        : '...')
    )
  })
}
