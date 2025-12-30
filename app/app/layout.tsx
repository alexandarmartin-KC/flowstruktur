import { AppLayout } from '@/components/app-layout';
import { SavedJobsProvider } from '@/contexts/saved-jobs-context';

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SavedJobsProvider>
      <AppLayout>{children}</AppLayout>
    </SavedJobsProvider>
  );
}
