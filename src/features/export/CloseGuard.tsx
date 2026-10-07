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
import { useCloseGuard } from "./useCloseGuard";

export function CloseGuard() {
  const { pending, cancel, quit } = useCloseGuard();
  return (
    <AlertDialog open={pending > 0} onOpenChange={(open) => !open && cancel()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>退出 Mosaic？</AlertDialogTitle>
          <AlertDialogDescription>
            有 {pending} 个文件已打码但未导出，确定退出吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={quit}>
            退出
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
