import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subYears, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CalendarIcon, 
  ChevronRight, 
  ChevronLeft,
  User,
  Briefcase,
  Heart,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingData {
  username: string;
  birthDate: Date | undefined;
  status: string;
  workSector: string;
  interests: string[];
}

interface OnboardingFormProps {
  onComplete: (data: OnboardingData) => void;
  isLoading: boolean;
}

const STATUS_OPTIONS = [
  { value: "student", label: "Étudiant(e)" },
  { value: "worker", label: "En activité professionnelle" },
  { value: "job_seeker", label: "En recherche d'emploi" },
  { value: "retired", label: "Retraité(e)" },
  { value: "other", label: "Autre" },
];

const WORK_SECTORS = [
  { value: "tech", label: "Technologie / Informatique" },
  { value: "health", label: "Santé / Médical" },
  { value: "education", label: "Éducation / Formation" },
  { value: "finance", label: "Finance / Banque" },
  { value: "commerce", label: "Commerce / Vente" },
  { value: "industry", label: "Industrie / Production" },
  { value: "arts", label: "Arts / Culture / Média" },
  { value: "legal", label: "Droit / Juridique" },
  { value: "construction", label: "BTP / Construction" },
  { value: "hospitality", label: "Hôtellerie / Restauration" },
  { value: "transport", label: "Transport / Logistique" },
  { value: "agriculture", label: "Agriculture / Environnement" },
  { value: "public", label: "Secteur public / Administration" },
  { value: "nonprofit", label: "Associatif / ONG" },
  { value: "student_sector", label: "Études en cours" },
  { value: "other_sector", label: "Autre" },
];

const INTERESTS = [
  { value: "politics", label: "Politique", emoji: "🏛️" },
  { value: "economy", label: "Économie", emoji: "📈" },
  { value: "technology", label: "Technologie", emoji: "💻" },
  { value: "science", label: "Sciences", emoji: "🔬" },
  { value: "environment", label: "Environnement", emoji: "🌍" },
  { value: "culture", label: "Culture", emoji: "🎭" },
  { value: "literature", label: "Littérature", emoji: "📚" },
  { value: "cinema", label: "Cinéma", emoji: "🎬" },
  { value: "music", label: "Musique", emoji: "🎵" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "gaming", label: "Jeux vidéo", emoji: "🎮" },
  { value: "health", label: "Santé / Bien-être", emoji: "🏥" },
  { value: "food", label: "Gastronomie", emoji: "🍳" },
  { value: "travel", label: "Voyages", emoji: "✈️" },
  { value: "fashion", label: "Mode", emoji: "👗" },
  { value: "art", label: "Art", emoji: "🎨" },
  { value: "history", label: "Histoire", emoji: "📜" },
  { value: "social", label: "Société", emoji: "👥" },
  { value: "international", label: "International", emoji: "🌐" },
  { value: "education", label: "Éducation", emoji: "🎓" },
];

const STEPS = [
  { id: 1, title: "Identité", icon: User },
  { id: 2, title: "Situation", icon: Briefcase },
  { id: 3, title: "Centres d'intérêt", icon: Heart },
];

const OnboardingForm = ({ onComplete, isLoading }: OnboardingFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    username: "",
    birthDate: undefined,
    status: "",
    workSector: "",
    interests: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const minDate = subYears(new Date(), 100);
  const maxDate = subYears(new Date(), 15);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = "Le pseudo doit contenir au moins 3 caractères";
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = "Uniquement lettres, chiffres et underscores";
      }
      
      if (!formData.birthDate) {
        newErrors.birthDate = "La date de naissance est requise";
      } else if (isAfter(formData.birthDate, maxDate)) {
        newErrors.birthDate = "Vous devez avoir au moins 15 ans";
      }
    }

    if (step === 2) {
      if (!formData.status) {
        newErrors.status = "Veuillez sélectionner votre statut";
      }
      if (!formData.workSector) {
        newErrors.workSector = "Veuillez sélectionner un secteur";
      }
    }

    if (step === 3) {
      if (formData.interests.length < 3) {
        newErrors.interests = "Sélectionnez au moins 3 centres d'intérêt";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
    setErrors(prev => ({ ...prev, interests: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
              currentStep >= step.id 
                ? "bg-primary border-primary text-primary-foreground" 
                : "border-muted-foreground/30 text-muted-foreground"
            )}>
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <span className={cn(
              "ml-2 text-sm font-medium hidden sm:inline",
              currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div className={cn(
                "w-12 sm:w-20 h-0.5 mx-2 sm:mx-4",
                currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Identity */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Créez votre identité</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ces informations nous permettent de personnaliser votre expérience
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Pseudo *</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setErrors({ ...errors, username: "" });
                }}
                placeholder="votre_pseudo"
                className={cn(errors.username && "border-destructive")}
                maxLength={30}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
              <p className="text-xs text-muted-foreground">
                3-30 caractères, lettres, chiffres et underscores uniquement
              </p>
            </div>

            <div className="space-y-2">
              <Label>Date de naissance *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.birthDate && "text-muted-foreground",
                      errors.birthDate && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.birthDate ? (
                      format(formData.birthDate, "d MMMM yyyy", { locale: fr })
                    ) : (
                      "Sélectionnez votre date de naissance"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.birthDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, birthDate: date });
                      setErrors({ ...errors, birthDate: "" });
                    }}
                    disabled={(date) => isAfter(date, maxDate) || date < minDate}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear() - 15}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.birthDate && (
                <p className="text-xs text-destructive">{errors.birthDate}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Vous devez avoir au moins 15 ans pour utiliser HERMÈS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Status */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Votre situation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Aidez-nous à mieux comprendre votre profil
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Quel est votre statut actuel ? *</Label>
              <RadioGroup
                value={formData.status}
                onValueChange={(value) => {
                  setFormData({ ...formData, status: value });
                  setErrors({ ...errors, status: "" });
                }}
                className="grid gap-2"
              >
                {STATUS_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      formData.status === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => {
                      setFormData({ ...formData, status: option.value });
                      setErrors({ ...errors, status: "" });
                    }}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Secteur d'activité / d'études *</Label>
              <Select
                value={formData.workSector}
                onValueChange={(value) => {
                  setFormData({ ...formData, workSector: value });
                  setErrors({ ...errors, workSector: "" });
                }}
              >
                <SelectTrigger className={cn(errors.workSector && "border-destructive")}>
                  <SelectValue placeholder="Sélectionnez votre secteur" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_SECTORS.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.workSector && (
                <p className="text-xs text-destructive">{errors.workSector}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Interests */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Vos centres d'intérêt</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sélectionnez au moins 3 sujets qui vous passionnent
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest.value}
                type="button"
                onClick={() => toggleInterest(interest.value)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                  formData.interests.includes(interest.value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-foreground"
                )}
              >
                <span className="text-lg">{interest.emoji}</span>
                <span className="text-sm font-medium truncate">{interest.label}</span>
                {formData.interests.includes(interest.value) && (
                  <Check className="w-4 h-4 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          
          {errors.interests && (
            <p className="text-xs text-destructive text-center">{errors.interests}</p>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            {formData.interests.length} sélectionné{formData.interests.length > 1 ? "s" : ""} 
            {formData.interests.length < 3 && ` (minimum 3)`}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className={cn(currentStep === 1 && "invisible")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            "Création..."
          ) : currentStep === 3 ? (
            <>
              Créer mon compte
              <Check className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Continuer
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingForm;
