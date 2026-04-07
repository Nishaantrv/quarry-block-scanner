import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus, Play, History, ArrowRight, UserCircle, Box, Layers, Copy } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { format, isToday, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { GlassContainer } from '@/components/ui/glass-container';
import { MobileCard } from '@/components/ui/mobile-card';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
    const navigate = useNavigate();
    const savedInspections = useInspectionStore((s) => s.savedInspections);
    const activeInspection = useInspectionStore((s) => s.activeInspection);
    const resumeInspection = useInspectionStore((s) => s.loadInspection);
    const duplicateInspection = useInspectionStore((s) => s.duplicateInspection);
    const clearActive = useInspectionStore((s) => s.discardActiveInspection);

    // Quick Stats: Today's Metrics
    const todayStats = useMemo(() => {
        const today = savedInspections.filter(i => isToday(new Date(i.createdAt)));
        let blocks = 0;
        let volume = 0;

        today.forEach(i => {
            blocks += i.blocks.length;
            volume += i.totals.totalNetCbm;
        });

        // Add active inspection if created today
        if (activeInspection && isToday(new Date(activeInspection.createdAt))) {
            blocks += activeInspection.blocks.length;
            volume += activeInspection.totals.totalNetCbm;
        }

        return { blocks, volume };
    }, [savedInspections, activeInspection]);

    // Chart Data: Last 7 Days
    const chartData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            const dayVolume = savedInspections
                .filter(inspection => isWithinInterval(new Date(inspection.createdAt), { start, end }))
                .reduce((acc, curr) => acc + curr.totals.totalNetCbm, 0);

            data.push({
                name: format(date, 'EEE'), // Mon, Tue
                volume: parseFloat((dayVolume ?? 0).toFixed(2)),
                fullDate: format(date, 'dd MMM')
            });
        }
        return data;
    }, [savedInspections]);

    const handleResume = (id: string) => {
        resumeInspection(id);
        navigate('/marking');
    };

    return (
        <div className="space-y-6 pt-6 px-4 pb-12 w-full max-w-md mx-auto">
            {/* APP HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground">
                        Overview
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">
                        {format(new Date(), 'EEEE, d MMMM')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <ThemeToggle />
                    <div className="bg-card/50 p-2 rounded-full border border-white/5 shadow-sm">
                        <UserCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-3">
                <GlassContainer className="p-4 flex flex-col items-start justify-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Box className="w-12 h-12" />
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Today's Vol</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-primary tracking-tight">{(todayStats.volume ?? 0).toFixed(1)}</span>
                        <span className="text-xs font-bold text-muted-foreground">m³</span>
                    </div>
                </GlassContainer>

                <GlassContainer className="p-4 flex flex-col items-start justify-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layers className="w-12 h-12" />
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Blocks</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-foreground tracking-tight">{todayStats.blocks}</span>
                        <span className="text-xs font-bold text-muted-foreground">units</span>
                    </div>
                </GlassContainer>
            </div>

            {/* MAIN ACTION */}
            <Button
                className="w-full h-20 rounded-2xl text-xl font-black uppercase tracking-wide bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-between px-8 group"
                onClick={() => navigate('/new')}
            >
                Start Marking
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <Plus className="h-6 w-6" />
                </div>
            </Button>

            {/* ACTIVE SESSION */}
            {activeInspection && activeInspection.status === 'draft' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Active Session</span>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    </div>

                    <MobileCard
                        highlight
                        title={activeInspection.header.consignee || 'Unknown Customer'}
                        subtitle={`${format(new Date(activeInspection.updatedAt || activeInspection.createdAt), 'HH:mm')} · ${activeInspection.header.stoneType}`}
                        onClick={() => navigate('/marking')}
                        thumbnail={<Play className="w-6 h-6 text-primary fill-primary/20" />}
                    >
                        <div className="flex gap-4 mt-2 border-t border-border/50 pt-2">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Items</span>
                                <span className="text-lg font-bold">{activeInspection.blocks.length}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Vol</span>
                                <span className="text-lg font-bold">{(activeInspection.totals.totalNetCbm ?? 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </MobileCard>
                </div>
            )}

            {/* VOLUME CHART */}
            <GlassContainer className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" /> Volume Trends
                        </h2>
                        <span className="text-[10px] text-muted-foreground">Last 7 Days</span>
                    </div>
                </div>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Bar
                                dataKey="volume"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassContainer>

            {/* RECENT HISTORY */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1 pt-2">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <History className="h-3 w-3" /> Recent Markings
                    </h2>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground" onClick={() => navigate('/history')}>
                        View All
                    </Button>
                </div>

                <div className="space-y-3">
                    {savedInspections.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground text-sm font-medium border border-dashed border-border rounded-xl">
                            No recent inspections
                        </div>
                    ) : (
                        savedInspections.slice(0, 3).map((inspection) => (
                            <MobileCard
                                key={inspection.id}
                                onClick={() => handleResume(inspection.id)}
                                title={inspection.header.consignee || 'Unknown'}
                                subtitle={`${format(new Date(inspection.createdAt), 'dd MMM')} · ${inspection.header.stoneType}`}
                                thumbnail={<Box className="w-5 h-5 text-muted-foreground" />}
                            >
                                <div className="mt-1 flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold">{(inspection.totals.totalNetCbm ?? 0).toFixed(2)} m³</span>
                                        <span className="text-sm text-muted-foreground">({inspection.blocks.length} blks)</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Duplicate this inspection header?')) {
                                                duplicateInspection(inspection.id);
                                                navigate('/marking');
                                            }
                                        }}
                                    >
                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </MobileCard>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
