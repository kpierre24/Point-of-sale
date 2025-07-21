"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge, StatusBadge, InventoryStatus, OrderStatus } from "@/components/ui/badge"
import { FormFieldWrapper } from "@/components/ui/form-field"
import { PageTransition, StaggeredList, LoadingTransition, HoverCard } from "@/components/ui/page-transition"
import { AnimatedState, AnimatedNotification, AnimatedProgress } from "@/components/ui/animated-state"
import { useMicroInteractions, useStaggeredAnimation } from "@/hooks/use-micro-interactions"
import { DollarSign, Package, TrendingUp, ShoppingCart, Users, AlertCircle } from "lucide-react"

export function MicroInteractionsDemo() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [animatedState, setAnimatedState] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [showNotification, setShowNotification] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [inputValue, setInputValue] = React.useState("")
  const [selectValue, setSelectValue] = React.useState("")

  const { interactionProps } = useMicroInteractions({
    scale: 1.05,
    shadow: true,
    glow: false
  })

  const { triggerStaggeredAnimation, isItemVisible } = useStaggeredAnimation(6, 150)

  React.useEffect(() => {
    // Trigger staggered animation on mount
    triggerStaggeredAnimation()
  }, [triggerStaggeredAnimation])

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setAnimatedState("loading")
    
    setTimeout(() => {
      setIsLoading(false)
      setAnimatedState("success")
      setShowNotification(true)
    }, 2000)
  }

  const handleProgressDemo = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const demoCards = [
    { title: "Total Revenue", value: "$12,450", icon: DollarSign, trend: "+12.5%" },
    { title: "Products Sold", value: "1,234", icon: Package, trend: "+8.2%" },
    { title: "Growth Rate", value: "15.3%", icon: TrendingUp, trend: "+2.1%" },
    { title: "Active Users", value: "856", icon: Users, trend: "+5.7%" },
    { title: "Orders Today", value: "42", icon: ShoppingCart, trend: "+18.9%" },
    { title: "Low Stock Items", value: "7", icon: AlertCircle, trend: "-2 items" },
  ]

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <PageTransition direction="up">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Micro-Interactions Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            Showcasing smooth transitions, hover effects, and interactive feedback
          </p>
        </div>
      </PageTransition>

      {/* Button Interactions */}
      <PageTransition direction="up" delay={200}>
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Button Interactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="success">Success Button</Button>
              <Button variant="warning">Warning Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={handleLoadingDemo} loading={isLoading}>
                {isLoading ? "Processing..." : "Test Loading State"}
              </Button>
              <Button onClick={handleProgressDemo}>
                Start Progress Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageTransition>

      {/* Form Interactions */}
      <PageTransition direction="up" delay={400}>
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Form Interactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldWrapper
                label="Product Name"
                required
                hint="Enter the product name"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter product name..."
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                label="Category"
                required
                error={selectValue === "error" ? "Please select a valid category" : undefined}
                success={selectValue === "electronics" ? "Great choice!" : undefined}
              >
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="error">Error Demo</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>
          </CardContent>
        </Card>
      </PageTransition>

      {/* Metric Cards with Staggered Animation */}
      <PageTransition direction="up" delay={600}>
        <Card>
          <CardHeader>
            <CardTitle>Animated Metric Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoCards.map((card, index) => (
                <div
                  key={card.title}
                  className={`transition-all duration-500 ease-out transform-gpu ${
                    isItemVisible(index) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <MetricCard
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    trend={card.trend}
                    trendDirection="up"
                    variant="interactive"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageTransition>

      {/* Status Badges */}
      <PageTransition direction="up" delay={800}>
        <Card>
          <CardHeader>
            <CardTitle>Interactive Status Badges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <StatusBadge variant="success">In Stock</StatusBadge>
              <StatusBadge variant="warning">Low Stock</StatusBadge>
              <StatusBadge variant="error">Out of Stock</StatusBadge>
              <StatusBadge variant="pending">Processing</StatusBadge>
              <StatusBadge variant="info">Information</StatusBadge>
            </div>
            
            <div className="space-y-2">
              <InventoryStatus stockLevel={50} showLabel />
              <InventoryStatus stockLevel={5} showLabel />
              <InventoryStatus stockLevel={0} showLabel />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <OrderStatus status="pending" />
              <OrderStatus status="processing" />
              <OrderStatus status="completed" />
              <OrderStatus status="cancelled" />
            </div>
          </CardContent>
        </Card>
      </PageTransition>

      {/* Animated States */}
      <PageTransition direction="up" delay={1000}>
        <Card>
          <CardHeader>
            <CardTitle>Animated State Transitions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatedState
              state={animatedState}
              message={
                animatedState === "loading" ? "Processing your request..." :
                animatedState === "success" ? "Operation completed successfully!" :
                animatedState === "error" ? "An error occurred. Please try again." :
                "Ready to process"
              }
              autoReset
              resetDelay={3000}
            />
            
            <AnimatedProgress
              value={progress}
              showLabel
              label="Demo Progress"
              color="primary"
            />
          </CardContent>
        </Card>
      </PageTransition>

      {/* Custom Hover Card */}
      <PageTransition direction="up" delay={1200}>
        <Card>
          <CardHeader>
            <CardTitle>Custom Hover Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <HoverCard hoverScale={1.05} hoverShadow>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Hover Effect 1</h3>
                  <p className="text-sm text-blue-700">Subtle scale and shadow</p>
                </div>
              </HoverCard>
              
              <HoverCard hoverScale={1.08} hoverShadow>
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold text-green-900">Hover Effect 2</h3>
                  <p className="text-sm text-green-700">More pronounced scale</p>
                </div>
              </HoverCard>
              
              <div {...interactionProps}>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Custom Hook</h3>
                  <p className="text-sm text-purple-700">Using micro-interactions hook</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageTransition>

      {/* Loading Transition Demo */}
      <PageTransition direction="up" delay={1400}>
        <Card>
          <CardHeader>
            <CardTitle>Loading State Transitions</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingTransition isLoading={isLoading}>
              <div className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Content Area</h3>
                <p className="text-muted-foreground">
                  This content smoothly transitions when loading states change.
                  Click the "Test Loading State" button above to see the effect.
                </p>
              </div>
            </LoadingTransition>
          </CardContent>
        </Card>
      </PageTransition>

      {/* Notification */}
      <AnimatedNotification
        type="success"
        title="Demo Completed!"
        description="All micro-interactions are working smoothly."
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        autoClose
        duration={4000}
      />
    </div>
  )
}