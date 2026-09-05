import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { toast } from 'sonner'
import { User, Lock, Briefcase } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth()
  const isProvider = user?.role === 'provider'

  // General profile state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Provider profile state
  const [specialization, setSpecialization] = useState('')
  const [bio, setBio] = useState('')
  const [hourlyRate, setHourlyRate] = useState<string>('')
  const [isUpdatingProvider, setIsUpdatingProvider] = useState(false)

  // Password state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  useEffect(() => {
    if (isProvider) {
      api.providers
        .getProviderProfile()
        .then((res) => {
          if (res.data) {
            setSpecialization(res.data.specialization || '')
            setBio(res.data.bio || '')
            setHourlyRate(
              res.data.hourly_rate ? res.data.hourly_rate.toString() : '',
            )
          }
        })
        .catch((err) => console.error('Failed to load provider profile', err))
    }
  }, [isProvider])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    try {
      const res = await api.users.updateProfile({ name, email })
      updateUser(res.data.user)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdateProviderProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProvider(true)
    try {
      await api.providers.updateProviderProfile({
        specialization,
        bio,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      })
      toast.success('Professional details updated!')
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to update professional profile',
      )
    } finally {
      setIsUpdatingProvider(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.')
      return
    }

    setIsChangingPassword(true)
    try {
      await api.users.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      })
      toast.success('Password changed successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Failed to change password. Check your old password.',
      )
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile details and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-bold text-lg text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="mt-3">
                <Badge
                  variant={isProvider ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {user?.role} Account
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>
                Update your basic account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" isLoading={isUpdatingProfile}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Provider Specific Profile */}
          {isProvider && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Professional Profile</CardTitle>
                </div>
                <CardDescription>
                  Public details visible to clients when discovering your
                  services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleUpdateProviderProfile}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization">
                      Specialization / Profession
                    </Label>
                    <Input
                      id="specialization"
                      placeholder="e.g. Cardiologist, Physical Therapist, Consultant"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="e.g. 150"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Bio / About your services</Label>
                    <textarea
                      id="bio"
                      rows={3}
                      className="w-full rounded-md border border-gray-200 p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="Tell clients about your background and approach..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <Button type="submit" isLoading={isUpdatingProvider}>
                    Update Professional Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Change Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-amber-600" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Ensure your account remains secure with a strong password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={isChangingPassword}
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
