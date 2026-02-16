import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Participant {
  id: string;
  email: string;
  referral_code: string;
  referral_count: number;
}

interface EditReferralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: Participant | null;
  onSuccess: () => void;
}

const EditReferralModal = ({ open, onOpenChange, participant, onSuccess }: EditReferralModalProps) => {
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (participant) {
      setReferralCount(participant.referral_count);
    }
  }, [participant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("racklerush_participants")
        .update({ referral_count: referralCount })
        .eq("id", participant.id);

      if (error) throw error;

      toast({
        title: "Referral count updated!",
        description: `${participant.email} now has ${referralCount} referrals.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Referral Count</DialogTitle>
          <DialogDescription>
            Update the referral count for {participant?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Participant</span>
              <span className="font-medium">{participant?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Referral Code</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                {participant?.referral_code}
              </code>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-referral-count">Referral Count</Label>
            <Input
              id="edit-referral-count"
              type="number"
              min="0"
              value={referralCount}
              onChange={(e) => setReferralCount(parseInt(e.target.value) || 0)}
              className="text-center text-2xl font-bold h-16"
              required
            />
            <p className="text-xs text-muted-foreground text-center">
              Current: {participant?.referral_count} → New: {referralCount}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Count"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditReferralModal;
