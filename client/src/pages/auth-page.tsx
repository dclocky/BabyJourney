import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userSchema, loginSchema } from "@shared/schema";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-primary-50/50 flex items-center">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Auth Form - Left Side */}
          <div className="lg:col-span-2">
            <div className="flex justify-center lg:justify-start mb-8">
              <div className="flex items-center text-primary-500">
                <Sprout className="h-8 w-8 mr-2" />
                <h1 className="text-2xl font-bold">BabyJourney</h1>
              </div>
            </div>

            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>
                      Sign in to your account to continue your parenting journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LoginForm onSubmit={loginMutation.mutate} loading={loginMutation.isPending} />
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4 items-center">
                    <div className="text-sm text-muted-foreground">
                      Don't have an account yet?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 text-primary-500" 
                        onClick={() => setActiveTab("register")}
                      >
                        Create one now
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create your account</CardTitle>
                    <CardDescription>
                      Start tracking your pregnancy and baby's journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RegisterForm onSubmit={registerMutation.mutate} loading={registerMutation.isPending} />
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4 items-center">
                    <div className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 text-primary-500" 
                        onClick={() => setActiveTab("login")}
                      >
                        Login
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Hero Section - Right Side */}
          <div className="lg:col-span-3 text-center lg:text-left lg:pl-12">
            <h1 className="text-3xl lg:text-5xl font-bold text-primary-700 leading-tight mb-6">
              Track every precious moment of your pregnancy and baby's journey
            </h1>
            <p className="text-lg text-primary-900/70 mb-8">
              Document your pregnancy week by week, track your baby's growth, save milestones,
              and create memories that will last a lifetime.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <FeatureCard 
                icon="ri-heart-line" 
                title="Pregnancy Tracking" 
                description="Journal your pregnancy journey week by week and track symptoms" 
              />
              <FeatureCard 
                icon="ri-calendar-check-line" 
                title="Appointment Management" 
                description="Never miss important check-ups and vaccinations" 
              />
              <FeatureCard 
                icon="ri-trophy-line" 
                title="Baby Milestones" 
                description="Record first words, steps, teeth and other important moments" 
              />
              <FeatureCard 
                icon="ri-gallery-line" 
                title="Memory Collection" 
                description="Upload and organize photos and memories of your baby" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, loading }: { onSubmit: (data: z.infer<typeof loginSchema>) => void; loading: boolean }) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({ onSubmit, loading }: { onSubmit: (data: z.infer<typeof userSchema>) => void; loading: boolean }) {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a secure password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
}

function FeatureCard({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-primary-100">
      <i className={`${icon} text-2xl text-primary-500 mb-4`}></i>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
