import { Compass } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { btnPrimary } from '@/components/ui/classes';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That page doesn't exist. It may have moved, or the link is out of date."
        action={
          <Link href="/" className={btnPrimary}>
            Back to home
          </Link>
        }
      />
    </div>
  );
}
