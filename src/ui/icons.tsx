import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
    title?: string;
};

function SvgIcon({ title, children, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 64 64"
            aria-hidden={title ? undefined : true}
            role={title ? "img" : undefined}
            focusable="false"
            {...props}
        >
            {title ? <title>{title}</title> : null}
            {children}
        </svg>
    );
}

export function RiverKnotIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M12 34c10-20 28-20 40 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <path d="M12 46c10-20 28-20 40 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".55" />
            <circle cx="32" cy="32" r="7" fill="currentColor" opacity=".75" />
        </SvgIcon>
    );
}

export function CompassRoseIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M32 4l8 20 20 8-20 8-8 20-8-20-20-8 20-8z" fill="currentColor" opacity=".88" />
            <circle cx="32" cy="32" r="9" fill="none" stroke="currentColor" strokeWidth="4" />
        </SvgIcon>
    );
}

export function ClueMarkIcon(props: IconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M18 16c8-8 22-8 29 0 7 9 1 18-8 23-4 2-5 4-5 8h-8c0-8 4-12 10-16 6-4 8-8 4-12-4-5-12-5-17 1z" fill="currentColor" />
            <circle cx="30" cy="56" r="5" fill="currentColor" />
        </SvgIcon>
    );
}

export function RouteIcon({ kind, ...props }: IconProps & { kind: string }) {
    if (kind === "battle") {
        return (
            <SvgIcon {...props}>
                <path d="M15 49l34-34M24 14l26 26M14 24l26 26" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            </SvgIcon>
        );
    }
    if (kind === "travel") {
        return <CompassRoseIcon {...props} />;
    }
    if (kind === "search") {
        return <ClueMarkIcon {...props} />;
    }
    return (
        <SvgIcon {...props}>
            <path d="M18 42c2-12 10-19 24-20M20 47c8-3 17-3 26 0" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <circle cx="25" cy="21" r="7" fill="currentColor" />
            <circle cx="41" cy="18" r="5" fill="currentColor" opacity=".75" />
        </SvgIcon>
    );
}

export function PanelCornerSvg() {
    return (
        <svg className="rr-panel-corners" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M2 24V2h22M76 2h22v22M98 76v22H76M24 98H2V76" />
        </svg>
    );
}

export function RiversSvgFilters() {
    return (
        <svg className="rr-svg-defs" aria-hidden="true" focusable="false">
            <filter id="rr-paper-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed="17" />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                    <feFuncA type="table" tableValues="0 0.08" />
                </feComponentTransfer>
            </filter>
            <filter id="rr-ink-bleed">
                <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="9" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
            </filter>
        </svg>
    );
}
