import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Calendar,
  AlertCircle,
  User as UserIcon,
  Briefcase,
} from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'client' | 'provider'>('client')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setIsSubmitting(true)

    try {
      await register(name, email, password, role)
      navigate(role === 'provider' ? '/provider/dashboard' : '/discover', {
        replace: true,
      })
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please check your details and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
          <Calendar className="h-6 w-6" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Join BookEase as a client or a service provider
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="border border-gray-100 shadow-xl shadow-gray-200/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Toggle Selector */}
              <div className="space-y-1.5">
                <Label>I want to register as a:</Label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 text-center transition-all ${
                      role === 'client'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <UserIcon className="h-5 w-5 mb-1 text-blue-600" />
                    <span className="font-semibold text-sm">Client</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      Book appointments
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 text-center transition-all ${
                      role === 'provider'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <Briefcase className="h-5 w-5 mb-1 text-indigo-600" />
                    <span className="font-semibold text-sm">Provider</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      Offer services
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Dr. Sarah Jenkins or John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4"
                isLoading={isSubmitting}
              >
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-50 py-4 bg-gray-50/50 rounded-b-xl">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
