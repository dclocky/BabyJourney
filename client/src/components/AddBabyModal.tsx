import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Baby, Calendar } from "lucide-react";

interface AddBabyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddBabyModal({ open, onClose, onSuccess }: AddBabyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    gender: "",
  });

  const createBabyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/children", {
        name: data.name,
        birthDate: data.birthDate, // Send as string, server will handle conversion
        gender: data.gender || null,
        isPregnancy: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Baby profile created! 🎉",
        description: "Your baby's tracking journey has begun.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setFormData({ name: "", birthDate: "", gender: "" });
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create baby profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) {
      toast({
        title: "Required fields",
        description: "Please fill in your baby's name and birth date",
        variant: "destructive",
      });
      return;
    }
    
    // Convert birthDate to proper string format for API
    const submitData = {
      name: formData.name,
      birthDate: formData.birthDate, // Already a string from input
      gender: formData.gender
    };
    
    createBabyMutation.mutate(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Calculate age based on birth date
  const getAge = () => {
    if (!formData.birthDate) return null;
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const diffTime = today.getTime() - birthDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days old`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} old`;
    }
  };

  const age = getAge();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-3">
            <Baby className="w-6 h-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Add Your Baby</DialogTitle>
          <DialogDescription className="text-center">
            Create a profile to track your little one's journey
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Baby's Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your baby's name"
              required
            />
          </div>

          <div>
            <Label htmlFor="birthDate">Birth Date *</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {age && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Your baby is {age}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Girl</SelectItem>
                <SelectItem value="male">Boy</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createBabyMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createBabyMutation.isPending ? "Creating..." : "Add Baby"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}