export type RiversUiChoice = {
    text: string;
    value?: unknown;
};

export type RiversUiFaceState = {
    id: string;
    expression?: string;
};

export type RiversUiDialogState = {
    message: string;
    choices: RiversUiChoice[];
    speaker?: string;
    position: "top" | "middle" | "bottom";
    fullWidth: boolean;
    typewriter: boolean;
    clueText?: string;
    face?: RiversUiFaceState;
    onContinue: () => void;
    onChoice: (index: number) => void;
};

export type RiversUiTitleEntry = {
    id: string;
    label: string;
    testId?: string;
    disabled?: boolean;
    enabled?: boolean;
};

export type RiversUiTitleState = {
    title: string;
    nonce?: string | number | null;
    entries: RiversUiTitleEntry[];
    onSelect: (entry: RiversUiTitleEntry) => void;
};

export type RiversUiPauseEntry = {
    id?: string;
    label?: string;
    meta?: string;
    testId?: string;
    kind?: string;
    disabled?: boolean;
    enabled?: boolean;
    selected?: boolean;
    [key: string]: unknown;
};

export type RiversUiPauseState = {
    title: string;
    activeRoute: string;
    routes: RiversUiPauseEntry[];
    contentTitle: string;
    contentRows: RiversUiPauseEntry[];
    footerEntries: RiversUiPauseEntry[];
    routesAriaLabel: string;
    onSelect: (entry: RiversUiPauseEntry, index: number) => void;
};

export type RiversUiHudStatusState = {
    primaryLabel: string;
    levelLabel: string;
    secondaryLabel?: string;
    hpLabel: string;
    hpPercent: number;
    hpClass: string;
    masteredLabel: string;
    portraitFallback: string;
    portraitStyle?: Record<string, string>;
    hasPortraitImage: boolean;
};

export type RiversUiHudMenuState = {
    ariaLabel: string;
    onOpen: () => void;
};

export type RiversUiHudGoalState = {
    ariaLabel: string;
    heading: string;
    objective: string;
    partyLabel: string;
    partyCurrent: number;
    partyMax: number;
};

export type RiversUiHudHintState = {
    glyph: string;
    ariaLabel: string;
    style: Record<string, string>;
    onActivate: () => void;
};

export type RiversUiNotificationState = {
    id: string;
    message: string;
    type: "info" | "warn" | "error";
    opacity?: number;
    offsetY?: number;
};

export type RiversUiOverlayState = {
    phase?: string;
    label?: string;
    statusLabel?: string;
    detailLabel?: string;
    messageLabel?: string;
    ariaLabel?: string;
};

export type RiversUiState = {
    title: RiversUiTitleState | null;
    dialog: RiversUiDialogState | null;
    pause: RiversUiPauseState | null;
    hudStatus: RiversUiHudStatusState | null;
    hudGoal: RiversUiHudGoalState | null;
    hudMenu: RiversUiHudMenuState | null;
    hudHint: RiversUiHudHintState | null;
    wildBattle: any | null;
    leadMoveBar: any | null;
    defeat: RiversUiOverlayState | null;
    warpLoading: RiversUiOverlayState | null;
    notifications: RiversUiNotificationState[];
};

type Listener = () => void;

const initialState: RiversUiState = {
    title: null,
    dialog: null,
    pause: null,
    hudStatus: null,
    hudGoal: null,
    hudMenu: null,
    hudHint: null,
    wildBattle: null,
    leadMoveBar: null,
    defeat: null,
    warpLoading: null,
    notifications: [],
};

export class RiversUiBridge {
    private state: RiversUiState = initialState;
    private listeners = new Set<Listener>();

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getSnapshot = (): RiversUiState => this.state;

    update(patch: Partial<RiversUiState>): void {
        this.state = { ...this.state, ...patch };
        this.emit();
    }

    clearBlockingSurfaces(): void {
        this.update({
            title: null,
            dialog: null,
            pause: null,
            defeat: null,
            warpLoading: null,
        });
    }

    private emit(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }
}

export const riversUiBridge = new RiversUiBridge();

export function isRiversUiBlocking(state: RiversUiState): boolean {
    return !!(state.title || state.dialog || state.pause || state.defeat || state.warpLoading);
}
