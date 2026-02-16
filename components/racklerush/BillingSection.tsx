import { useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Check, AlertCircle, Crown, Loader2 } from "lucide-react";
import PricingSection from "./PricingSection";
import { PRICING_CONFIG, type SubscriptionTier, type Currency } from "@/hooks/useGeolocation";

interface Business {
  id: string;
  name: string;
  subscription_tier: SubscriptionTier;
  referral_count_total: number;
  contest_count_total: number;
  currency: string;
  api_access_enabled: boolean;
  payment_status: string;
}

interface BillingSectionProps {
  business: Business;
  userEmail: string;
  onSuccess: () => void;
}

// Flutterwave public key - this is a publishable key, safe to include in code
// TODO: Replace with your actual Flutterwave public key
const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-SANDBOXXXXXXXXXXXXXXXXXXX-X";

const BillingSection = ({ business, userEmail, onSuccess }: BillingSectionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<{ tier: SubscriptionTier; currency: Currency } | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const getLimits = (tier: SubscriptionTier) => {
    const limits = {
      Spark: { contests: 1, referrals: 50 },
      Growth: { contests: 2, referrals: 100 },
      Velocity: { contests: -1, referrals: -1 },
    };
    return limits[tier];
  };

  const limits = getLimits(business.subscription_tier);
  const contestUsage = limits.contests === -1 ? '∞' : `${business.contest_count_total}/${limits.contests}`;
  const referralUsage = limits.referrals === -1 ? '∞' : `${business.referral_count_total}/${limits.referrals}`;

  const handleSelectPlan = (tier: SubscriptionTier, currency: Currency) => {
    if (tier === 'Spark') {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan or downgrading is not supported.",
      });
      return;
    }
    setSelectedPlan({ tier, currency });
  };

  const generateTxRef = () => {
    return `rr-${business.id.slice(0, 8)}-${Date.now()}`;
  };

  const getPaymentConfig = () => {
    if (!selectedPlan) return null;
    
    const pricing = PRICING_CONFIG[selectedPlan.currency];
    const planPricing = pricing.plans[selectedPlan.tier];

    return {
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: generateTxRef(),
      amount: planPricing.price,
      currency: selectedPlan.currency,
      payment_options: "card,mobilemoney,ussd,banktransfer",
      customer: {
        email: userEmail,
        phone_number: "",
        name: business.name,
      },
      customizations: {
        title: "RackleRush Subscription",
        description: `${selectedPlan.tier} Plan - Monthly Subscription`,
        logo: "https://rackleblock.com/logo.png",
      },
    };
  };

  const config = getPaymentConfig();
  
  const handleFlutterPayment = useFlutterwave(config || {
    public_key: "",
    tx_ref: "",
    amount: 0,
    currency: "NGN",
    payment_options: "card",
    customer: { email: "", phone_number: "", name: "" },
    customizations: { title: "", description: "", logo: "" },
  });

  const processPayment = async () => {
    if (!selectedPlan || !config) return;

    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        
        if (response.status === "successful") {
          setProcessing(true);
          
          try {
            // Record payment
            const { error: paymentError } = await supabase
              .from('racklerush_payments')
              .insert({
                business_id: business.id,
                amount: config.amount,
                currency: selectedPlan.currency,
                tier: selectedPlan.tier,
                tx_ref: response.tx_ref,
                flw_ref: response.flw_ref,
                status: 'successful',
              });

            if (paymentError) throw paymentError;

            // Update business subscription with dates
            const now = new Date();
            const endDate = new Date(now);
            endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription

            const { error: updateError } = await supabase
              .from('racklerush_businesses')
              .update({
                subscription_tier: selectedPlan.tier,
                currency: selectedPlan.currency,
                payment_status: 'active',
                api_access_enabled: selectedPlan.tier === 'Velocity',
                flutterwave_tx_ref: response.tx_ref,
                subscription_started_at: now.toISOString(),
                subscription_ends_at: endDate.toISOString(),
                last_payment_at: now.toISOString(),
              })
              .eq('id', business.id);

            if (updateError) throw updateError;

            toast({
              title: "Payment Successful!",
              description: `You're now on the ${selectedPlan.tier} plan.`,
            });

            setSelectedPlan(null);
            onSuccess();
          } catch (error: any) {
            toast({
              title: "Error updating subscription",
              description: error.message,
              variant: "destructive",
            });
          } finally {
            setProcessing(false);
          }
        } else {
          toast({
            title: "Payment Failed",
            description: "Your payment was not successful. Please try again.",
            variant: "destructive",
          });
        }
      },
      onClose: () => {
        setSelectedPlan(null);
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Current Plan Status */}
      <Card className="bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </div>
            </div>
            <Badge 
              className={
                business.subscription_tier === 'Velocity' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : business.subscription_tier === 'Growth'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : ''
              }
              variant={business.subscription_tier === 'Spark' ? 'secondary' : 'default'}
            >
              {business.subscription_tier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Contests Used</div>
              <div className="text-2xl font-bold">{contestUsage}</div>
              {limits.contests !== -1 && business.contest_count_total >= limits.contests && (
                <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Limit reached
                </div>
              )}
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Referrals Used</div>
              <div className="text-2xl font-bold">{referralUsage}</div>
              {limits.referrals !== -1 && business.referral_count_total >= limits.referrals && (
                <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Limit reached
                </div>
              )}
            </div>
          </div>

          {business.api_access_enabled && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                API Access Enabled
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Confirmation */}
      {selectedPlan && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Confirm Upgrade
            </CardTitle>
            <CardDescription>
              You're about to upgrade to the {selectedPlan.tier} plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedPlan.tier} Plan</span>
                <span className="text-xl font-bold">
                  {PRICING_CONFIG[selectedPlan.currency].plans[selectedPlan.tier].label}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedPlan(null)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={processPayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay with Flutterwave
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <PricingSection 
        onSelectPlan={handleSelectPlan}
        currentTier={business.subscription_tier}
        loading={processing}
      />
    </div>
  );
};

export default BillingSection;
