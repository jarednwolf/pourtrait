import type { Meta, StoryObj } from '@storybook/react'
import { Icon, getAvailableIcons } from './Icon'

const meta = {
  title: 'UI/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Professional icon component using Heroicons. Provides consistent sizing and styling across the application. Enforces design system guidelines with no custom emoji support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: { type: 'select' },
      options: getAvailableIcons(),
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'home',
    size: 'md',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icon name="star" size="xs" />
      <Icon name="star" size="sm" />
      <Icon name="star" size="md" />
      <Icon name="star" size="lg" />
      <Icon name="star" size="xl" />
    </div>
  ),
}

export const Navigation: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon name="home" size="lg" />
      <Icon name="search" size="lg" />
      <Icon name="user" size="lg" />
      <Icon name="settings" size="lg" />
    </div>
  ),
}

export const Actions: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon name="plus" size="lg" />
      <Icon name="x" size="lg" />
      <Icon name="heart" size="lg" />
      <Icon name="star" size="lg" />
    </div>
  ),
}

export const Status: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon name="info" size="lg" className="text-blue-600" />
      <Icon name="warning" size="lg" className="text-yellow-600" />
      <Icon name="success" size="lg" className="text-green-600" />
      <Icon name="error" size="lg" className="text-red-600" />
    </div>
  ),
}

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-8 gap-4 p-4">
      {getAvailableIcons().map((iconName) => (
        <div key={iconName} className="flex flex-col items-center gap-2 p-2">
          <Icon name={iconName} size="lg" />
          <span className="text-xs text-gray-600">{iconName}</span>
        </div>
      ))}
    </div>
  ),
}