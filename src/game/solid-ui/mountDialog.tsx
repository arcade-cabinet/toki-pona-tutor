/** @jsxImportSource solid-js */
import { render } from 'solid-js/web';
import { DialogOverlay } from './DialogOverlay';

export function mountDialogOverlay(container: HTMLElement): () => void {
  return render(() => <DialogOverlay />, container);
}
