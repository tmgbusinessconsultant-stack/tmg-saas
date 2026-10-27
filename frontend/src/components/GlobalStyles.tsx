"use client";

import { useEffect } from "react";

const DEFAULTS = {
    primary: "#0F172A",
    gold: "#D4AF37",
    bg: "#F8FAFC",
    cardBg: "#FFFFFF",
    headerBg: "#0F172A",
    footerBg: "#0F172A",
    textColor: "#0F172A",
    borderColor: "#CBD5E1",
    buttonRadius: "8px",
    cardRadius: "12px",
    inputRadius: "12px",
    inputHeight: "44px",
    buttonHeight: "44px",
    fontSize: "14px",
    h1Size: "36px",
    h2Size: "24px",
    h3Size: "18px",
    fontFamily: "Arial, Helvetica, sans-serif",
    lineHeight: "1.6",
    headerHeight: "64px",
    footerHeight: "auto",
    containerMax: "1280px",
    borderWidth: "1px",
} as const;

type DesignColors = typeof DEFAULTS & Record<string, any>;

function normalizeKey(key: string): string {
    let k = key.replace(/^design_/, "").replace(/^design-/, "");
    k = k.replace(/[-_](.)/g, (_, c) => c.toUpperCase());

    const alias: Record<string, string> = {
        bgColor: "bg",
        background: "bg",
        cardBG: "cardBg",
        headerBG: "headerBg",
        footerBG: "footerBg",
        text: "textColor",
        border: "borderColor",
        radius: "cardRadius",
        container: "containerMax",
    };
    return alias[k] || alias[k.charAt(0).toUpperCase() + k.slice(1)] || k;
}

export function GlobalStyles() {
    useEffect(() => {
        const applyThemeProperties = (c: Partial<DesignColors>) => {
            const r = document.documentElement;
            r.style.setProperty("--primary", c.primary || DEFAULTS.primary);
            r.style.setProperty("--gold", c.gold || DEFAULTS.gold);
            r.style.setProperty("--background", c.bg || DEFAULTS.bg);
            r.style.setProperty("--card-bg", c.cardBg || DEFAULTS.cardBg);
            r.style.setProperty("--header-bg", c.headerBg || DEFAULTS.headerBg);
            r.style.setProperty("--footer-bg", c.footerBg || DEFAULTS.footerBg);
            r.style.setProperty("--foreground", c.textColor || DEFAULTS.textColor);
            r.style.setProperty("--border-color", c.borderColor || DEFAULTS.borderColor);
            r.style.setProperty("--button-radius", c.buttonRadius || DEFAULTS.buttonRadius);
            r.style.setProperty("--radius", c.cardRadius || DEFAULTS.cardRadius);
            r.style.setProperty("--input-radius", c.inputRadius || DEFAULTS.inputRadius);
            r.style.setProperty("--input-height", c.inputHeight || DEFAULTS.inputHeight);
            r.style.setProperty("--button-height", c.buttonHeight || DEFAULTS.buttonHeight);
            r.style.setProperty("--font-size", c.fontSize || DEFAULTS.fontSize);
            r.style.setProperty("--h1-size", c.h1Size || DEFAULTS.h1Size);
            r.style.setProperty("--h2-size", c.h2Size || DEFAULTS.h2Size);
            r.style.setProperty("--h3-size", c.h3Size || DEFAULTS.h3Size);
            r.style.setProperty("--font-family", c.fontFamily || DEFAULTS.fontFamily);
            r.style.setProperty("--line-height", c.lineHeight || DEFAULTS.lineHeight);
            r.style.setProperty("--header-height", c.headerHeight || DEFAULTS.headerHeight);
            r.style.setProperty("--footer-height", c.footerHeight || DEFAULTS.footerHeight);
            r.style.setProperty("--container-max", c.containerMax || DEFAULTS.containerMax);
            r.style.setProperty("--border-width", c.borderWidth || DEFAULTS.borderWidth);
            r.style.setProperty("--primary-foreground", "#FFFFFF");
        };

        try {
            const saved = localStorage.getItem("tmg_colors");
            if (saved) applyThemeProperties(JSON.parse(saved));
        } catch { }

        // Secure formatting to protect cross-origin network operations
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const apiUrl = rawUrl.trim().replace(/\/+$/, "");

        if (apiUrl) {
            // Resolves fallback routing endpoints mapping settings directly
            const targetEndpoint = apiUrl.endsWith("/api") ? `${apiUrl}/settings/public` : `${apiUrl}/api/settings/public`;

            fetch(targetEndpoint, { cache: "no-store" })
                .then((res) => (res.ok ? res.json() : null))
                .then((rows: any[] | null) => {
                    if (!rows || !Array.isArray(rows)) return;

                    const jsonRow = rows.find((r) => ["tmg_colors", "design_tmg_colors", "tmg_colors_json"].includes(r.key));
                    if (jsonRow?.effectiveValue) {
                        try {
                            const colors = typeof jsonRow.effectiveValue === "string" ? JSON.parse(jsonRow.effectiveValue) : jsonRow.effectiveValue;
                            if (colors?.primary || colors?.bg) {
                                applyThemeProperties({ ...DEFAULTS, ...colors });
                                localStorage.setItem("tmg_colors", JSON.stringify(colors));
                                return;
                            }
                        } catch { }
                    }

                    const designRows = rows.filter((r) => r.key.startsWith("design_"));
                    if (designRows.length >= 3) {
                        try {
                            const saved = localStorage.getItem("tmg_colors");
                            const base: DesignColors = saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
                            designRows.forEach((row) => {
                                const normalized = normalizeKey(row.key);
                                if (normalized in DEFAULTS || normalized in base) {
                                    (base as any)[normalized] = row.effectiveValue;
                                }
                            });
                            applyThemeProperties(base);
                            localStorage.setItem("tmg_colors", JSON.stringify(base));
                        } catch { }
                    }
                })
                .catch(() => { });
        }

        const onStorage = (e: StorageEvent) => {
            if (e.key === "tmg_colors" && e.newValue) {
                try { applyThemeProperties({ ...DEFAULTS, ...JSON.parse(e.newValue) }); } catch { }
            }
        };
        const onCustom = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) applyThemeProperties({ ...DEFAULTS, ...detail });
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener("tmg_colors_updated" as any, onCustom);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("tmg_colors_updated" as any, onCustom);
        };
    }, []);

    return null;
}

export function triggerDesignUpdate(colors: any) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tmg_colors_updated", { detail: colors }));
    }
}
