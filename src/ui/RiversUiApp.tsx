import {
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type CSSProperties,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Progress, Separator, VisuallyHidden } from "radix-ui";
import {
    riversUiBridge,
    isRiversUiBlocking,
    type RiversUiDialogState,
    type RiversUiFaceState,
    type RiversUiHudStatusState,
    type RiversUiPauseEntry,
    type RiversUiPauseState,
    type RiversUiTitleEntry,
    type RiversUiTitleState,
} from "./bridge";
import {
    ClueMarkIcon,
    CompassRoseIcon,
    PanelCornerSvg,
    RiverKnotIcon,
    RiversSvgFilters,
    RouteIcon,
} from "./icons";
import { publicAssetPath } from "../config/asset-paths";
import { CREATURE_SPRITESHEETS } from "../config/creature-sprites";
import { DEFAULT_TEXT_SPEED_CPS, typewriterIntervalMsForCps } from "../config/typewriter-speed";
import { getTextSpeed } from "../platform/persistence/settings";
import { COMBAT_UI_CONFIG, DEFEAT_SCREEN_CONFIG, WARP_LOADING_CONFIG } from "../content/gameplay";
import { formatGameplayTemplate } from "../content/gameplay/templates";

type FrameSpec = {
    src?: string;
    framesWidth?: number;
    framesHeight?: number;
    frameX?: number;
    frameY?: number;
};

const baseUrl = import.meta.env.BASE_URL || "/";

function cx(...values: Array<string | false | null | undefined>): string {
    return values.filter(Boolean).join(" ");
}

function slug(value: unknown): string {
    return String(value ?? "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function isEntryDisabled(
    entry: { id?: unknown; disabled?: unknown; enabled?: unknown } | null | undefined,
): boolean {
    if (!entry) return true;
    if (!entry.id) return true;
    if (entry.disabled) return true;
    if (entry.enabled === false) return true;
    return false;
}

function labelOf(
    entry: { label?: unknown; id?: unknown } | null | undefined,
    fallback = "",
): string {
    const label = entry?.label ?? entry?.id ?? fallback;
    return String(label ?? fallback);
}

function percent(value: unknown): number {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, numeric));
}

function spriteStyle(frame: FrameSpec | null | undefined): CSSProperties {
    if (!frame?.src) return {};
    const framesWidth = Math.max(1, Number(frame.framesWidth || 1));
    const framesHeight = Math.max(1, Number(frame.framesHeight || 1));
    const frameX = Math.max(0, Math.min(framesWidth - 1, Number(frame.frameX || 0)));
    const frameY = Math.max(0, Math.min(framesHeight - 1, Number(frame.frameY || 0)));
    const positionX = framesWidth <= 1 ? 0 : (frameX / (framesWidth - 1)) * 100;
    const positionY = framesHeight <= 1 ? 0 : (frameY / (framesHeight - 1)) * 100;
    return {
        backgroundImage: `url(${publicAssetPath(frame.src, baseUrl)})`,
        backgroundSize: `${framesWidth * 100}% ${framesHeight * 100}%`,
        backgroundPosition: `${positionX}% ${positionY}%`,
    };
}

function faceStyle(face: RiversUiFaceState | undefined): CSSProperties {
    if (!face?.id) return {};
    const sheet = CREATURE_SPRITESHEETS.find((entry) => entry.id === face.id);
    if (!sheet) return {};
    const animation =
        sheet.animations[face.expression || "idle"] ??
        sheet.animations.idle ??
        sheet.animations.default ??
        sheet.animations.stand;
    const frame = animation?.frames?.[0] ?? 0;
    return spriteStyle({
        src: sheet.image,
        framesWidth: sheet.framesWidth,
        framesHeight: sheet.framesHeight,
        frameX: frame % sheet.framesWidth,
        frameY: Math.floor(frame / sheet.framesWidth),
    });
}

function panelMotion(reducedMotion: boolean | null) {
    if (reducedMotion) return {};
    return {
        initial: { opacity: 0, y: 14, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.985 },
        transition: { duration: 0.18 },
    };
}

export function RiversUiApp() {
    const state = useSyncExternalStore(
        riversUiBridge.subscribe,
        riversUiBridge.getSnapshot,
        riversUiBridge.getSnapshot,
    );
    const blocking = isRiversUiBlocking(state);
    const suppressDialog = !!(state.title || state.pause || state.defeat || state.warpLoading);

    return (
        <div className="rr-ui" data-testid="rr-ui-root" data-blocking={blocking ? "true" : "false"}>
            <RiversSvgFilters />
            <div className="rr-frame-vignette" aria-hidden="true" />
            {state.hudStatus && !blocking ? <HudStatus status={state.hudStatus} /> : null}
            {state.hudMenu && !blocking ? (
                <div className="rr-hud-frame" data-testid="hud-frame">
                    <button
                        type="button"
                        className="rr-hud-menu-toggle"
                        data-testid="hud-menu-toggle"
                        aria-label={state.hudMenu.ariaLabel}
                        onClick={state.hudMenu.onOpen}
                    >
                        <CompassRoseIcon />
                    </button>
                </div>
            ) : null}
            {state.hudHint && !blocking ? (
                <button
                    type="button"
                    className="rr-hud-hint"
                    data-testid="hint-glyph"
                    aria-label={state.hudHint.ariaLabel}
                    style={state.hudHint.style}
                    onClick={state.hudHint.onActivate}
                >
                    <RouteIcon kind={state.hudHint.glyph} />
                    <span>{state.hudHint.glyph}</span>
                </button>
            ) : null}
            <AnimatePresence>
                {state.title ? <TitleSurface key="title" state={state.title} /> : null}
                {state.dialog && !suppressDialog ? (
                    <DialogSurface key="dialog" state={state.dialog} />
                ) : null}
                {state.pause ? <PauseSurface key="pause" state={state.pause} /> : null}
                {state.defeat ? <DefeatSurface key="defeat" state={state.defeat} /> : null}
                {state.warpLoading ? <WarpSurface key="warp" state={state.warpLoading} /> : null}
            </AnimatePresence>
            {state.wildBattle ? <WildBattleSurface view={state.wildBattle} /> : null}
            {state.leadMoveBar ? <LeadMoveBarSurface view={state.leadMoveBar} /> : null}
            <NotificationStack notifications={state.notifications} />
        </div>
    );
}

function TitleSurface({ state }: { state: RiversUiTitleState }) {
    const reducedMotion = useReducedMotion();
    useEffect(() => {
        document.body.classList.remove("rr-title-dismissed");
    }, [state.nonce]);

    return (
        <motion.section
            className="rr-title-screen"
            data-testid="rr-title-screen"
            {...panelMotion(reducedMotion)}
        >
            <div className="rr-title-sky rr-title-shader" aria-hidden="true">
                <span className="rr-title-glow rr-title-glow-a" />
                <span className="rr-title-glow rr-title-glow-b" />
                <span className="rr-title-starfield" />
                <span className="rr-title-river rr-title-river-a" />
                <span className="rr-title-river rr-title-river-b" />
                <span className="rr-title-hill rr-title-hill-a" />
                <span className="rr-title-hill rr-title-hill-b" />
            </div>
            <div className="rr-title-shell">
                <div className="rr-title-copy">
                    <div className="rr-title-badge">
                        <RiverKnotIcon aria-hidden="true" />
                        <span>Rivergate case file</span>
                    </div>
                    <h1 className="rr-title-title" data-testid="rr-title-title">
                        {state.title}
                    </h1>
                    <p className="rr-title-subtitle">
                        Catch strange companions, follow old clues, and uncover the green dragon's
                        trail across a hand-built fantasy frontier.
                    </p>
                    <div className="rr-title-pill-row" aria-label="Adventure pillars">
                        <span className="rr-title-pill">Creature catching</span>
                        <span className="rr-title-pill">Mystery quests</span>
                        <span className="rr-title-pill">Tap-first play</span>
                    </div>
                </div>
                <div className="rr-title-card">
                    <div className="rr-title-card-heading">
                        <CompassRoseIcon aria-hidden="true" />
                        <div>
                            <p className="rr-title-kicker">Field kit ready</p>
                            <p className="rr-title-card-copy">
                                Pick up the trail and choose your next move.
                            </p>
                        </div>
                    </div>
                    <Separator.Root className="rr-separator" decorative />
                    <div className="rr-title-menu" role="menu" aria-label="Title menu">
                        {state.entries.map((entry, index) => (
                            <TitleButton
                                key={`${entry.id}-${index}`}
                                entry={entry}
                                index={index}
                                onSelect={state.onSelect}
                            />
                        ))}
                    </div>
                    <div className="rr-title-card-footer">
                        <ClueMarkIcon aria-hidden="true" />
                        <span>Built for mouse, keyboard shortcuts, and touch.</span>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function TitleButton({
    entry,
    index,
    onSelect,
}: {
    entry: RiversUiTitleEntry;
    index: number;
    onSelect: (entry: RiversUiTitleEntry) => void;
}) {
    const disabled = isEntryDisabled(entry);
    return (
        <button
            type="button"
            className="rr-title-entry rr-command-button"
            data-testid={`rr-title-entry-${slug(entry.testId || entry.id || index)}`}
            data-entry-id={entry.id}
            disabled={disabled}
            role="menuitem"
            onClick={() => {
                if (!disabled) {
                    onSelect(entry);
                    document.body.classList.add("rr-title-dismissed");
                    riversUiBridge.update({ title: null });
                }
            }}
        >
            <span>{entry.label}</span>
            <RiverKnotIcon aria-hidden="true" />
        </button>
    );
}

function useDialogTypewriter(state: RiversUiDialogState) {
    const [display, setDisplay] = useState(state.message);
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        let disposed = false;
        let timer: number | undefined;
        setDisplay("");
        setTyping(false);

        async function run() {
            if (!state.message || !state.typewriter) {
                setDisplay(state.message);
                return;
            }

            const cps = await getTextSpeed().catch(() => DEFAULT_TEXT_SPEED_CPS);
            if (disposed) return;
            const intervalMs = typewriterIntervalMsForCps(cps);
            if (intervalMs === null) {
                setDisplay(state.message);
                return;
            }

            setTyping(true);
            let index = 0;
            timer = window.setInterval(() => {
                if (disposed) return;
                index += 1;
                setDisplay(state.message.slice(0, index));
                if (index >= state.message.length) {
                    if (timer) window.clearInterval(timer);
                    setTyping(false);
                }
            }, intervalMs);
        }

        void run();
        return () => {
            disposed = true;
            if (timer) window.clearInterval(timer);
        };
    }, [state]);

    return {
        display,
        typing,
        finishTyping: () => {
            setDisplay(state.message);
            setTyping(false);
        },
    };
}

function DialogSurface({ state }: { state: RiversUiDialogState }) {
    const reducedMotion = useReducedMotion();
    const { display, typing, finishTyping } = useDialogTypewriter(state);
    const hasChoices = state.choices.length > 0;
    const stageRef = useRef<HTMLElement | null>(null);

    function continueOrFinish() {
        if (typing) {
            finishTyping();
            return;
        }
        if (!hasChoices) state.onContinue();
    }

    // Auto-focus the dialog stage on mount and whenever the message
    // changes so keyboard handlers attached to it receive Enter/Space
    // presses. Without this, focus remains on document.body after the
    // dialog opens from a non-keyboard trigger (e.g. map warp or
    // `player.showText` from the opening scene) and desktop users are
    // silently locked out of advancing.
    useEffect(() => {
        stageRef.current?.focus();
    }, [state.message]);

    // Document-level fallback so dialogs advance even if focus has
    // drifted (e.g. user clicked outside the dialog stage since the
    // last frame). Only active while the dialog surface is mounted.
    useEffect(() => {
        function handleKey(event: KeyboardEvent) {
            if (event.key !== "Enter" && event.key !== " ") return;
            // Don't steal input from form fields or buttons.
            const target = event.target as HTMLElement | null;
            if (target) {
                const tag = target.tagName;
                if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
                if (target.isContentEditable) return;
                // Buttons inside the dialog (choices) handle their own clicks.
                if (tag === "BUTTON") return;
            }
            event.preventDefault();
            continueOrFinish();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    });

    return (
        <motion.section
            ref={stageRef}
            className={cx(
                "rr-dialog-stage",
                `position-${state.position}`,
                state.fullWidth && "full-width",
            )}
            data-testid="rr-dialog-stage"
            onClick={continueOrFinish}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    continueOrFinish();
                }
            }}
            tabIndex={0}
            {...panelMotion(reducedMotion)}
        >
            <article
                className="rr-dialog rr-carved-panel"
                data-testid="rr-dialog"
                onClick={(event) => {
                    event.stopPropagation();
                    continueOrFinish();
                }}
            >
                <PanelCornerSvg />
                {state.face ? (
                    <div className="rr-dialog-face" aria-hidden="true">
                        <span style={faceStyle(state.face)} />
                    </div>
                ) : null}
                <div className="rr-dialog-copy">
                    {state.speaker ? (
                        <div className="rr-dialog-speaker">{state.speaker}</div>
                    ) : null}
                    <div className="rr-dialog-content" data-testid="rr-dialog-content">
                        {display}
                    </div>
                    {state.clueText ? (
                        <div className="rr-dialog-clue" data-testid="dialog-sitelen-overlay">
                            <ClueMarkIcon />
                            <span>{state.clueText}</span>
                        </div>
                    ) : null}
                    {hasChoices ? (
                        <div className="rr-dialog-choices">
                            {state.choices.map((choice, index) => (
                                <button
                                    key={`${choice.text}-${index}`}
                                    type="button"
                                    className="rr-dialog-choice rr-command-button"
                                    data-testid={`dialog-choice-${index}`}
                                    data-choice-index={index}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        state.onChoice(index);
                                    }}
                                >
                                    {choice.text}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="rr-dialog-continue" aria-hidden="true">
                            {typing ? "..." : "tap or press Enter"}
                        </div>
                    )}
                </div>
            </article>
        </motion.section>
    );
}

function HudStatus({ status }: { status: RiversUiHudStatusState }) {
    const style = status.portraitStyle ?? {};
    return (
        <aside className="rr-hud-status" data-testid="hud-status" aria-label={status.hpLabel}>
            <div
                className={cx("rr-hud-portrait", status.hasPortraitImage && "has-image")}
                aria-hidden="true"
            >
                <span className="rr-hud-portrait-image" style={style} />
                <span className="rr-hud-portrait-fallback">{status.portraitFallback}</span>
            </div>
            <div className="rr-hud-copy">
                <div className="rr-hud-heading">
                    <strong>{status.primaryLabel}</strong>
                    <small>{status.levelLabel}</small>
                </div>
                {status.secondaryLabel ? (
                    <div className="rr-hud-subtitle">{status.secondaryLabel}</div>
                ) : null}
                <div className="rr-hud-metrics">
                    <HpBar value={status.hpPercent} label={status.hpLabel} tone={status.hpClass} />
                    <span>{status.masteredLabel}</span>
                </div>
            </div>
        </aside>
    );
}

function PauseSurface({ state }: { state: RiversUiPauseState }) {
    const reducedMotion = useReducedMotion();
    const routeCount = state.routes.length;
    const rowCount = state.contentRows.length;
    return (
        <motion.section
            className="rr-pause-screen"
            data-testid="pause-overlay"
            {...panelMotion(reducedMotion)}
        >
            <div className="rr-pause-card rr-carved-panel">
                <PanelCornerSvg />
                <header className="rr-pause-header">
                    <CompassRoseIcon />
                    <h2 data-testid="rr-pause-title">{state.title}</h2>
                    <VisuallyHidden.Root>{state.routesAriaLabel}</VisuallyHidden.Root>
                </header>
                <nav className="rr-pause-routes" aria-label={state.routesAriaLabel}>
                    {state.routes.map((route, index) => {
                        const routeId = String(route.id ?? "").replace(/^route:/, "");
                        return (
                            <button
                                key={`${routeId}-${index}`}
                                type="button"
                                className="rr-pause-route rr-command-button"
                                data-selected={state.activeRoute === routeId ? "true" : "false"}
                                data-testid={slug(
                                    route.testId || `pause-route-${routeId || index}`,
                                )}
                                disabled={isEntryDisabled(route)}
                                onClick={() => state.onSelect(route, index)}
                            >
                                <RouteIcon kind={routeId || "travel"} />
                                <span>{labelOf(route)}</span>
                            </button>
                        );
                    })}
                </nav>
                <section className="rr-pause-panel">
                    <h3 className="rr-pause-panel-heading">{state.contentTitle}</h3>
                    <div className="rr-pause-list">
                        {state.contentRows.map((row, index) => (
                            <PauseRow
                                key={`${row.id || row.kind || "row"}-${index}`}
                                row={row}
                                index={routeCount + index}
                                fallbackIndex={index}
                                onSelect={state.onSelect}
                            />
                        ))}
                    </div>
                </section>
                <footer className="rr-pause-footer">
                    {state.footerEntries.map((entry, index) => (
                        <button
                            key={`${entry.id || "footer"}-${index}`}
                            type="button"
                            className="rr-pause-footer-item rr-command-button"
                            data-testid={slug(entry.testId || `pause-entry-${entry.id || index}`)}
                            disabled={isEntryDisabled(entry)}
                            onClick={() => state.onSelect(entry, routeCount + rowCount + index)}
                        >
                            {labelOf(entry)}
                        </button>
                    ))}
                </footer>
            </div>
        </motion.section>
    );
}

function PauseRow({
    row,
    index,
    fallbackIndex,
    onSelect,
}: {
    row: RiversUiPauseEntry;
    index: number;
    fallbackIndex: number;
    onSelect: (entry: RiversUiPauseEntry, index: number) => void;
}) {
    const testId = slug(row.testId || `pause-row-${row.id || row.kind || fallbackIndex}`);
    if (row.kind === "party-detail") {
        const lines = Array.isArray(row.detailLines) ? row.detailLines.map(String) : [];
        return (
            <article className="rr-party-detail-card" data-testid={testId}>
                <strong>{labelOf(row)}</strong>
                {lines.map((line) => (
                    <span key={line}>{line}</span>
                ))}
            </article>
        );
    }

    if (row.kind === "party-slot") {
        const portraitFrame = row.portraitFrame as FrameSpec | undefined;
        return (
            <button
                type="button"
                className={cx("rr-pause-row", "rr-party-slot-row", row.selected && "selected")}
                data-testid={testId}
                aria-label={String(row.hpLabel || row.label || "")}
                disabled={isEntryDisabled(row)}
                onClick={() => onSelect(row, index)}
            >
                <span
                    className={cx("rr-party-portrait", portraitFrame?.src && "has-image")}
                    aria-hidden="true"
                >
                    <span className="rr-party-portrait-image" style={spriteStyle(portraitFrame)} />
                    <span>{String(row.portraitFallback || "?")}</span>
                </span>
                <span className="rr-party-slot-copy">
                    <span className="rr-party-slot-heading">
                        <strong>{labelOf(row)}</strong>
                        <small>{String(row.levelLabel || row.meta || "")}</small>
                    </span>
                    <span>{String(row.secondaryLabel || row.typeLabel || "")}</span>
                    <span className="rr-party-hp-line">
                        <HpBar
                            value={row.hpPercent}
                            label={String(row.hpLabel || "HP")}
                            tone={String(row.hpClass || "hp-healthy")}
                        />
                        <small>{String(row.hpLabel || "")}</small>
                    </span>
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            className="rr-pause-row"
            data-testid={testId}
            disabled={isEntryDisabled(row)}
            onClick={() => onSelect(row, index)}
        >
            <span>{labelOf(row)}</span>
            {row.meta ? <small>{String(row.meta)}</small> : null}
        </button>
    );
}

function HpBar({ value, label, tone }: { value: unknown; label: string; tone?: string }) {
    const width = percent(value);
    return (
        <Progress.Root className={cx("rr-hp-bar", tone)} value={width} max={100} aria-label={label}>
            <Progress.Indicator className="rr-hp-fill hp-fill" style={{ width: `${width}%` }} />
        </Progress.Root>
    );
}

function WildBattleSurface({ view }: { view: any }) {
    const copy = COMBAT_UI_CONFIG.wildBattle;
    const damage = view?.damage ?? null;
    const capture = view?.capture ?? null;
    const lead = view?.lead ?? null;
    const target = view?.target ?? null;
    const ariaLabel = target
        ? formatGameplayTemplate(copy.battleLabelTemplate, {
              lead: lead?.label || copy.missingLeadLabel,
              target: target.label,
          })
        : copy.battleAriaLabel;

    return (
        <section className="rr-wild-battle" data-testid="wild-battle" aria-label={ariaLabel}>
            <div className="rr-wild-stage">
                {lead ? (
                    <WildCombatant combatant={lead} testId="wild-battle-lead" role="lead" />
                ) : (
                    <MissingLead />
                )}
                <div className="rr-wild-versus" aria-hidden="true">
                    {copy.versusLabel}
                </div>
                <div
                    className={cx(
                        "rr-wild-capture",
                        capture && "visible",
                        capture && `state-${capture.state}`,
                    )}
                    data-testid="wild-battle-capture"
                    aria-hidden={capture ? "false" : "true"}
                >
                    <span className="rr-wild-capture-orb" />
                    <strong>{capture?.label || ""}</strong>
                </div>
                {target ? (
                    <WildCombatant
                        combatant={target}
                        testId="wild-battle-target"
                        role="target"
                        damage={damage}
                    />
                ) : null}
            </div>
        </section>
    );
}

function MissingLead() {
    const copy = COMBAT_UI_CONFIG.wildBattle;
    return (
        <div className="rr-wild-combatant missing lead" data-testid="wild-battle-lead">
            <span className="rr-wild-sprite">{copy.missingPortraitFallback}</span>
            <div>
                <strong>{copy.missingLeadLabel}</strong>
                <small>{copy.missingLeadTypeLabel}</small>
            </div>
        </div>
    );
}

function WildCombatant({
    combatant,
    testId,
    role,
    damage,
}: {
    combatant: any;
    testId: string;
    role: "lead" | "target";
    damage?: any;
}) {
    return (
        <div className={cx("rr-wild-combatant", role)} data-testid={testId}>
            <span
                className={cx("rr-wild-sprite", combatant.sprite?.src && "has-image")}
                style={spriteStyle(combatant.sprite)}
            >
                {combatant.fallback}
            </span>
            {damage ? (
                <span
                    className={cx("rr-wild-damage", "visible", `tone-${damage.tone}`)}
                    data-testid="wild-battle-damage"
                >
                    {damage.label}
                </span>
            ) : role === "target" ? (
                <span
                    className="rr-wild-damage"
                    data-testid="wild-battle-damage"
                    aria-hidden="true"
                />
            ) : null}
            <div className="rr-wild-copy">
                <div className="rr-wild-heading">
                    <strong>{combatant.label}</strong>
                    <small>{combatant.levelLabel}</small>
                </div>
                <small>{combatant.typeLabel}</small>
                <div className="rr-wild-hp-line">
                    <HpBar
                        value={combatant.hpPercent}
                        label={combatant.hpLabel}
                        tone={combatant.hpClass}
                    />
                    <small>{combatant.hpLabel}</small>
                </div>
            </div>
        </div>
    );
}

function LeadMoveBarSurface({ view }: { view: any }) {
    const copy = COMBAT_UI_CONFIG.leadMoveBar;
    const [now, setNow] = useState(Date.now());
    const moves = Array.isArray(view?.moves) ? view.moves : [];

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 150);
        return () => window.clearInterval(timer);
    }, []);

    if (!moves.length) return null;

    const switchInfo = view?.switch ?? null;
    const switchOptions = Array.isArray(switchInfo?.options) ? switchInfo.options : [];
    const target = view?.target ?? null;

    function ready(move: any): boolean {
        if (!move || move.disabled) return false;
        return Number(move.readyAt || 0) <= now;
    }

    function cooldownLabel(move: any): string {
        const remaining = Number(move?.readyAt || 0) - now;
        if (remaining <= 0) return copy.readyLabel;
        return formatGameplayTemplate(copy.cooldownLabelTemplate, {
            seconds: Math.ceil(remaining / 1000),
        });
    }

    return (
        <section
            className="rr-lead-movebar"
            data-testid="lead-movebar"
            aria-label={view?.leadLabel || copy.emptyAriaLabel}
        >
            <header className="rr-lead-header">
                <div>
                    <strong>{view?.leadLabel || ""}</strong>
                    <small>{view?.levelLabel || ""}</small>
                </div>
                <div>
                    <span data-testid="lead-switch-label">
                        {switchInfo?.actionLabel || copy.switchActionLabel}
                    </span>
                    <small>{view?.energyLabel || ""}</small>
                </div>
            </header>
            {switchInfo ? (
                <div className="rr-lead-switch-panel" data-testid="lead-switch-panel">
                    <strong>{switchInfo.title || copy.switchTitle}</strong>
                    {switchOptions.length ? (
                        <div className="rr-lead-switch-list">
                            {switchOptions.map((option: any) => (
                                <button
                                    key={`${option.slot}-${option.speciesId}`}
                                    type="button"
                                    className={cx(
                                        "rr-lead-switch-option",
                                        option.selected && "selected",
                                    )}
                                    data-testid={`lead-switch-slot-${option.slot ?? "unknown"}`}
                                    disabled={!option || !!option.disabled}
                                    aria-disabled={!option || option.disabled ? "true" : "false"}
                                    onClick={() => view.onSwitchLead?.(option)}
                                >
                                    <span>{option.label}</span>
                                    <small>
                                        {option.levelLabel} - {option.meta}
                                    </small>
                                    <HpBar
                                        value={option.hpPercent}
                                        label={option.hpLabel}
                                        tone={option.hpClass || "hp-healthy"}
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span>{switchInfo.emptyLabel || copy.switchEmptyLabel}</span>
                    )}
                </div>
            ) : null}
            <div
                className="rr-lead-target"
                data-testid="lead-movebar-target"
                data-in-range={target?.inRange ? "true" : "false"}
            >
                <span>{target?.label || copy.defaultTargetLabel}</span>
                <small>{target?.statusLabel || copy.defaultTargetStatus}</small>
            </div>
            <div className="rr-lead-grid">
                {moves.map((move: any) => {
                    const isReady = ready(move);
                    return (
                        <button
                            key={move.actionId || move.moveId || move.label}
                            type="button"
                            className={cx("rr-lead-move", isReady ? "ready" : "cooldown")}
                            data-testid={`lead-move-${move.moveId || "unknown"}`}
                            data-type={move.typeLabel}
                            data-ready={isReady ? "true" : "false"}
                            disabled={!isReady}
                            aria-disabled={isReady ? "false" : "true"}
                            aria-label={`${move.label}, ${move.meta}, ${cooldownLabel(move)}`}
                            onClick={() => {
                                if (isReady) view.onUseMove?.(move);
                            }}
                        >
                            <span>{move.label}</span>
                            <small>{move.meta}</small>
                            <em>{cooldownLabel(move)}</em>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function WarpSurface({ state }: { state: any }) {
    const phase = state.phase || WARP_LOADING_CONFIG.defaultPhase;
    const defaults =
        WARP_LOADING_CONFIG.phaseLabels[phase as keyof typeof WARP_LOADING_CONFIG.phaseLabels] ??
        WARP_LOADING_CONFIG.phaseLabels[WARP_LOADING_CONFIG.defaultPhase];
    const status = state.statusLabel || defaults.statusLabel;
    const label = state.label || "";
    const detail = state.detailLabel || defaults.detailLabel;
    const ariaLabel =
        state.ariaLabel ||
        formatGameplayTemplate(WARP_LOADING_CONFIG.ariaLabelTemplate, {
            status,
            label,
        });
    return (
        <motion.section
            className={cx("rr-warp-loading", `phase-${phase}`)}
            data-testid="warp-loading"
            data-phase={phase}
            aria-label={ariaLabel}
        >
            <div className="rr-overlay-card rr-carved-panel">
                <PanelCornerSvg />
                <CompassRoseIcon />
                <div>
                    <small>{status}</small>
                    <strong>{label}</strong>
                    <span>{detail}</span>
                </div>
            </div>
        </motion.section>
    );
}

function DefeatSurface({ state }: { state: any }) {
    const phase = state.phase || DEFEAT_SCREEN_CONFIG.defaultPhase;
    const defaults =
        DEFEAT_SCREEN_CONFIG.phaseLabels[phase as keyof typeof DEFEAT_SCREEN_CONFIG.phaseLabels] ??
        DEFEAT_SCREEN_CONFIG.phaseLabels[DEFEAT_SCREEN_CONFIG.defaultPhase];
    const status = state.statusLabel || defaults.statusLabel;
    const label = state.label || "";
    const detail = state.detailLabel || defaults.detailLabel;
    const ariaLabel =
        state.ariaLabel ||
        formatGameplayTemplate(DEFEAT_SCREEN_CONFIG.ariaLabelTemplate, {
            status,
            label,
        });
    return (
        <motion.section
            className={cx("rr-defeat-screen", `phase-${phase}`)}
            data-testid="defeat-screen"
            data-phase={phase}
            aria-label={ariaLabel}
        >
            <div className="rr-overlay-card rr-defeat-card rr-carved-panel">
                <PanelCornerSvg />
                <RiverKnotIcon />
                <div>
                    <small>{status}</small>
                    <strong>{state.messageLabel || DEFEAT_SCREEN_CONFIG.messageLabel}</strong>
                    <span>{label}</span>
                    <span>{detail}</span>
                </div>
            </div>
        </motion.section>
    );
}

function NotificationStack({
    notifications,
}: {
    notifications: Array<{
        id: string;
        message: string;
        type: string;
        opacity?: number;
        offsetY?: number;
    }>;
}) {
    if (!notifications.length) return null;
    return (
        <div className="rr-notifications" data-testid="rr-notifications">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className="rr-notification rr-carved-panel"
                    data-type={notification.type || "info"}
                    style={{
                        opacity: notification.opacity ?? 1,
                        transform: `translateY(${notification.offsetY ?? 0}px)`,
                    }}
                >
                    <PanelCornerSvg />
                    <ClueMarkIcon />
                    <span>{notification.message}</span>
                </div>
            ))}
        </div>
    );
}
