import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, BarChart3, Eye, EyeOff, Users, FileText } from "lucide-react";

interface Contest {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  prize_info: string;
  end_date: string;
  active: boolean;
  whatsapp_enabled?: boolean;
  whatsapp_number?: string | null;
  whatsapp_message_template?: string | null;
  show_referral_count?: boolean;
  leaderboard_limit?: number;
  referral_enabled?: boolean;
  success_message?: string | null;
}

interface EditContestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contest: Contest | null;
  onSuccess: () => void;
}

const DEFAULT_WHATSAPP_TEMPLATE = `Hi! I just entered your contest. Here are my details:

{participant_details}

My referral link: {referral_link}`;

const EditContestModal = ({ open, onOpenChange, contest, onSuccess }: EditContestModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prizeInfo, setPrizeInfo] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [showReferralCount, setShowReferralCount] = useState(true);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [successMessage, setSuccessMessage] = useState("Thank you for joining! Share your referral link to climb the leaderboard and win!");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contest) {
      setTitle(contest.title);
      setDescription(contest.description || "");
      setPrizeInfo(contest.prize_info);
      setEndDate(new Date(contest.end_date).toISOString().split("T")[0]);
      setActive(contest.active);
      setWhatsappEnabled(contest.whatsapp_enabled || false);
      setWhatsappNumber(contest.whatsapp_number || "");
      setWhatsappMessageTemplate(contest.whatsapp_message_template || DEFAULT_WHATSAPP_TEMPLATE);
      setShowReferralCount(contest.show_referral_count !== false);
      setLeaderboardLimit(contest.leaderboard_limit || 10);
      setReferralEnabled(contest.referral_enabled !== false);
      setSuccessMessage(contest.success_message || "Thank you for joining! Share your referral link to climb the leaderboard and win!");
    }
  }, [contest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contest) return;

    // Validate WhatsApp number if enabled
    if (whatsappEnabled && !whatsappNumber.trim()) {
      toast({
        title: "WhatsApp number required",
        description: "Please enter a WhatsApp number when enabling WhatsApp redirect.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from("racklerush_contests")
        .update({
          title,
          description,
          prize_info: prizeInfo,
          end_date: new Date(endDate).toISOString(),
          active,
          whatsapp_enabled: whatsappEnabled,
          whatsapp_number: whatsappEnabled ? whatsappNumber.trim().replace(/[^0-9+]/g, '') : null,
          whatsapp_message_template: whatsappEnabled ? whatsappMessageTemplate : null,
          show_referral_count: showReferralCount,
          leaderboard_limit: leaderboardLimit,
          referral_enabled: referralEnabled,
          success_message: successMessage,
        })
        .eq("id", contest.id);

      if (error) throw error;

      toast({
        title: "Contest updated!",
        description: "Your contest has been updated successfully.",
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contest</DialogTitle>
          <DialogDescription>Update your contest details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Contest Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-prize">Prize Information</Label>
              <Input
                id="edit-prize"
                value={prizeInfo}
                onChange={(e) => setPrizeInfo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">End Date</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="edit-active" className="font-medium">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                {active ? "Contest is visible to participants" : "Contest is hidden"}
              </p>
            </div>
            <Switch
              id="edit-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          {/* Contest Mode Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contest Mode
            </h3>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {referralEnabled ? <Users className="w-5 h-5 text-green-500" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <Label htmlFor="edit-referral-enabled" className="font-medium">Enable Referral Contest</Label>
                  <p className="text-sm text-muted-foreground">
                    {referralEnabled ? "Participants can refer others to earn points" : "Data collection only - no referral tracking"}
                  </p>
                </div>
              </div>
              <Switch
                id="edit-referral-enabled"
                checked={referralEnabled}
                onCheckedChange={setReferralEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-success-message">Success Message</Label>
              <Textarea
                id="edit-success-message"
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                rows={3}
                placeholder="Message shown to participants after submission"
              />
              <p className="text-xs text-muted-foreground">
                This message is displayed after a participant submits their information
              </p>
            </div>
          </div>

          {/* Leaderboard Settings - Only show if referral is enabled */}
          {referralEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Leaderboard Settings
              </h3>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {showReferralCount ? <Eye className="w-5 h-5 text-green-500" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <Label htmlFor="edit-show-referral-count" className="font-medium">Show Referral Counts</Label>
                    <p className="text-sm text-muted-foreground">
                      Display referral counts on the public leaderboard
                    </p>
                  </div>
                </div>
                <Switch
                  id="edit-show-referral-count"
                  checked={showReferralCount}
                  onCheckedChange={setShowReferralCount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-leaderboard-limit">Top Referrers to Display</Label>
                <Select
                  value={leaderboardLimit.toString()}
                  onValueChange={(value) => setLeaderboardLimit(parseInt(value))}
                >
                  <SelectTrigger id="edit-leaderboard-limit">
                    <SelectValue placeholder="Select number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Top 3</SelectItem>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="15">Top 15</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="25">Top 25</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Number of top referrers visible on the public leaderboard
                </p>
              </div>
            </div>
          )}

          {/* WhatsApp Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp Redirect
            </h3>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="edit-whatsapp-enabled" className="font-medium">Enable WhatsApp Redirect</Label>
                <p className="text-sm text-muted-foreground">
                  Redirect contestants to WhatsApp after submission
                </p>
              </div>
              <Switch
                id="edit-whatsapp-enabled"
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
              />
            </div>

            {whatsappEnabled && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="edit-whatsapp-number">WhatsApp Number *</Label>
                  <Input
                    id="edit-whatsapp-number"
                    placeholder="+234XXXXXXXXXX"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +234 for Nigeria, +1 for USA)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-whatsapp-template">Message Template</Label>
                  <Textarea
                    id="edit-whatsapp-template"
                    value={whatsappMessageTemplate}
                    onChange={(e) => setWhatsappMessageTemplate(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1 rounded">{'{participant_details}'}</code> for form data and <code className="bg-muted px-1 rounded">{'{referral_link}'}</code> for referral URL
                  </p>
                </div>
              </div>
            )}
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
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContestModal;
