import { AppLayout } from '@/components/app-layout';
import { SavedJobsProvider } from '@/contexts/saved-jobs-context';
import { UserProfileProvider } from '@/contexts/user-profile-context';

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SavedJobsProvider>
      <UserProfileProvider>
        <AppLayout>{children}</AppLayout>
      </UserProfileProvider>
    </SavedJobsProvider>
  );
}
