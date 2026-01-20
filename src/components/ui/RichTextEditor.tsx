"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { cn } from "@/lib/utils";
import TradingViewWidget from "./TradingViewWidget";

const MDEditor = dynamic(
    () => import("@uiw/react-md-editor"),
    { ssr: false }
);

interface RichTextEditorProps {
    value: string;
    onChange: (value?: string) => void;
    placeholder?: string;
    className?: string;
    height?: number;
    preview?: "live" | "edit" | "preview";
}

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
    height = 200,
    preview = "edit"
}: RichTextEditorProps) {
    const { theme } = useTheme();

    return (
        <div data-color-mode={theme === 'light' ? 'light' : 'dark'} className={cn("rounded-md overflow-hidden border border-slate-800", className)}>
            <MDEditor
                value={value}
                onChange={onChange}
                height={height}
                preview={preview}
                textareaProps={{
                    placeholder: placeholder
                }}
                className="bg-slate-950"
                style={{
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    borderColor: 'rgb(30 41 59)'
                }}
            />
        </div>
    );
}

const Markdown = dynamic(
    () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
    { ssr: false }
);

export function MarkdownPreview({ source, style, className }: { source: string, style?: any, className?: string }) {

    const components = useMemo(() => ({
        a: ({ node, ...props }: any) => {
            const { href, children } = props;
            if (!href) return <a {...props} />;

            // TradingView Chart Unfurl
            const tvMatch = href.match(/^https?:\/\/(www\.)?tradingview\.com\/chart\/([^\/]+)\/?/);
            if (tvMatch) {
                const symbol = tvMatch[2];
                return (
                    <span className="block my-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 aspect-video relative h-[400px]">
                        <TradingViewWidget key={symbol} symbol={symbol} />
                    </span>
                );
            }

            // Image Unfurl
            const isImage = href.match(/\.(jpeg|jpg|gif|png|webp)$/i);
            if (isImage) {
                return (
                    <span className="block my-2">
                        <img
                            src={href}
                            alt="Embedded content"
                            className="max-h-[300px] rounded-md border border-slate-800 object-contain bg-slate-950/50"
                        />
                    </span>
                );
            }

            return <a target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline break-all" {...props} />;
        },
        img: ({ node, ...props }: any) => {
            return (
                <span className="block my-2">
                    <img
                        {...props}
                        className={cn("max-h-[400px] rounded-md border border-slate-800 object-contain bg-slate-950/50", props.className)}
                    />
                </span>
            );
        }
    }), []);

    return (
        <Markdown
            source={source}
            style={style}
            className={className}
            components={components}
        />
    );
}
