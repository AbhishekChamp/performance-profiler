import type { Preview } from '@storybook/react'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import '@/index.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0d1117' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <div className="p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}

export default preview
