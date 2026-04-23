import {
    inject,
    WebSocketToken,
    type AbstractWebsocket,
    type RpgClient,
    type RpgClientEngine,
} from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import {
    DICTIONARY_EXPORT_EVENT,
    isDictionaryExportPayload,
    type DictionaryExportPayload,
} from "../modules/main/dictionary-export";

type DebugDictionaryExport = DictionaryExportPayload & {
    shareAttempted: boolean;
    clipboardAttempted: boolean;
    downloadAttempted: boolean;
};

declare global {
    interface Window {
        __POKI_LAST_DICTIONARY_EXPORT__?: DebugDictionaryExport;
        __POKI_DICTIONARY_EXPORT_RUNTIME__?: {
            installed: boolean;
            received: number;
            invalid: number;
        };
    }
}

let lastPayloadKey: string | null = null;
let lastPayloadAt = 0;
let installedExportSockets = new WeakSet<object>();

const dictionaryExportClientModule = defineModule<RpgClient>({
    engine: {
        onStart(engine) {
            installDictionaryExportRuntime(engine);
        },
        onConnected(engine, socket) {
            installDictionaryExportRuntime(engine, socket as AbstractWebsocket);
        },
    },
    sceneMap: {
        onAfterLoading() {
            installDictionaryExportRuntime();
        },
    },
});

export function provideDictionaryExportRuntime() {
    return createModule("DictionaryExportRuntime", [
        {
            server: null,
            client: dictionaryExportClientModule,
        },
    ]);
}

function installDictionaryExportRuntime(
    engine?: RpgClientEngine,
    connectedSocket?: AbstractWebsocket,
): void {
    for (const socket of resolveSockets(engine, connectedSocket)) {
        if (installedExportSockets.has(socket as object)) continue;
        installedExportSockets.add(socket as object);
        recordRuntimeStatus("installed");
        socket.on(DICTIONARY_EXPORT_EVENT, (payload: unknown) => {
            if (!isDictionaryExportPayload(payload)) {
                recordRuntimeStatus("invalid");
                return;
            }
            if (isDuplicatePayload(payload)) return;
            recordRuntimeStatus("received");
            void exportDictionaryPayload(payload);
        });
    }
}

function resolveSockets(
    engine?: RpgClientEngine,
    connectedSocket?: AbstractWebsocket,
): AbstractWebsocket[] {
    const sockets: AbstractWebsocket[] = [];
    if (connectedSocket) sockets.push(connectedSocket);
    try {
        const injected = inject<AbstractWebsocket>(WebSocketToken);
        if (!sockets.includes(injected)) sockets.push(injected);
    } catch {
        // The scene-map hook can run outside the inject context; fall back to the engine socket.
    }
    if (engine?.socket && !sockets.includes(engine.socket)) {
        sockets.push(engine.socket);
    }
    if (sockets.length === 0) {
        throw new Error("Dictionary export runtime requires a client socket");
    }
    return sockets;
}

function isDuplicatePayload(payload: DictionaryExportPayload): boolean {
    const now = performance.now();
    const key = `${payload.filename}:${payload.textCard}:${payload.svgCard.length}`;
    if (lastPayloadKey === key && now - lastPayloadAt < 1000) return true;
    lastPayloadKey = key;
    lastPayloadAt = now;
    return false;
}

async function exportDictionaryPayload(payload: DictionaryExportPayload): Promise<void> {
    const debug = recordDictionaryExport(payload);
    notifyDictionaryExport(debug);
    const svgFile = new File([payload.svgCard], payload.filename, { type: "image/svg+xml" });
    const share = navigator.share?.bind(navigator);
    const canShare = navigator.canShare?.bind(navigator);

    if (share && canShare?.({ files: [svgFile] })) {
        debug.shareAttempted = true;
        notifyDictionaryExport(debug);
        try {
            await share({
                title: "Clue Journal",
                text: payload.textCard,
                files: [svgFile],
            });
            notifyDictionaryExport(debug);
            return;
        } catch {
            // Fall through to copy/download if the share sheet is dismissed.
        }
    }

    try {
        debug.clipboardAttempted = true;
        notifyDictionaryExport(debug);
        await navigator.clipboard?.writeText(payload.textCard);
    } catch {
        // Clipboard permission is browser-dependent; SVG download remains the hard fallback.
    }

    downloadSvg(payload);
    debug.downloadAttempted = true;
    notifyDictionaryExport(debug);
}

function downloadSvg(payload: DictionaryExportPayload): void {
    const blob = new Blob([payload.svgCard], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function recordDictionaryExport(payload: DictionaryExportPayload): DebugDictionaryExport {
    const debug: DebugDictionaryExport = {
        ...payload,
        shareAttempted: false,
        clipboardAttempted: false,
        downloadAttempted: false,
    };
    window.__POKI_LAST_DICTIONARY_EXPORT__ = debug;
    return debug;
}

function notifyDictionaryExport(debug: DebugDictionaryExport): void {
    window.__POKI_LAST_DICTIONARY_EXPORT__ = debug;
    window.dispatchEvent(new CustomEvent("poki:dictionary-exported", { detail: debug }));
}

function recordRuntimeStatus(event: "installed" | "received" | "invalid"): void {
    if (!import.meta.env.DEV && import.meta.env.MODE !== "test") return;
    const current = window.__POKI_DICTIONARY_EXPORT_RUNTIME__ ?? {
        installed: false,
        received: 0,
        invalid: 0,
    };
    if (event === "installed") current.installed = true;
    if (event === "received") current.received += 1;
    if (event === "invalid") current.invalid += 1;
    window.__POKI_DICTIONARY_EXPORT_RUNTIME__ = current;
}
