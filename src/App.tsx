import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConsentModal } from "@/components/ConsentModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import AdminDashboard from "./pages/AdminDashboard";
import Favorites from "./pages/Favorites";
import NewsMap from "./pages/NewsMap";
import TermsOfUse from "./pages/TermsOfUse";
import Pricing from "./pages/Pricing";
import MiniGames from "./pages/MiniGames";
import WhatPeopleSay from "./pages/WhatPeopleSay";
import Contributions from "./pages/Contributions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConsentModal>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/search" element={<Search />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/map" element={<NewsMap />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/games" element={<MiniGames />} />
            <Route path="/discussions" element={<WhatPeopleSay />} />
            <Route path="/contributions" element={<Contributions />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ConsentModal>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
