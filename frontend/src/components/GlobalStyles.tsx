"use client";
import { useEffect } from "react";

export function GlobalStyles() {
    useEffect(() => {
        const saved = localStorage.getItem("tmg_colors");
        if (!saved) return;
        try {
            const c = JSON.parse(saved);
            const root = document.documentElement;
            if (c.primary) root.style.setProperty("--primary", c.primary);
            if (c.gold) root.style.setProperty("--gold", c.gold);
            if (c.bg) root.style.setProperty("--background", c.bg);

            // Fix: Check to ensure text color doesn't force white elements dark
            if (c.textColor && c.textColor.toLowerCase() !== "#ffffff" && c.textColor.toLowerCase() !== "#fff") {
                root.style.setProperty("--foreground", c.textColor);
            }

            if (c.radius) root.style.setProperty("--radius", c.radius);
            if (c.buttonRadius) root.style.setProperty("--button-radius", c.buttonRadius);
            if (c.inputHeight) root.style.setProperty("--input-height", c.inputHeight);

            // Force primary buttons to keep white text for readability over dark themes
            root.style.setProperty("--primary-foreground", "#FFFFFF");
        } catch { }
    }, []);
    return null;
}
