import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'
import { Icon } from './Icon'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Professional button component with consistent styling. Follows design system guidelines with no emoji support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'icon'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Add Wine',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Learn More',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Skip',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Wine',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'View Details',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Icon name="plus" size="sm" className="mr-2" />
        Add to Collection
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <Icon name="search" size="md" />,
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
}