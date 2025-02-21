import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CustomerInputForm from "@/components/readers/CustomerInputForm";

interface CustomerInfoButtonProps {
  customerInfo?: {
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthHour: string;
  };
  onSave: (info: any) => void;
}

export function CustomerInfoButton({
  customerInfo,
  onSave,
}: CustomerInfoButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-4 text-sm hover:bg-orange-500/10"
        >
          {customerInfo
            ? `${customerInfo.birthYear}年${customerInfo.birthMonth}月${customerInfo.birthDay}日${customerInfo.birthHour}时`
            : "请输入生辰"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>生辰信息</DialogTitle>
        </DialogHeader>
        <CustomerInputForm
          defaultValues={customerInfo}
          onSubmit={(data) => {
            onSave(data);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
