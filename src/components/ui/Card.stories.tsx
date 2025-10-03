import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'
import { Button } from './Button'
import { Badge } from './Badge'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Professional card component for content containers. Provides consistent spacing and visual hierarchy.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg'],
    },
    shadow: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold">Wine Collection</h3>
        <p className="text-gray-600">Manage your personal wine inventory</p>
      </div>
    ),
  },
}

export const WithComponents: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Château Margaux 2015</CardTitle>
        <CardDescription>
          Premier Grand Cru Classé from Bordeaux, France
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Region:</span>
            <span className="text-sm font-medium">Margaux, Bordeaux</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Vintage:</span>
            <span className="text-sm font-medium">2015</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge variant="success">Ready to Drink</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="primary" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-burgundy-500 to-wine-600"></div>
        <div className="p-6">
          <h3 className="text-lg font-semibold">Wine Image Card</h3>
          <p className="text-gray-600">Card with image and custom padding</p>
        </div>
      </div>
    ),
  },
}

export const LargeShadow: Story = {
  args: {
    shadow: 'lg',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold">Featured Wine</h3>
        <p className="text-gray-600">Highlighted with large shadow</p>
      </div>
    ),
  },
}