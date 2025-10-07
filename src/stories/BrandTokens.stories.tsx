import React from 'react'

export default {
  title: 'Design System/Brand Tokens',
}

export const Colors = () => (
  <div className="space-y-6">
    <section>
      <h3 className="text-heading-2">Primary</h3>
      <div className="flex gap-3 mt-3">
        <div className="w-16 h-16 rounded-lg bg-primary" />
        <div className="w-16 h-16 rounded-lg bg-primary-600" />
        <div className="w-16 h-16 rounded-lg bg-primary-700" />
      </div>
    </section>
    <section>
      <h3 className="text-heading-2">Surfaces</h3>
      <div className="flex gap-3 mt-3">
        <div className="w-16 h-16 rounded-lg bg-surface ring-1 ring-gray-200" />
        <div className="w-16 h-16 rounded-lg bg-surface-alt ring-1 ring-gray-200" />
        <div className="w-16 h-16 rounded-lg bg-dark-surface ring-1 ring-gray-800" />
      </div>
    </section>
  </div>
)

export const Typography = () => (
  <div className="space-y-4">
    <div className="text-display-1">Display 1</div>
    <div className="text-display-2">Display 2</div>
    <div className="text-heading-1">Heading 1</div>
    <div className="text-heading-2">Heading 2</div>
    <div className="text-heading-3">Heading 3</div>
    <div className="text-body">Body</div>
    <div className="text-caption">Caption</div>
  </div>
)


