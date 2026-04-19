/** @jsxImportSource solid-js */
import { render } from 'solid-js/web';
import { DialogOverlay } from './DialogOverlay';
import { ToastOverlay } from './ToastOverlay';
import { NewGameModal } from './NewGameModal';
import { CombatOverlay } from './CombatOverlay';

export function mountDialogOverlay(container: HTMLElement): () => void {
  return render(
    () => (
      <>
        <DialogOverlay />
        <CombatOverlay />
        <ToastOverlay />
        <NewGameModal />
      </>
    ),
    container
  );
}
