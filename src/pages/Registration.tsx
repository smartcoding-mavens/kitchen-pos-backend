
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Registration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    customDomain: '',
    subscriptionPlan: '',
    paymentMethod: '',
    agreeToTerms: false
  });
  const navigate = useNavigate();

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 29,
      features: ['Up to 50 menu items', 'Basic analytics', 'QR code generation', 'Email support']
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 59,
      features: ['Unlimited menu items', 'Advanced analytics', 'Custom branding', 'Priority support', 'Multi-location support']
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 99,
      features: ['Everything in Premium', 'API access', 'White-label solution', 'Dedicated account manager', 'Custom integrations']
    }
  ];

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Registration completed:', formData);
    navigate('/dashboard');
  };

  const StepIndicator = ({ step, title, isActive, isCompleted }: any) => (
    <div className="flex items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        isCompleted ? 'bg-green-500 text-white' : 
        isActive ? 'bg-blue-500 text-white' : 
        'bg-gray-200 text-gray-600'
      }`}>
        {isCompleted ? <CheckCircle className="h-4 w-4" /> : step}
      </div>
      <span className={`ml-2 text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Tee Tours POS</h1>
          <p className="text-gray-600">Register your kitchen and start managing your restaurant operations</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center space-x-8 mb-8">
          <StepIndicator 
            step={1} 
            title="Restaurant Details" 
            isActive={currentStep === 1} 
            isCompleted={currentStep > 1}
          />
          <StepIndicator 
            step={2} 
            title="Choose Plan" 
            isActive={currentStep === 2} 
            isCompleted={currentStep > 2}
          />
          <StepIndicator 
            step={3} 
            title="Payment" 
            isActive={currentStep === 3} 
            isCompleted={false}
          />
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            {/* Step 1: Restaurant Details */}
            {currentStep === 1 && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-6 w-6" />
                    Restaurant Information
                  </CardTitle>
                  <CardDescription>
                    Tell us about your restaurant and set up your custom domain
                  </CardDescription>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="restaurantName">Restaurant Name *</Label>
                    <Input
                      id="restaurantName"
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                      placeholder="The Golf Club Restaurant"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@restaurant.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Restaurant Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Golf Course Drive, City, State 12345"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="customDomain">Custom Domain</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="customDomain"
                        value={formData.customDomain}
                        onChange={(e) => setFormData({...formData, customDomain: e.target.value})}
                        placeholder="your-restaurant"
                      />
                      <span className="text-gray-500">.teetours.com</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Your customers will access your menu at: {formData.customDomain || 'your-restaurant'}.teetours.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Choose Plan */}
            {currentStep === 2 && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Choose Your Subscription Plan</CardTitle>
                  <CardDescription>
                    Select the plan that best fits your restaurant needs
                  </CardDescription>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        formData.subscriptionPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData({...formData, subscriptionPlan: plan.id})}
                    >
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        <div className="text-3xl font-bold text-blue-600 mt-2">
                          ${plan.price}
                          <span className="text-lg text-gray-500">/month</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-6 w-6" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>
                    Complete your registration with payment details
                  </CardDescription>
                </CardHeader>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Order Summary</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span>{subscriptionPlans.find(p => p.id === formData.subscriptionPlan)?.name}</span>
                    <span className="font-bold">
                      ${subscriptionPlans.find(p => p.id === formData.subscriptionPlan)?.price}/month
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardHolder">Cardholder Name *</Label>
                    <Input
                      id="cardHolder"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expiry">Expiry Date *</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button onClick={handleNextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.agreeToTerms}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Registration
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Registration;
