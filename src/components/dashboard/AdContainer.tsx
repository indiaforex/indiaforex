import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdContainer({ className }: { className?: string }) {
    return (
        <Card className={cn("rounded-md border-border/40 shadow-sm min-h-[250px] flex flex-col bg-card/50 backdrop-blur-sm mt-4", className)}>
            <CardHeader className="flex-none p-3 py-2 border-b border-border/40 bg-muted/20">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 border border-border/40 px-1.5 py-0.5 rounded">
                        Sponsored
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex items-center justify-center bg-slate-950/30">
                <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-600 transition-colors hover:border-slate-700 hover:text-slate-500 cursor-pointer">
                    <div className="p-3 bg-slate-900/50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M12 12v-9" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                    <span className="text-xs font-medium uppercase tracking-widest text-[10px]">Advertisement Space</span>
                </div>
            </CardContent>
        </Card>
    );
}
