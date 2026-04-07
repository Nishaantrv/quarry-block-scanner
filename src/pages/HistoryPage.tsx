import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, FolderOpen, History, Calendar, Pencil, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MobileCard } from '@/components/ui/mobile-card';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const inspections = useInspectionStore((s) => s.savedInspections);
  const loadInspection = useInspectionStore((s) => s.loadInspection);
  const deleteInspection = useInspectionStore((s) => s.deleteInspection);

  // Sorting: Newest first
  const sortedInspections = [...inspections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpen = (id: string) => {
    loadInspection(id);
    navigate(`/marking/${id}/edit`);
  };

  return (
    <div className="min-h-screen pb-24 bg-background px-4 pt-4">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full bg-card/50 border border-border">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">History</h1>
          <p className="text-sm text-muted-foreground font-medium">Past inspection sessions</p>
        </div>
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditMode(!isEditMode)}
          className="ml-auto gap-2"
        >
          {isEditMode ? (
            <>
              <Check className="h-4 w-4" />
              Done
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" />
              Edit
            </>
          )}
        </Button>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        {sortedInspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="p-6 bg-muted rounded-full">
              <History className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-muted-foreground">No saved inspections</p>
          </div>
        ) : (
          <>
            {sortedInspections.map((insp) => (
              <MobileCard
                key={insp.id}
                title={insp.header.consignee || 'Untitled Session'}
                subtitle={insp.header.stoneType || 'Unknown Material'}
                highlight={/* Maybe highlight active one? */ false}
                thumbnail={
                  <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 text-primary">
                    <span className="text-2xl font-black">{insp.totals.totalBlocks}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider">Blocks</span>
                  </div>
                }
                onClick={() => handleOpen(insp.id)}
                action={
                  isEditMode ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the inspection session.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteInspection(insp.id);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null
                }
              >
                <div className="mt-2 flex items-center gap-4 text-xs font-medium text-muted-foreground border-t border-border/50 pt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(insp.createdAt).toLocaleDateString()}
                  </div>
                  <div className="ml-auto font-bold text-foreground">
                    {(insp.totals.totalNetCbm ?? 0).toFixed(3)} m³
                  </div>
                </div>
              </MobileCard>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
