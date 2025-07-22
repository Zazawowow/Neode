import { i18nKey } from '@start9labs/shared'

export const SYSTEM_MENU = [
  [
    {
      icon: '@tui.settings',
      item: 'General',
      link: 'general',
    },
  ],
  [
    {
      icon: '@tui.copy-plus',
      item: 'Create Backup',
      link: 'backup',
    },
    {
      icon: '@tui.database-backup',
      item: 'Restore Backup',
      link: 'restore',
    },
  ],
  [
    {
      icon: '@tui.monitor',
      item: 'StartOS UI',
      link: 'interfaces',
    },
    {
      icon: '@tui.mail',
      item: 'Email',
      link: 'email',
    },
    {
      icon: '@tui.wifi',
      item: 'WiFi',
      link: 'wifi',
    },
  ],
  [
    {
      icon: '@tui.award',
      item: 'ACME',
      link: 'acme',
    },
    {
      icon: '@tui.hard-drive-download',
      item: 'Inbound Proxies',
      link: 'proxies',
    },
  ],
  [
    {
      icon: '@tui.clock',
      item: 'Active Sessions',
      link: 'sessions',
    },
    {
      icon: '@tui.terminal',
      item: 'SSH' as i18nKey,
      link: 'ssh',
    },
    {
      icon: '@tui.key',
      item: 'Change Password',
      link: 'password',
    },
  ],
] as const
