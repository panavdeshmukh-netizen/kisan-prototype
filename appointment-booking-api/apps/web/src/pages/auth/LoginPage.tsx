import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Calendar, AlertCircle, Eye, EyeOff, Zap } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { label: 'Demo Client', email: 'jane@example.com', pass: 'Password1', role: 'client' },
  { label: 'Demo Provider', email: 'doc@example.com', pass: 'Password1', role: 'provider' },
  { label: 'Demo Farmer', email: 'farmer@example.com', pass: 'Password1', role: 'farmer' },
]

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (from !== '/') {
        navigate(from, { replace: true })
      } else {
        // All roles go to home dashboard first
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Invalid email or password. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError(null)
  }

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center py-12 px-4">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-4">
          <Calendar className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">
          Book<span className="text-blue-600">Ease</span>
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">Sign in to manage your appointments</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-xl shadow-gray-200/60 border border-gray-100">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Quick Demo Login
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => fillDemo(demo.email, demo.pass)}
                    className="flex flex-col items-center p-2.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
                  >
                    <span className="text-xs font-bold text-gray-700 group-hover:text-blue-700">
                      {demo.label}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 capitalize">{demo.role}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Works offline — no backend required for demo
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-gray-50 py-4 bg-gray-50/50 rounded-b-xl">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-gray-400">
          🔒 Demo mode active — data is stored locally in your browser
        </p>
      </div>
    </div>
  )
}
