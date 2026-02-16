import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ContestField {
  id: string;
  label: string;
  field_type: string;
  is_required: boolean;
}

interface AddParticipantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestId: string;
  onSuccess: () => void;
}

const AddParticipantModal = ({ open, onOpenChange, contestId, onSuccess }: AddParticipantModalProps) => {
  const [email, setEmail] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referredByCode, setReferredByCode] = useState("");
  const [joinedContest, setJoinedContest] = useState(true);
  const [fields, setFields] = useState<ContestField[]>([]);
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && contestId) {
      fetchFields();
    }
  }, [open, contestId]);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from("racklerush_contest_fields")
      .select("id, label, field_type, is_required")
      .eq("contest_id", contestId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching fields:", error);
      return;
    }

    setFields(data || []);
    // Initialize custom data state
    const initialData: Record<string, string> = {};
    data?.forEach((field) => {
      initialData[field.id] = "";
    });
    setCustomData(initialData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create participant
      const { data: participant, error: participantError } = await supabase
        .from("racklerush_participants")
        .insert({
          contest_id: contestId,
          email: email.trim().toLowerCase(),
          referral_count: referralCount,
          referred_by_code: referredByCode.trim() || null,
          joined_contest: joinedContest,
        })
        .select()
        .single();

      if (participantError) {
        if (participantError.code === "23505") {
          throw new Error("A participant with this email already exists in this contest.");
        }
        throw participantError;
      }

      // Save custom field data
      const fieldDataToInsert = Object.entries(customData)
        .filter(([_, value]) => value.trim())
        .map(([fieldId, value]) => ({
          participant_id: participant.id,
          field_id: fieldId,
          value: value.trim(),
        }));

      if (fieldDataToInsert.length > 0) {
        const { error: dataError } = await supabase
          .from("racklerush_participant_data")
          .insert(fieldDataToInsert);

        if (dataError) throw dataError;
      }

      toast({
        title: "Participant added!",
        description: `${email} has been added to the contest.`,
      });

      // Reset form
      setEmail("");
      setReferralCount(0);
      setReferredByCode("");
      setJoinedContest(true);
      setCustomData({});
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

  const getInputType = (fieldType: string) => {
    switch (fieldType) {
      case "email":
        return "email";
      case "phone":
        return "tel";
      case "number":
        return "number";
      case "url":
        return "url";
      default:
        return "text";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Participant Manually</DialogTitle>
          <DialogDescription>
            Add a new participant to this contest with custom data
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-email">Email *</Label>
            <Input
              id="add-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="participant@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-referrals">Starting Referral Count</Label>
              <Input
                id="add-referrals"
                type="number"
                min="0"
                value={referralCount}
                onChange={(e) => setReferralCount(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-referred-by">Referred By Code</Label>
              <Input
                id="add-referred-by"
                value={referredByCode}
                onChange={(e) => setReferredByCode(e.target.value)}
                placeholder="abc123"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <input
              type="checkbox"
              id="add-joined"
              checked={joinedContest}
              onChange={(e) => setJoinedContest(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="add-joined" className="cursor-pointer">
              Mark as joined contest
            </Label>
          </div>

          {fields.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Custom Fields
              </h4>
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`}>
                    {field.label} {field.is_required && "*"}
                  </Label>
                  <Input
                    id={`field-${field.id}`}
                    type={getInputType(field.field_type)}
                    value={customData[field.id] || ""}
                    onChange={(e) =>
                      setCustomData({ ...customData, [field.id]: e.target.value })
                    }
                    required={field.is_required}
                  />
                </div>
              ))}
            </div>
          )}

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
                  Adding...
                </>
              ) : (
                "Add Participant"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParticipantModal;
