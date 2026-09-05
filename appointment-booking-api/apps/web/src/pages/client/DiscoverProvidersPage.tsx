import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { Search, Stethoscope, Calendar, ArrowRight } from 'lucide-react'

export const DiscoverProvidersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.providers.getProviders(),
  })

  const providers = data?.data || []

  const filteredProviders = providers.filter((p) => {
    const term = searchTerm.toLowerCase()
    const matchesName = p.name.toLowerCase().includes(term)
    const matchesSpecialization = p.specialization?.toLowerCase().includes(term)
    const matchesBio = p.bio?.toLowerCase().includes(term)
    return matchesName || matchesSpecialization || matchesBio
  })

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-blue-500/10">
        <div className="max-w-2xl">
          <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm mb-3">
            Trusted Professionals
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Find & Book Top Service Providers
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Browse verified providers, check real-time availability slots, and
            book your appointment with instant confirmation.
          </p>

          {/* Search bar */}
          <div className="mt-6 relative max-w-lg">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or specialization (e.g. Doctor, Consultant)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-white text-gray-900 shadow-lg shadow-black/5 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-white"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Available Providers{' '}
            {filteredProviders.length > 0 && `(${filteredProviders.length})`}
          </h2>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Discovering verified providers..." />
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
            Failed to load service providers. Please try again later.
          </div>
        ) : filteredProviders.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No providers found"
            description={
              searchTerm
                ? `No service providers match "${searchTerm}". Try a different search query.`
                : 'There are currently no registered service providers available.'
            }
            actionLabel={searchTerm ? 'Clear Search' : undefined}
            onAction={searchTerm ? () => setSearchTerm('') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Card
                key={provider.id}
                className="flex flex-col hover:shadow-lg hover:border-blue-200 transition-all group overflow-hidden"
              >
                <CardContent className="pt-6 flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md shadow-blue-500/20">
                      {provider.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {provider.name}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 tracking-wide uppercase mt-0.5">
                        {provider.specialization || 'Professional Consultant'}
                      </p>
                      {provider.hourly_rate && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-bold text-gray-900">
                            ${provider.hourly_rate}
                          </span>{' '}
                          / hour
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {provider.bio ||
                      'Experienced professional dedicated to delivering outstanding quality and reliable service for every client.'}
                  </p>
                </CardContent>

                <CardFooter className="border-t border-gray-50 py-3.5 px-6 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500 space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>Real-time Slots</span>
                  </div>
                  <Link to={`/providers/${provider.id}`}>
                    <Button size="sm" className="group-hover:bg-blue-700">
                      <span>View Slots</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
