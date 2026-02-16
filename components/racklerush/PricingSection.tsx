import { motion } from "framer-motion";
import { Check, Zap, Rocket, Crown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGeolocation, PRICING_CONFIG, type SubscriptionTier, type Currency } from "@/hooks/useGeolocation";

interface PricingSectionProps {
  onSelectPlan: (tier: SubscriptionTier, currency: Currency) => void;
  currentTier?: SubscriptionTier;
  loading?: boolean;
}

const plans: {
  tier: SubscriptionTier;
  icon: React.ElementType;
  description: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    tier: 'Spark',
    icon: Zap,
    description: 'Perfect for trying out viral referrals',
    features: [
      '1 active contest',
      'Up to 50 referrals',
      'Basic analytics',
      'Hosted contest page',
    ],
  },
  {
    tier: 'Growth',
    icon: Rocket,
    description: 'For growing businesses ready to scale',
    features: [
      '2 active contests',
      'Up to 100 referrals',
      'Advanced analytics',
      'Custom branding',
      'CSV export',
      'Priority support',
    ],
    popular: true,
  },
  {
    tier: 'Velocity',
    icon: Crown,
    description: 'Unlimited power for enterprise needs',
    features: [
      'Unlimited contests',
      'Unlimited referrals',
      'Full analytics suite',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'White-label option',
    ],
  },
];

const PricingSection = ({ onSelectPlan, currentTier, loading }: PricingSectionProps) => {
  const geo = useGeolocation();
  
  const currency: Currency = geo.isNigeria ? 'NGN' : 'USD';
  const pricing = PRICING_CONFIG[currency];

  if (geo.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-2 text-muted-foreground">Detecting your location...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge variant="outline" className="mb-4">
          {geo.isNigeria ? '🇳🇬 Nigeria' : '🌍 International'} Pricing
        </Badge>
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          {geo.isNigeria 
            ? 'Prices shown in Nigerian Naira (₦)' 
            : 'Prices shown in US Dollars ($)'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const planPricing = pricing.plans[plan.tier];
          const Icon = plan.icon;
          const isCurrentPlan = currentTier === plan.tier;
          
          return (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`relative h-full ${
                  plan.popular 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20' 
                    : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500">Current Plan</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                      : 'bg-muted'
                  }`}>
                    <Icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-foreground'}`} />
                  </div>
                  <CardTitle>{plan.tier}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <span className="text-4xl font-bold">
                      {planPricing.label}
                    </span>
                    {plan.tier !== 'Spark' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed monthly
                      </p>
                    )}
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => onSelectPlan(plan.tier, currency)}
                    disabled={isCurrentPlan || loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.tier === 'Spark' ? (
                      'Get Started Free'
                    ) : (
                      `Upgrade to ${plan.tier}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PricingSection;
