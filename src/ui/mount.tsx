import { createRoot, type Root } from "react-dom/client";
import { RiversUiApp } from "./RiversUiApp";

let root: Root | null = null;

export function mountRiversUi(): void {
    if (typeof document === "undefined" || root) return;

    let mount = document.getElementById("rr-ui-root");
    if (!mount) {
        mount = document.createElement("div");
        mount.id = "rr-ui-root";
        document.body.appendChild(mount);
    }

    root = createRoot(mount);
    root.render(<RiversUiApp />);
}
