import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Compass } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-lg text-gray-600">Page not found</p>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        The page you are looking for might have been moved, deleted, or does not
        exist.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
