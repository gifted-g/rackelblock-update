import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, GripVertical, MessageCircle, Info, BarChart3, Eye, EyeOff, Users, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CustomField {
  id: string;
  label: string;
  field_type: 'text' | 'number' | 'email' | 'phone' | 'url';
  is_required: boolean;
}

interface CreateContestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onSuccess: () => void;
}

const DEFAULT_WHATSAPP_TEMPLATE = `Hi! I just entered your contest. Here are my details:

{participant_details}

My referral link: {referral_link}`;

const CreateContestModal = ({ open, onOpenChange, businessId, onSuccess }: CreateContestModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prizeInfo, setPrizeInfo] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: crypto.randomUUID(), label: "Full Name", field_type: "text", is_required: true },
    { id: crypto.randomUUID(), label: "Email", field_type: "email", is_required: true },
  ]);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [showReferralCount, setShowReferralCount] = useState(true);
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [successMessage, setSuccessMessage] = useState("Thank you for joining! Share your referral link to climb the leaderboard and win!");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addField = () => {
    setCustomFields([
      ...customFields,
      { id: crypto.randomUUID(), label: "", field_type: "text", is_required: false },
    ]);
  };

  const removeField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(customFields.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Create contest with WhatsApp, leaderboard, and referral settings
      const { data: contest, error: contestError } = await supabase
        .from('racklerush_contests')
        .insert({
          business_id: businessId,
          title,
          description,
          prize_info: prizeInfo,
          end_date: new Date(endDate).toISOString(),
          whatsapp_enabled: whatsappEnabled,
          whatsapp_number: whatsappEnabled ? whatsappNumber.trim().replace(/[^0-9+]/g, '') : null,
          whatsapp_message_template: whatsappEnabled ? whatsappMessageTemplate : null,
          show_referral_count: showReferralCount,
          leaderboard_limit: leaderboardLimit,
          referral_enabled: referralEnabled,
          success_message: successMessage,
        })
        .select()
        .single();

      if (contestError) throw contestError;

      // Create custom fields
      const fieldsToInsert = customFields
        .filter(f => f.label.trim())
        .map((f, index) => ({
          contest_id: contest.id,
          label: f.label,
          field_type: f.field_type,
          is_required: f.is_required,
          sort_order: index,
        }));

      if (fieldsToInsert.length > 0) {
        const { error: fieldsError } = await supabase
          .from('racklerush_contest_fields')
          .insert(fieldsToInsert);

        if (fieldsError) throw fieldsError;
      }

      toast({
        title: "Contest created!",
        description: "Your referral contest is now live.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPrizeInfo("");
      setEndDate("");
      setCustomFields([
        { id: crypto.randomUUID(), label: "Full Name", field_type: "text", is_required: true },
        { id: crypto.randomUUID(), label: "Email", field_type: "email", is_required: true },
      ]);
      setWhatsappEnabled(false);
      setWhatsappNumber("");
      setWhatsappMessageTemplate(DEFAULT_WHATSAPP_TEMPLATE);
      setShowReferralCount(true);
      setLeaderboardLimit(10);
      setReferralEnabled(true);
      setSuccessMessage("Thank you for joining! Share your referral link to climb the leaderboard and win!");
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contest</DialogTitle>
          <DialogDescription>
            Set up a new referral contest with custom fields
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Contest Details
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Contest Title</Label>
              <Input
                id="title"
                placeholder="Win a Free iPhone 15!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your contest and how participants can win..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prize">Prize Information</Label>
                <Input
                  id="prize"
                  placeholder="iPhone 15 Pro Max"
                  value={prizeInfo}
                  onChange={(e) => setPrizeInfo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Form Fields
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  
                  <Input
                    placeholder="Field label"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="flex-1"
                  />
                  
                  <Select
                    value={field.field_type}
                    onValueChange={(value: any) => updateField(field.id, { field_type: value })}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.is_required}
                      onCheckedChange={(checked) => updateField(field.id, { is_required: checked })}
                    />
                    <span className="text-xs text-muted-foreground w-16">
                      {field.is_required ? "Required" : "Optional"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(field.id)}
                    className="flex-shrink-0"
                    disabled={customFields.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Contest Mode Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contest Mode
            </h3>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {referralEnabled ? <Users className="w-5 h-5 text-green-500" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <Label htmlFor="referral-enabled" className="font-medium">Enable Referral Contest</Label>
                  <p className="text-sm text-muted-foreground">
                    {referralEnabled ? "Participants can refer others to earn points" : "Data collection only - no referral tracking"}
                  </p>
                </div>
              </div>
              <Switch
                id="referral-enabled"
                checked={referralEnabled}
                onCheckedChange={setReferralEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="success-message">Success Message</Label>
              <Textarea
                id="success-message"
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
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Leaderboard Settings
              </h3>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {showReferralCount ? <Eye className="w-5 h-5 text-green-500" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <Label htmlFor="show-referral-count" className="font-medium">Show Referral Counts</Label>
                    <p className="text-sm text-muted-foreground">
                      Display referral counts on the public leaderboard
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-referral-count"
                  checked={showReferralCount}
                  onCheckedChange={setShowReferralCount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaderboard-limit">Top Referrers to Display</Label>
                <Select
                  value={leaderboardLimit.toString()}
                  onValueChange={(value) => setLeaderboardLimit(parseInt(value))}
                >
                  <SelectTrigger>
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

          {/* WhatsApp Redirect (Optional) */}
          <Collapsible>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Redirect (Optional)
                </h3>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="p-3 rounded-lg bg-blue-500/10 text-sm text-muted-foreground mb-4">
                  When enabled, after a contestant submits, they will be redirected to WhatsApp with a pre-filled message containing their details and referral link.
                </div>
              </CollapsibleContent>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="whatsapp-enabled" className="font-medium">Enable WhatsApp Redirect</Label>
                  <p className="text-sm text-muted-foreground">
                    Redirect contestants to WhatsApp after submission
                  </p>
                </div>
                <Switch
                  id="whatsapp-enabled"
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                />
              </div>

              {whatsappEnabled && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">WhatsApp Number *</Label>
                    <Input
                      id="whatsapp-number"
                      placeholder="+234XXXXXXXXXX"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +234 for Nigeria, +1 for USA)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-template">Message Template</Label>
                    <Textarea
                      id="whatsapp-template"
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
          </Collapsible>

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
                  Creating...
                </>
              ) : (
                "Create Contest"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContestModal;
