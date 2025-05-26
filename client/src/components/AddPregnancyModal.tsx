import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Heart } from "lucide-react";

interface AddPregnancyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddPregnancyModal({ open, onClose, onSuccess }: AddPregnancyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "Baby",
    dueDate: "",
    gender: "",
  });

  const createPregnancyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/children", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          dueDate: data.dueDate,
          gender: data.gender || null,
          isPregnancy: true,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Pregnancy profile created! 🎉",
        description: "Your pregnancy journey tracking has begun.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setFormData({ name: "Baby", dueDate: "", gender: "" });
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pregnancy profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dueDate) {
      toast({
        title: "Required field",
        description: "Please select your due date",
        variant: "destructive",
      });
      return;
    }
    createPregnancyMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Calculate current week based on due date
  const getCurrentWeek = () => {
    if (!formData.dueDate) return null;
    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = 40 - Math.floor(diffDays / 7);
    return Math.max(1, Math.min(40, currentWeek));
  };

  const currentWeek = getCurrentWeek();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-3">
            <Heart className="w-6 h-6 text-pink-600" />
          </div>
          <DialogTitle className="text-center">Start Your Pregnancy Journey</DialogTitle>
          <DialogDescription className="text-center">
            Let's set up your pregnancy tracking profile
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Baby's Name (Optional)</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Baby, Little One, etc."
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
            {currentWeek && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <CalendarDays className="w-4 h-4 mr-1" />
                You're approximately {currentWeek} weeks along
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="gender">Baby's Gender (Optional)</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender (if known)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Girl</SelectItem>
                <SelectItem value="male">Boy</SelectItem>
                <SelectItem value="other">Surprise!</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createPregnancyMutation.isPending}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              {createPregnancyMutation.isPending ? "Creating..." : "Start Journey"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}