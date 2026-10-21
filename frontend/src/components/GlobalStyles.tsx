"use client";
import { useEffect } from "react";

export default function GlobalStyles() {
    useEffect(() => {
        const saved = localStorage.getItem("tmg_colors");
        if (!saved) return;
        try {
            const c = JSON.parse(saved);
            const root = document.documentElement;
            if (c.primary) root.style.setProperty("--primary", c.primary);
            if (c.gold) root.style.setProperty("--gold", c.gold);
            if (c.bg) root.style.setProperty("--background", c.bg);
            if (c.textColor) root.style.setProperty("--foreground", c.textColor);
            if (c.radius) root.style.setProperty("--radius", c.radius);
            if (c.buttonRadius) root.style.setProperty("--button-radius", c.buttonRadius);
            if (c.inputHeight) root.style.setProperty("--input-height", c.inputHeight);
        } catch { }
    }, []);
    return null;
}