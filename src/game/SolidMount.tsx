import { useEffect, useRef } from 'react';
import { mountDialogOverlay } from './solid-ui/mountDialog';

// Mounts the Solid dialog overlay into a div owned by this React component.
// JSX construction of Solid components must happen inside a Solid-compiled file,
// so we delegate to mountDialogOverlay from this React-compiled boundary.
export function SolidDialogMount() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dispose = mountDialogOverlay(ref.current);
    return dispose;
  }, []);
  return <div ref={ref} className="absolute inset-0 pointer-events-none" />;
}
