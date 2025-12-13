'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { gdprApi } from '@/lib/api/gdpr'
import { useAuth } from '@/providers/auth.provider'
import { Download, FileText, Shield, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function GDPRSettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await gdprApi.exportData()

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Your data has been exported successfully')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to export data'
      toast.error(message)
      console.error('Failed to export data:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.email) {
      toast.error('User email not found')
      return
    }

    if (confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      toast.error('Email does not match')
      return
    }

    setIsDeleting(true)
    try {
      await gdprApi.deleteAccount({ confirmEmail: confirmEmail })
      toast.success('Your account has been deleted successfully')
      // Logout and redirect to login
      await logout()
      router.push('/login')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete account'
      toast.error(message)
      console.error('Failed to delete account:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setConfirmEmail('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GDPR & Privacy</h1>
        <p className="text-muted-foreground">
          Manage your personal data and privacy settings
        </p>
      </div>

      <div className="grid gap-4">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <CardTitle>Export Your Data</CardTitle>
            </div>
            <CardDescription>
              Download a copy of all your personal data stored in our system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You have the right to receive a copy of your personal data in a
              structured, commonly used, and machine-readable format (JSON).
            </p>
            <Button onClick={handleExportData} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export My Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Your Rights</CardTitle>
            </div>
            <CardDescription>
              Under GDPR, you have the following rights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Right to access your personal data</li>
              <li>✓ Right to rectification of inaccurate data</li>
              <li>✓ Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>✓ Right to restriction of processing</li>
              <li>✓ Right to data portability</li>
              <li>✓ Right to object to processing</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data We Collect */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Data We Collect</CardTitle>
            </div>
            <CardDescription>Information we store about you</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Account information (email, name)</li>
              <li>• Authentication data (hashed passwords, tokens)</li>
              <li>• Subscription information</li>
              <li>• Usage data and logs</li>
              <li>• Payment information (processed by Stripe)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Delete Account</CardTitle>
            </div>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Warning: This action cannot be undone. All your data will be
              permanently deleted from our systems.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Processing...' : 'Delete My Account'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data will be permanently
              deleted. Please enter your email address to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-email">Email address</Label>
              <Input
                id="delete-email"
                type="email"
                placeholder={user?.email || 'your@email.com'}
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                disabled={isDeleting}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || !confirmEmail}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
