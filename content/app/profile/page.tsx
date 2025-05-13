import ProfileForm from "@/components/profile/profile-form"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="mt-2 text-gray-600">Manage your personal information</p>
        </div>
        <ProfileForm />
      </div>
    </div>
  )
}
