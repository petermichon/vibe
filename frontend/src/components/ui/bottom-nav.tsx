import { NavPill, AddButton } from '@/components/ui/nav-pill';

export function BottomNav() {
  return (
    <div className="bottom-nav-container md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
      <NavPill />
      <AddButton />
    </div>
  );
}
