import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open?: boolean; // Support both 'open' and 'isOpen'
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void; // Support both 'onOpenChange' and 'onClose'
  onClose?: () => void;
  onConfirm: () => void;
  prompt?: string; // Make optional for Agent jobs
  isDeleting?: boolean;
  description?: string; // Optional custom description
  title?: string; // Optional custom title
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onConfirm,
  prompt,
  isDeleting = false,
  description = "Are you sure you want to delete this item?",
  title = "Delete Confirmation",
}) => {
  // Support both prop naming conventions
  const dialogOpen = open ?? isOpen ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else if (onClose && !newOpen) {
      onClose();
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center py-4 text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-3 sm:justify-center">
          <AlertDialogCancel
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;