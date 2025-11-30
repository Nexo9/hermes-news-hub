import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Calendar } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  onFilterChange: (filters: {
    category: string;
    location: string;
    search: string;
    timeFilter: string;
  }) => void;
}

const categories = ["Toutes", "Politique", "Économie", "Technologie", "Science", "Culture", "Sport", "Santé"];
const locations = ["Toutes", "France", "Europe", "Amérique", "Asie", "Afrique", "Océanie", "Monde"];

export const FilterBar = ({ onFilterChange }: FilterBarProps) => {
  const [category, setCategory] = useState("Toutes");
  const [location, setLocation] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (newFilters: Partial<{ category: string; location: string; search: string; timeFilter: string }>) => {
    const updatedFilters = {
      category: newFilters.category ?? category,
      location: newFilters.location ?? location,
      search: newFilters.search ?? search,
      timeFilter: newFilters.timeFilter ?? timeFilter,
    };

    if (newFilters.category !== undefined) setCategory(newFilters.category);
    if (newFilters.location !== undefined) setLocation(newFilters.location);
    if (newFilters.search !== undefined) setSearch(newFilters.search);
    if (newFilters.timeFilter !== undefined) setTimeFilter(newFilters.timeFilter);

    onFilterChange(updatedFilters);
  };

  const resetFilters = () => {
    setCategory("Toutes");
    setLocation("Toutes");
    setSearch("");
    setTimeFilter("all");
    onFilterChange({ category: "Toutes", location: "Toutes", search: "", timeFilter: "all" });
  };

  const hasActiveFilters = category !== "Toutes" || location !== "Toutes" || search !== "" || timeFilter !== "all";

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher des actualités..."
          value={search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="pl-10 pr-4 h-12 bg-card border-border focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 border-border hover:border-primary hover:bg-primary/10"
        >
          <Filter className="w-4 h-4" />
          Filtres MST {hasActiveFilters && <span className="text-primary">({category !== "Toutes" ? 1 : 0}+{location !== "Toutes" ? 1 : 0})</span>}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-2 text-muted-foreground hover:text-primary"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card/50 rounded-lg border border-border animate-fade-in">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Catégorie</label>
            <Select value={category} onValueChange={(value) => handleFilterChange({ category: value })}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Localisation</label>
            <Select value={location} onValueChange={(value) => handleFilterChange({ location: value })}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Période
            </label>
            <Select value={timeFilter} onValueChange={(value) => handleFilterChange({ timeFilter: value })}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute période</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois-ci</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
