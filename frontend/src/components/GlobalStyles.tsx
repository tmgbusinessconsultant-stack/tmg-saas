"use client";
import { useEffect } from "react";

export default function GlobalStyles() {
    useEffect(() => {
        const saved = localStorage.getItem("tmg_colors");
        if (!saved) return;
        try {
            const c = JSON.parse(saved);
            const root = document.documentElement;
            Object.entries(c).forEach(([k, v]) => {
                const cssKey = `--${k.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
                // map camelCase to CSS var
                root.style.setProperty(cssKey, v as string);
                // also set direct names
                if (k === "primary") root.style.setProperty("--primary", v as string);
                if (k === "gold") root.style.setProperty("--gold", v as string);
                if (k === "bg") root.style.setProperty("--background", v as string);
                if (k === "cardBg") root.style.setProperty("--card-bg", v as string);
                if (k === "headerBg") root.style.setProperty("--header-bg", v as string);
                if (k === "footerBg") root.style.setProperty("--footer-bg", v as string);
                if (k === "buttonRadius") root.style.setProperty("--button-radius", v as string);
                if (k === "cardRadius") root.style.setProperty("--radius", v as string);
                if (k === "inputRadius") root.style.setProperty("--input-radius", v as string);
                if (k === "inputHeight") root.style.setProperty("--input-height", v as string);
                if (k === "buttonHeight") root.style.setProperty("--button-height", v as string);
                if (k === "fontSize") root.style.setProperty("--font-size", v as string);
                if (k === "h1Size") root.style.setProperty("--h1-size", v as string);
                if (k === "h2Size") root.style.setProperty("--h2-size", v as string);
                if (k === "h3Size") root.style.setProperty("--h3-size", v as string);
                if (k === "headerHeight") root.style.setProperty("--header-height", v as string);
                if (k === "footerHeight") root.style.setProperty("--footer-height", v as string);
                if (k === "fontFamily") root.style.setProperty("--font-family", v as string);
            });
        } catch { }
    }, []);
    return null;
}