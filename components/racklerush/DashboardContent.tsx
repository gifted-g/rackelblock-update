import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, Copy, Globe, Code, BarChart3, CreditCard, AlertCircle, Lock, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import ParticipantsAnalytics from "./ParticipantsAnalytics";
import BillingSection from "./BillingSection";
import EditContestModal from "./EditContestModal";
import { useSubscriptionLimits, type SubscriptionTier } from "@/hooks/useSubscriptionLimits";

interface Business {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  primary_color: string;
  logo_url: string | null;
  subscription_tier: SubscriptionTier;
  referral_count_total: number;
  contest_count_total: number;
  currency: string;
  api_access_enabled: boolean;
  payment_status: string;
}

interface Contest {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  prize_info: string;
  end_date: string;
  active: boolean;
  whatsapp_enabled?: boolean;
  show_referral_count?: boolean;
  leaderboard_limit?: number;
  whatsapp_number?: string | null;
  whatsapp_message_template?: string | null;
  referral_enabled?: boolean;
  success_message?: string | null;
}

interface DashboardContentProps {
  business: Business;
  contests: Contest[];
  user: any;
  onShowContestModal: () => void;
  onRefreshContests: () => void;
  onRefreshBusiness: () => void;
}

const DashboardContent = ({
  business,
  contests,
  user,
  onShowContestModal,
  onRefreshContests,
  onRefreshBusiness,
}: DashboardContentProps) => {
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  const { limits, usage } = useSubscriptionLimits(
    business.subscription_tier,
    business.contest_count_total,
    business.referral_count_total
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const getContestUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/c/${business.slug}`;
  };

  const handleCreateContest = () => {
    if (!usage.canCreateContest) {
      toast({
        title: "Contest Limit Reached",
        description: `Your ${business.subscription_tier} plan allows ${limits.maxContests} contest(s). Upgrade to create more.`,
        variant: "destructive",
      });
      return;
    }
    onShowContestModal();
  };

  const handleEditContest = (contest: Contest) => {
    setEditingContest(contest);
    setShowEditModal(true);
  };

  return (
    <>
    <Tabs defaultValue="contests" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="contests">Contests</TabsTrigger>
        <TabsTrigger value="participants" className="flex items-center gap-1">
          <BarChart3 className="w-4 h-4" />
          Participants
        </TabsTrigger>
        <TabsTrigger value="integration">Integration</TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-1">
          <CreditCard className="w-4 h-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      {/* Usage Bar */}
      <Card className="bg-card/50">
        <CardContent className="pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Contests</span>
                <span className="text-sm font-medium">
                  {limits.isUnlimited ? `${business.contest_count_total} / ∞` : `${business.contest_count_total} / ${limits.maxContests}`}
                </span>
              </div>
              <Progress value={usage.contestUsagePercent} className="h-2" />
              {!usage.canCreateContest && (
                <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Limit reached - upgrade to create more
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Referrals</span>
                <span className="text-sm font-medium">
                  {limits.isUnlimited ? `${business.referral_count_total} / ∞` : `${business.referral_count_total} / ${limits.maxReferrals}`}
                </span>
              </div>
              <Progress value={usage.referralUsagePercent} className="h-2" />
              {!usage.canAcceptReferral && (
                <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Limit reached - upgrade for more referrals
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <TabsContent value="contests" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Contests</h2>
          <Button
            onClick={handleCreateContest}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            disabled={!usage.canCreateContest}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Contest
            {!usage.canCreateContest && <Lock className="w-3 h-3 ml-2" />}
          </Button>
        </div>

        {contests.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contests yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first referral contest to start collecting leads
              </p>
              <Button onClick={handleCreateContest} variant="outline" disabled={!usage.canCreateContest}>
                Create Your First Contest
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contests.map((contest) => (
              <Card key={contest.id} className="bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{contest.title}</CardTitle>
                      <CardDescription>Prize: {contest.prize_info}</CardDescription>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contest.active
                          ? "bg-green-500/20 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {contest.active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/c/${business.slug}`}>View Contest</Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditContest(contest)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit Details
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/racklerush/contest/${contest.id}/fields`}>Edit Fields</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="participants">
        <ParticipantsAnalytics businessId={business.id} contests={contests} />
      </TabsContent>

      <TabsContent value="integration" className="space-y-6">
        <div className="grid gap-6">
          {/* Hosted Option */}
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle>Hosted Link</CardTitle>
                  <CardDescription>Share this link with your audience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input value={getContestUrl()} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(getContestUrl(), "Contest URL")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Option - Only for Velocity tier */}
          <Card className={`bg-card/50 ${!limits.apiAccess ? "opacity-60" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Code className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>API Integration</CardTitle>
                    {!limits.apiAccess && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Velocity Plan
                      </Badge>
                    )}
                  </div>
                  <CardDescription>Track referrals from your own website</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {limits.apiAccess ? (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={business.api_key} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(business.api_key, "API Key")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">API Endpoint</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value="https://qkmimtbyskaysadcznvq.supabase.co/functions/v1/racklerush-track-referral"
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            "https://qkmimtbyskaysadcznvq.supabase.co/functions/v1/racklerush-track-referral",
                            "API Endpoint"
                          )
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <Label className="text-sm font-medium">Example Request</Label>
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {`POST /functions/v1/racklerush-track-referral
Headers:
  x-api-key: ${business.api_key}
  Content-Type: application/json

Body:
{
  "referral_code": "abc123"
}`}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    API access is available on the Velocity plan
                  </p>
                  <Button variant="outline" asChild>
                    <a href="#billing">Upgrade to Velocity</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="billing">
        <BillingSection
          business={business}
          userEmail={user?.email || ""}
          onSuccess={onRefreshBusiness}
        />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>Manage your business details and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input value={business.name} readOnly className="mt-1" />
            </div>
            <div>
              <Label>URL Slug</Label>
              <Input value={business.slug} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded-lg border"
                  style={{ backgroundColor: business.primary_color }}
                />
                <Input value={business.primary_color} readOnly />
              </div>
            </div>
            <div>
              <Label>Subscription Tier</Label>
              <div className="mt-1">
                <Badge
                  className={
                    business.subscription_tier === "Velocity"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : business.subscription_tier === "Growth"
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : ""
                  }
                  variant={business.subscription_tier === "Spark" ? "secondary" : "default"}
                >
                  {business.subscription_tier}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <EditContestModal
      open={showEditModal}
      onOpenChange={setShowEditModal}
      contest={editingContest}
      onSuccess={() => {
        setShowEditModal(false);
        setEditingContest(null);
        onRefreshContests();
      }}
    />
    </>
  );
};

export default DashboardContent;
