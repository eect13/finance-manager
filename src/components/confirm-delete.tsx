import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ConfirmDelete({
  open,
  title,
  body,
  confirmLabel = "Delete",
  requirePhrase,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  requirePhrase?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [phrase, setPhrase] = useState("");
  useEffect(() => {
    if (open) setPhrase("");
  }, [open]);
  const ready = !requirePhrase || phrase === requirePhrase;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        {requirePhrase ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-medium text-foreground">{requirePhrase}</span> to confirm.
            </p>
            <Input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={requirePhrase}
              autoComplete="off"
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!ready} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
